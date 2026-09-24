import { Buffer } from "node:buffer";
import type { OperationId, PageId, Reply, SessionId, Target, VersionRef } from "../contracts.js";
import { requestSchema } from "../validation.js";
import type { CommandInputs, CommandName, Request } from "../validation.js";

export const REQUEST_LIMITS = { bytes: 65_536, depth: 32 } as const;

// Count containers before parsing or recursive schema evaluation. Quoted braces do not count.
export function withinDepthLimit(text: string): boolean {
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (const char of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{" || char === "[") {
      if (++depth > REQUEST_LIMITS.depth) return false;
    } else if (char === "}" || char === "]") depth--;
  }
  return true;
}

// A decoder, not transport framing or authorization. Never echoes untrusted payloads.
export function decodeRequest(text: string): Reply<Request> {
  if (Buffer.byteLength(text, "utf8") > REQUEST_LIMITS.bytes || !withinDepthLimit(text)) {
    return {
      ok: false,
      diagnostic: { code: "request-limit", message: "Request exceeds size or nesting limit" },
    };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {
      ok: false,
      diagnostic: { code: "invalid-json", message: "Request must be valid JSON" },
    };
  }
  const parsed = requestSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      diagnostic: { code: "invalid-request", message: "Request does not match propellr/0.1" },
    };
  }
  return { ok: true, value: parsed.data };
}

// Trusted, caller-specific host snapshot. Never deserialize this from a client request.
export interface RequestAccess {
  readonly commands: readonly CommandName[];
  readonly policies: readonly VersionRef[];
  readonly managedBrowsers: readonly Extract<
    CommandInputs["open"]["target"],
    { kind: "managed" }
  >["browser"][];
  readonly attachedTargets: readonly string[];
  readonly sessions: readonly {
    readonly id: SessionId;
    readonly operations: readonly OperationId[];
    readonly documents: readonly { readonly pageId: PageId; readonly documentId: string }[];
    readonly playbooks: readonly VersionRef[];
    readonly secretRefs: readonly string[];
  }[];
}

function hasVersion(versions: readonly VersionRef[], requested: VersionRef): boolean {
  return versions.some(
    (version) => version.id === requested.id && version.version === requested.version,
  );
}

function permitted(request: Request, access: RequestAccess): boolean {
  if (!access.commands.includes(request.command)) return false;
  if (request.command === "open") {
    const { policy, target } = request.input;
    return (
      hasVersion(access.policies, policy) &&
      (target.kind === "managed"
        ? access.managedBrowsers.includes(target.browser)
        : access.attachedTargets.includes(target.targetId))
    );
  }

  const session = access.sessions.find((entry) => entry.id === request.input.sessionId);
  if (!session) return false;
  const hasTarget = (target: Target): boolean =>
    session.documents.some(
      (document) => document.pageId === target.pageId && document.documentId === target.documentId,
    );

  switch (request.command) {
    case "inspect":
      return (
        request.input.operationId === undefined ||
        session.operations.includes(request.input.operationId)
      );
    case "cancel":
      return session.operations.includes(request.input.operationId);
    case "scan":
    case "analyzeComponents":
      return [...request.input.scan.scope.include, ...request.input.scan.scope.exclude].every(
        hasTarget,
      );
    case "runPlaybook":
      return (
        hasVersion(session.playbooks, request.input.playbook) &&
        Object.values(request.input.bindings).every(hasTarget) &&
        Object.values(request.input.secretRefs).every((ref) => session.secretRefs.includes(ref))
      );
    case "subscribe":
    case "end":
      return true;
  }
}

// Admission only. Execution must recheck live origin/action policy, ownership and epochs.
export function admitRequest(text: string, access: RequestAccess): Reply<Request> {
  const decoded = decodeRequest(text);
  if (!decoded.ok) return decoded;
  if (!permitted(decoded.value, access)) {
    return {
      ok: false,
      diagnostic: { code: "permission-denied", message: "Request is not authorized" },
    };
  }
  return decoded;
}
