import { describe, expect, test } from "vitest";
import { admitRequest, decodeRequest, REQUEST_LIMITS } from "../../src/host/requests.js";
import type { RequestAccess } from "../../src/host/requests.js";
import {
  commandSchemas,
  operationIdSchema,
  pageIdSchema,
  sessionIdSchema,
} from "../../src/validation.js";
import type { Request } from "../../src/validation.js";

const sessionId = sessionIdSchema.parse("session_one");
const operationId = operationIdSchema.parse("operation_one");
const pageId = pageIdSchema.parse("page_one");
const meta = { protocol: "propellr/0.1", requestId: "request-1" } as const;
const sessionMeta = { ...meta, sessionId };
const policy = { id: "local", version: "1" };
const playbook = { id: "dialog-open-close", version: "1" };
const target = { pageId, documentId: "document-1", path: [] };
const requests = [
  { command: "open", input: { ...meta, policy, target: { kind: "managed", browser: "chromium" } } },
  { command: "inspect", input: { ...sessionMeta, operationId } },
  {
    command: "scan",
    input: {
      ...sessionMeta,
      scan: {
        mode: "full",
        scope: { include: [target], exclude: [] },
        rules: { kind: "defaults" },
      },
    },
  },
  {
    command: "analyzeComponents",
    input: {
      ...sessionMeta,
      scan: {
        mode: "full",
        scope: { include: [target], exclude: [] },
        rules: { kind: "explicit", rules: [{ id: "button-name", options: {} }] },
      },
    },
  },
  {
    command: "runPlaybook",
    input: {
      ...sessionMeta,
      playbook,
      inputs: { nested: [null, true, 1, "text", {}] },
      bindings: { dialog: target },
      secretRefs: { account: "secret-1" },
    },
  },
  { command: "subscribe", input: { ...sessionMeta, after: "cursor-1" } },
  { command: "cancel", input: { ...sessionMeta, operationId } },
  { command: "end", input: sessionMeta },
] satisfies Request[];

const access: RequestAccess = {
  commands: requests.map((request) => request.command),
  policies: [policy],
  managedBrowsers: ["chromium"],
  attachedTargets: ["borrowed-1"],
  sessions: [
    {
      id: sessionId,
      operations: [operationId],
      documents: [target],
      playbooks: [playbook],
      secretRefs: ["secret-1"],
    },
  ],
};

function expectDenied(message: unknown, grants: RequestAccess = access): void {
  expect(admitRequest(JSON.stringify(message), grants)).toEqual({
    ok: false,
    diagnostic: { code: "permission-denied", message: "Request is not authorized" },
  });
}

function expectInvalid(message: unknown): void {
  expect(decodeRequest(JSON.stringify(message))).toMatchObject({
    ok: false,
    diagnostic: { code: "invalid-request" },
  });
}

