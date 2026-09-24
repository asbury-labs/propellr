import { lstat } from "node:fs/promises";
import { createConnection } from "node:net";
import type { Socket } from "node:net";
import { dirname } from "node:path";
import { z } from "zod";
import type { Commands, EventDelivery, Reply, SessionClient } from "../contracts.js";
import type { CommandName } from "../validation.js";
import { FRAME_LIMIT, receiveFrames, RESPONSE_LIMIT, sendFrame } from "./framing.js";
import { BoundedStream } from "./stream.js";

const diagnosticSchema = z.object({ code: z.string(), message: z.string() });
const replySchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), value: z.unknown() }),
  z.object({ ok: z.literal(false), diagnostic: diagnosticSchema }),
]);
const serverFrame = z.union([
  z.object({ kind: z.literal("hello"), ok: z.literal(true), lease: z.string().uuid() }),
  z.object({ kind: z.literal("hello"), ok: z.literal(false), code: z.string() }),
  z.object({ kind: z.literal("reply"), requestId: z.string(), reply: replySchema }),
  z.object({
    kind: z.literal("delivery"),
    requestId: z.string(),
    delivery: z.object({ type: z.enum(["event", "gap"]) }).passthrough(),
  }),
  z.object({ kind: z.literal("complete"), requestId: z.string() }),
  z.object({ kind: z.literal("protocol-error"), diagnostic: diagnosticSchema }),
]);
type Pending = {
  readonly command: CommandName;
  readonly resolve: (reply: Reply<unknown>) => void;
  readonly reject: (error: Error) => void;
};

// Validates framing/envelopes from a filesystem-trusted host. Full output schemas are deferred.
export class LocalClient implements SessionClient {
  private readonly pending = new Map<string, Pending>();
  private stream:
    | { requestId: string; values: BoundedStream<EventDelivery>; completed: boolean }
    | undefined;
  private constructor(
    private readonly socket: Socket,
    readonly lease: string,
  ) {}

  static async connect(path: string, lease?: string): Promise<LocalClient> {
    for (const [entry, directory] of [
      [dirname(path), true],
      [path, false],
    ] as const) {
      const stat = await lstat(entry);
      if (
        stat.isSymbolicLink() ||
        stat.uid !== process.getuid?.() ||
        (directory
          ? !stat.isDirectory() || (stat.mode & 0o777) !== 0o700
          : !stat.isSocket() || (stat.mode & 0o777) !== 0o600)
      )
        throw new Error("unsafe-ipc-path");
    }
    const socket = createConnection(path);
    return new Promise<LocalClient>((resolve, reject) => {
      let client: LocalClient | undefined;
      const timeout = setTimeout(() => socket.destroy(new Error("handshake-timeout")), 10_000);
      socket.on("error", (error) => {
        reject(error);
        client?.fail(error);
      });
      socket.on("close", () => {
        clearTimeout(timeout);
        const error = new Error(
          "connection-lost: operation outcome may be uncertain; reconnect and inspect, never auto-replay",
        );
        reject(error);
        client?.fail(error);
      });
      receiveFrames(socket, RESPONSE_LIMIT, (value) => {
        const parsed = serverFrame.safeParse(value);
        if (!parsed.success) {
          socket.destroy(new Error("invalid-host-envelope"));
          return;
        }
        const frame = parsed.data;
        if (!client) {
          if (frame.kind !== "hello" || !frame.ok) {
            socket.destroy(
              new Error(frame.kind === "hello" && !frame.ok ? frame.code : "invalid-handshake"),
            );
            return;
          }
          clearTimeout(timeout);
          client = new LocalClient(socket, frame.lease);
          resolve(client);
        } else if (frame.kind === "reply") {
          const pending = client.pending.get(frame.requestId);
          if (!pending) {
            socket.destroy(new Error("uncorrelated-reply"));
            return;
          }
          client.pending.delete(frame.requestId);
          if (pending.command === "subscribe" && frame.reply.ok) {
            const stream = {
              requestId: frame.requestId,
              completed: false,
              values: new BoundedStream<EventDelivery>(65, () => {
                if (!stream.completed) socket.destroy();
              }),
            };
            client.stream = stream;
            pending.resolve({ ok: true, value: stream.values });
          } else pending.resolve(frame.reply);
        } else if (frame.kind === "delivery") {
          if (client.stream?.requestId !== frame.requestId) {
            socket.destroy(new Error("uncorrelated-event"));
            return;
          }
          client.stream.values.push(frame.delivery as EventDelivery);
        } else if (frame.kind === "complete") {
          if (client.stream?.requestId !== frame.requestId || client.stream.completed) {
            socket.destroy(new Error("uncorrelated-completion"));
            return;
          }
          client.stream.completed = true;
          client.stream.values.close();
        } else socket.destroy(new Error("host-protocol-error"));
      });
      socket.once("connect", () =>
        sendFrame(socket, { kind: "hello", ...(lease ? { lease } : {}) }, FRAME_LIMIT),
      );
    });
  }

  private fail(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
    this.stream?.values.close(error);
  }

  close(): void {
    this.socket.destroy();
  }

  private async call<Name extends CommandName>(
    command: Name,
    input: Commands[Name]["input"],
  ): Promise<Reply<Commands[Name]["output"]>> {
    if (this.socket.destroyed) throw new Error("connection-lost");
    if (this.pending.has(input.requestId)) throw new Error("request-already-pending");
    if (this.pending.size >= 8) throw new Error("in-flight-limit");
    const reply = await new Promise<Reply<unknown>>((resolve, reject) => {
      this.pending.set(input.requestId, { command, resolve, reject });
      try {
        sendFrame(this.socket, { kind: "request", request: { command, input } }, FRAME_LIMIT);
      } catch (error) {
        this.pending.delete(input.requestId);
        reject(error);
      }
    });
    // Request correlation selects the output type. The local host is trusted, not a remote peer.
    return reply as Reply<Commands[Name]["output"]>;
  }

  readonly open: SessionClient["open"] = (input) => this.call("open", input);
  readonly inspect: SessionClient["inspect"] = (input) => this.call("inspect", input);
  readonly scan: SessionClient["scan"] = (input) => this.call("scan", input);
  readonly analyzeComponents: SessionClient["analyzeComponents"] = (input) =>
    this.call("analyzeComponents", input);
  readonly runPlaybook: SessionClient["runPlaybook"] = (input) => this.call("runPlaybook", input);
  readonly subscribe: SessionClient["subscribe"] = (input) => this.call("subscribe", input);
  readonly cancel: SessionClient["cancel"] = (input) => this.call("cancel", input);
  readonly end: SessionClient["end"] = (input) => this.call("end", input);
}
