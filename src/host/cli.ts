import { once } from "node:events";
import { LocalClient } from "./client.js";
import { decodeRequest, REQUEST_LIMITS } from "./requests.js";

// One JSON command on stdin; every command uses the SDK, including event streaming.
async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: node dist/host/cli.js SOCKET [LEASE] < request.json");
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    bytes += buffer.length;
    if (bytes > REQUEST_LIMITS.bytes) throw new Error("request-limit");
    chunks.push(buffer);
  }
  const decoded = decodeRequest(Buffer.concat(chunks).toString("utf8"));
  if (!decoded.ok) {
    process.stdout.write(`${JSON.stringify(decoded)}\n`);
    process.exitCode = 1;
    return;
  }
  const client = await LocalClient.connect(path, process.argv[3]);
  const write = async (value: unknown) => {
    if (!process.stdout.write(`${JSON.stringify(value)}\n`)) await once(process.stdout, "drain");
  };
  const stop = () => client.close();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    const request = decoded.value;
    if (request.command === "subscribe") {
      const result = await client.subscribe(request.input);
      await write({ lease: client.lease, reply: result.ok ? { ok: true, value: null } : result });
      if (result.ok) for await (const delivery of result.value) await write(delivery);
      else process.exitCode = 1;
    } else {
      // Switch preserves command/input correlation without an untyped dispatcher.
      const result = await (async () => {
        switch (request.command) {
          case "open":
            return client.open(request.input);
          case "inspect":
            return client.inspect(request.input);
          case "scan":
            return client.scan(request.input);
          case "analyzeComponents":
            return client.analyzeComponents(request.input);
          case "runPlaybook":
            return client.runPlaybook(request.input);
          case "cancel":
            return client.cancel(request.input);
          case "end":
            return client.end(request.input);
        }
      })();
      await write({ lease: client.lease, reply: result });
      if (!result.ok) process.exitCode = 1;
    }
  } finally {
    client.close();
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}

void main().catch(() => {
  process.stderr.write(
    "Local command failed; outcome may be uncertain. Reconnect and inspect before retrying.\n",
  );
  process.exitCode = 1;
});