describe("request decoding", () => {
  test.each(requests)("accepts $command without losing fields", (request) => {
    expect(decodeRequest(JSON.stringify(request))).toEqual({ ok: true, value: request });
  });

  test("covers every schema command", () => {
    expect(requests.map((request) => request.command).sort()).toEqual(
      Object.keys(commandSchemas).sort(),
    );
  });

  test.each([
    "",
    "{",
    "null",
    "[]",
    '{"command":"end","input":null}',
    '{"command":"unknown","input":{}}',
  ])("rejects malformed or non-request JSON: %s", (message) => {
    expect(decodeRequest(message).ok).toBe(false);
  });

  test.each([
    { ...sessionMeta, protocol: "propellr/99" },
    { ...sessionMeta, requestId: "" },
    { ...sessionMeta, requestId: "x".repeat(129) },
    { ...sessionMeta, sessionId: "operation_one" },
    { ...sessionMeta, sessionId: "session_" },
    { ...sessionMeta, sessionId: "session_one\n" },
    { ...sessionMeta, permissions: ["all"] },
  ])("rejects invalid protocol, identity or extra authority: %j", (input) => {
    expectInvalid({ command: "end", input });
  });

  test("rejects wrong operation and page identity kinds", () => {
    expectInvalid({ command: "cancel", input: { ...sessionMeta, operationId: sessionId } });
    expectInvalid({
      command: "scan",
      input: {
        ...sessionMeta,
        scan: {
          mode: "full",
          scope: { include: [{ ...target, pageId: sessionId }], exclude: [] },
          rules: { kind: "defaults" },
        },
      },
    });
  });

  test.each([
    { kind: "attached", targetId: "ws://localhost:9222" },
    { kind: "attached", targetId: "borrowed-1", endpoint: "ws://localhost:9222" },
    { kind: "managed", browser: "chromium", ownership: "owned" },
  ])("rejects endpoints and ownership assertions: %j", (openTarget) => {
    expectInvalid({ command: "open", input: { ...meta, policy, target: openTarget } });
  });

  test("rejects non-finite JSON numbers without echoing inputs", () => {
    const message = JSON.stringify(
      requests.find(({ command }) => command === "runPlaybook"),
    ).replace('"nested":', '"private-value":1e400,"nested":');
    expect(decodeRequest(message)).toEqual({
      ok: false,
      diagnostic: { code: "invalid-request", message: "Request does not match propellr/0.1" },
    });
  });

  test("rejects non-JSON values when schemas are used directly", () => {
    for (const value of [
      undefined,
      () => 1,
      new Date(),
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1n,
    ]) {
      expect(
        commandSchemas.runPlaybook.safeParse({
          ...sessionMeta,
          playbook,
          inputs: { value },
          bindings: {},
          secretRefs: {},
        }).success,
      ).toBe(false);
    }
  });

  test.each([
    { kind: "explicit", rules: [] },
    {
      kind: "explicit",
      rules: [
        { id: "button-name", options: {} },
        { id: "button-name", options: {} },
      ],
    },
    { kind: "defaults", rules: [] },
  ])("rejects empty, duplicate and ambiguous rule selections: %j", (rules) => {
    expectInvalid({
      command: "scan",
      input: {
        ...sessionMeta,
        scan: { mode: "full", scope: { include: [target], exclude: [] }, rules },
      },
    });
  });

  test("accepts explicit rules and rejects empty scope", () => {
    const scan = {
      mode: "incremental",
      scope: { include: [target], exclude: [] },
      rules: { kind: "explicit", rules: [{ id: "button-name", options: { enabled: true } }] },
    };
    expect(
      decodeRequest(JSON.stringify({ command: "scan", input: { ...sessionMeta, scan } })).ok,
    ).toBe(true);
    expectInvalid({
      command: "scan",
      input: { ...sessionMeta, scan: { ...scan, scope: { include: [], exclude: [] } } },
    });
  });

  test("bounds UTF-8 bytes before parsing", () => {
    const message = JSON.stringify({
      command: "runPlaybook",
      input: {
        ...sessionMeta,
        playbook,
        inputs: { text: "界".repeat(25_000) },
        bindings: {},
        secretRefs: {},
      },
    });
    expect(message.length).toBeLessThan(REQUEST_LIMITS.bytes);
    expect(decodeRequest(message)).toMatchObject({
      ok: false,
      diagnostic: { code: "request-limit" },
    });
  });

  test("bounds recursive JSON while ignoring escaped quotes and quoted brackets", () => {
    const nested =
      "[".repeat(REQUEST_LIMITS.depth + 1) + "0" + "]".repeat(REQUEST_LIMITS.depth + 1);
    expect(decodeRequest(nested)).toMatchObject({
      ok: false,
      diagnostic: { code: "request-limit" },
    });
    const message = {
      command: "runPlaybook",
      input: {
        ...sessionMeta,
        playbook,
        inputs: { text: '["\\'.repeat(100) },
        bindings: {},
        secretRefs: {},
      },
    };
    expect(decodeRequest(JSON.stringify(message)).ok).toBe(true);
  });
});

describe("host-owned admission", () => {
  test.each(requests)("accepts authorized $command", (request) => {
    expect(admitRequest(JSON.stringify(request), access)).toEqual({ ok: true, value: request });
  });
  test.each(requests)("denies $command when capability is absent", (request) => {
    expectDenied(request, { ...access, commands: [] });
  });
  test.each(requests.filter((request) => request.command !== "open"))(
    "denies $command across sessions",
    (request) => {
      expectDenied(request, { ...access, sessions: [] });
    },
  );
  test("requested policy and attached target do not grant access", () => {
    expectDenied(requests[0], { ...access, policies: [{ ...policy, version: "2" }] });
    expectDenied(requests[0], { ...access, managedBrowsers: [] });
    const attached = {
      command: "open",
      input: { ...meta, policy, target: { kind: "attached", targetId: "borrowed-1" } },
    };
    expect(admitRequest(JSON.stringify(attached), access).ok).toBe(true);
    expectDenied(attached, { ...access, attachedTargets: [] });
  });
  test.each(["inspect", "cancel"])("denies unknown operation for %s", (command) => {
    expectDenied({ command, input: { ...sessionMeta, operationId: "operation_other" } });
  });
  test.each(
    ["scan", "analyzeComponents"].flatMap((command) =>
      ["include", "exclude"].map((part) => ({ command, part })),
    ),
  )("denies stale/foreign documents: $command $part", ({ command, part }) => {
    const scope = {
      include: [target],
      exclude: [],
      [part]: [{ ...target, documentId: "document-stale" }],
    };
    expectDenied({
      command,
      input: { ...sessionMeta, scan: { mode: "full", scope, rules: { kind: "defaults" } } },
    });
  });
  test.each([
    { playbook: { ...playbook, version: "2" } },
    { bindings: { dialog: { ...target, pageId: "page_other" } } },
    { secretRefs: { account: "secret-other" } },
  ])("denies unauthorized playbook inputs: %j", (overrides) => {
    expectDenied({
      command: "runPlaybook",
      input: { ...sessionMeta, playbook, inputs: {}, bindings: {}, secretRefs: {}, ...overrides },
    });
  });
  test("invalid inputs cannot reach permission admission", () => {
    expect(admitRequest("not json", access)).toMatchObject({
      ok: false,
      diagnostic: { code: "invalid-json" },
    });
  });
});
