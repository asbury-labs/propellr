# Propellr: initial typed public contract

**Phase 2 update:** This document and its linked prototype are historical design
inputs. Current [public types](../src/contracts.ts) infer command inputs from
[runtime schemas](../src/validation.ts). [Host admission](../src/host/requests.ts),
[local daemon](../src/host/daemon.ts), [SDK](../src/host/client.ts), Playwright adapter
and trusted dialog playbook now exist. Session document IDs, checkpoint observations
and interrupted checkpoint retention extend the initial types. Wire identities,
envelopes and limits are documented in [README](../README.md) and
[local host protocol](local-host-protocol.md). SDK validates envelopes, not full output
schemas. Phase 3 now returns bounded three-rule scans, reports and real playbook
checkpoints, with unavailable coverage explicit. See [phase 2 evidence](local-host-validation.md)
and [phase 3 evidence](browser-slice-validation.md).

**Historical prototype status at capture: types only; no daemon, transport,
browser adapter or SDK implementation existed.** The [architecture boundaries](propellr-architecture-boundaries.md)
and [acceptance contract](propellr-acceptance-contract.md) supply the requirements.

- [Contract types](propellr-contracts.ts)
- [Compile-only examples](propellr-contracts.typecheck.ts)
- [Independent compiler configuration](propellr-contracts.tsconfig.json)

## Surface

`SessionClient` is inferred from one command map: `open`, `inspect`, `scan`,
`runPlaybook`, `subscribe`, `cancel`, `end`. Open handles managed and attached
browsers. The host returns ownership; callers cannot grant themselves permission
by selecting a policy or asserting that a borrowed browser is owned.

Commands return an accepted value or a diagnostic. Scan/playbook commands return
queryable operation identities. Operations distinguish queued, running,
cancelling, completed, failed, cancelled and lost states. A completed scan returns
a `ScanResult`; a completed playbook returns a `PlaybookResult`. Command acceptance,
operation completion and accessibility/quality-gate success are different things.
Transport disconnection is not an operation result: reconnect and inspect rather
than assume failure and repeat actions.

`inspect` advertises retained operation summaries and authorized playbook
manifests; an optional operation ID requests its detailed state/result. If that
state is no longer retained, return an explicit diagnostic, not an empty success
or an implication that the operation never ran. Retention/pagination details are
not finalized by this prototype.

## Data boundaries

- **Session:** identity, lifecycle, owned/borrowed browser, pages, capabilities and
  effective policy/configuration versions.
- **Scan:** epoch, direct/playbook origin, scope, resolved rule versions/options,
  requested versus actual execution mode, coverage, raw rule outcomes and timing.
- **Playbook:** versioned manifest, input schema, prerequisites, required origins
  and actions, checkpoints and expected behavior. Invocation uses site bindings
  and host-managed secret references, not embedded credentials or arbitrary code.
- **Reporting:** issue groups reference raw occurrences, including historical
  scans. Comparison eligibility, identity version and policy gate reasons remain
  separate from accessibility verdicts.
- **Events:** correlated session/operation updates and playbook checkpoints.
  Opaque cursors are session-scoped; replay gaps are explicit control messages.
  `AsyncIterable` is the client's subscription abstraction; transports encode
  individual event deliveries, not the iterator itself.

Targets include page and document identities plus ordered frame/shadow/element
paths. Empty paths identify documents. These references are not durable issue IDs;
navigation invalidates old document references. Locator semantics and rebinding
at playbook checkpoints need validation before this becomes a stable API.

## What the types enforce

Discriminated unions require reasons for incomplete findings and partial/stale
coverage, explain full-scan fallbacks, and preserve operation-kind/result
correlation. Branded IDs prevent accidental session/operation/scan ID mixing in
TypeScript; they remain strings on the wire. Returned data is readonly at the type
level. Inputs/evidence use JSON data rather than DOM nodes, functions or `any`.

Dynamic playbook inputs are JSON validated against the authorized manifest's
schema. This wire contract does not yet provide inferred authoring-SDK types for
each playbook's inputs or choose a JSON Schema dialect/validation library.

## Runtime obligations, not compiler guarantees

- Decode and validate untrusted messages, IDs, schemas, finite numbers, versions,
  target scope and permissions. TypeScript does not validate JSON, freeze objects
  or provide a sandbox. Resolve immutable policy/configuration/playbook versions.
- Admit and authorize requests before execution. Scope request correlation to the
  authenticated caller/session. Reject conflicting reuse of a request ID; after
  deduplication history is lost, do not blindly replay a potentially mutating
  request. No exactly-once guarantee is implied.
- A complete scan must account for every resolved rule and requested scope.
  Missing rules/frames and stale epochs cannot be normalized into inapplicable
  results. Cross-field completeness and uniqueness need runtime checks.
- Incomplete findings can exist in a fully evaluated scan. Conversely, a completed
  operation can return partial coverage. Reporting and gates must inspect both,
  not treat `ok: true` or `state: completed` as a clean accessibility result.
- Preserve completed checkpoint scans on interruption. Report side effects and
  cleanup uncertainty. Cancellation requests are not confirmed cancellation.
- Validate group membership/counts and comparison eligibility before assigning
  issue lifecycle or gate decisions. Never resolve findings merely because their
  scope/rules were absent. A group cannot erase underlying occurrences.
- Bound results/events and release DOM references. Host-owned authorization,
  audit and redaction apply to inspection and subscriptions as well as commands.
  Secret references must not be expanded into event/report payloads.
- Ending an attached session detaches and cleans up owned instrumentation; it
  must not implicitly terminate a borrowed browser. Lost hosts/browsers remain
  explicit rather than reconstructed by unsafe action replay.

## Historical prototype verification

The preparation checkout used its inherited compiler with this command (not a
command for the greenfield project; use `pnpm validate` here):

```sh
pnpm --filter axe-core exec tsc -p ../../specs/propellr-contracts.tsconfig.json
```

This checks the prototype and positive/negative examples with strict settings,
without inherited compiler configuration, ambient browser/Node types or emitted
JavaScript. Its ES2022 library setting is not a greenfield Node/browser support
policy. No runtime, protocol, parity or benchmark behavior is verified by it.

## Next checkpoint

Review the contract alongside the [greenfield foundation proposal](propellr-greenfield-foundation.html)
before moving it into a minimal private project. That proposal selects tool pins,
local IPC and a bounded host/playbook/parity slice; it is not executed or a claim
of compatibility. The first implementation exercises controlled browser fixtures
against the pinned canonical engine, expanding toward full parity. Do not scaffold
cloud services, arbitrary plugin execution, history databases or every enterprise
adapter up front. Rule-authoring inference, detailed evidence vocabulary,
identity matching and adapter mappings remain separate design work.
