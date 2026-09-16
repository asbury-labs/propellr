# Propellr: proposed architecture boundaries

**Implementation update:** Phases 1 and 2 implement contracts, request admission,
local IPC sessions, Playwright ownership and one trusted dialog playbook. See
[foundation evidence](foundation-validation.md) and [local host evidence](local-host-validation.md).
Phase 3 adds a bounded browser-native three-rule slice, full-scan fallback and
portable exact-target reporting. See [slice evidence](browser-slice-validation.md);
unsupported branches and full catalog parity remain explicit limits. Phase 4 adds three
bounded naming/form-label rules; see [naming evidence](naming-coverage-validation.md).
The proposal below is retained
at its capture state; current protocol details live in [local host protocol](local-host-protocol.md).

September 11, 2026; revised at 19:38 UTC. **Stateful sessions, playbooks and
enterprise-first operation are agreed product direction. Detailed boundaries and
API sketch below remain recommendations, not an approved implementation.**
Grounded in the [product brief](propellr-product-brief.md) and
[acceptance contract](propellr-acceptance-contract.md). No packages, runtime code
or performance results are implied.

## Recommendation

Use a **first-class stateful session host** coordinating a browser-native DOM
reader, an explicitly owned analysis runtime and portable reporting. Enterprise
clients and agents use thin adapters over the same public session contracts.

Initially collect facts and evaluate rules beside the live DOM. Keep pure analysis
separate from DOM access so measured workloads can later move to workers or other
hosts without changing rule semantics. Do not make CDP, a complete serialized DOM
snapshot, workers or a backend service prerequisites for baseline parity.

This is greenfield ownership and contracts, not axe-core wrapped in a new API.
Reuse proven algorithms and standards data selectively with licensing/provenance;
do not import its audit singleton, runner infrastructure or packaging machinery.

## Where responsibilities run

| Boundary                   | Initial location                                                                                 | Owns                                                                                                                                     | Must not own                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| DOM and platform reader    | Browser main thread, within each accessible frame                                                | Node/root identities, relationships, computed styles, geometry, capability detection and change signals                                  | Enterprise policy decisions, durable history, network reporting or claims about inaccessible content |
| Analysis runtime           | Browser beside the reader                                                                        | Engine instance, effective rule configuration, scan epochs, shared facts, scheduling, evaluation and document/frame aggregation          | Process-wide mutable engine state, vendor integrations or application storage                        |
| Pure analysis capabilities | Initially the same runtime                                                                       | Computation over typed facts, reusable across rules                                                                                      | Ambient DOM access when declared portable; hidden cross-scan caches                                  |
| Stateful session host      | Customer-operated Node daemon for managed sessions; explicit embedding adapter where appropriate | Session/page lifecycle, browser ownership, playbooks, authorization, frame access/injection, operations, cancellation and event delivery | Rule verdicts or silent manipulation of findings to make a gate pass                                 |
| Reporting                  | Portable TypeScript, callable in browser or Node                                                 | Normalized findings, conservative deduplication, lifecycle comparison and quality-gate policy                                            | DOM traversal or mutation of raw accessibility outcomes                                              |
| Enterprise/agent adapters  | Host boundary                                                                                    | Versioned commands, diagnostics, output formats and explicitly configured delivery                                                       | Private engine internals, implicit remote rule loading or automatic customer-data export             |

These are logical module boundaries, not six packages or services. Start with one
private TypeScript project; split distribution only when a real consumer or build
boundary warrants it. Managed browser automation can use Playwright; embedded
scanning must not require Node or Playwright inside the page. A long-running host
is a product capability; a hosted cloud service is not a dependency.

## Sessions and accessibility playbooks

A session owns its authorized browser targets, page/frame registry, active
operations, effective policy, scan/report references and bounded event history.
Client disconnection does not itself end the session. Reconnection reports the
actual current state; host/browser loss is explicit, not silently reconstructed
by replaying previously executed actions. Durable recovery can be added only with
an explicit storage and action-reconciliation design.

Keep session configuration changes versioned. Each operation captures the policy
and configuration under which it was authorized. A session's shared browser state
does not permit facts or credentials to leak into another tenant/session.
Serialize conflicting browser actions; scans and playbooks must coordinate state
checkpoints and invalidate work when external page changes occur.

Playbooks are versioned, trusted workflows, separate from rule evaluators. They
contain prerequisites, typed inputs, permitted origins/actions, state assertions,
scan checkpoints, expected behavior and cleanup. Scan results reference the exact
playbook version and step. A failed prerequisite or incomplete journey is not a
passing accessibility result. Cleanup is best effort, not a transaction rollback.

Ship adaptable patterns for dialogs, forms, navigation, authentication and other
meaningful flows. Site bindings and permissions remain explicit. Agent-generated
playbooks are untrusted candidates until validated and authorized; page content
cannot grant permissions. Mutating or ambiguous actions require explicit approval
and appropriate test accounts/environments. Never retry an uncertain submission,
purchase or other side effect merely because a client disconnected.

Enterprise deployment uses customer-owned browsers and infrastructure where
required. Hosts own secrets, authorization, audit, evidence retention and network
policy. Authentication may legitimately populate browser state; raw secrets must
not be exposed in rule contexts, logs or reports by default. Browser contexts and
typed APIs alone are not a security boundary for arbitrary hostile code.

## Minimal public session contract (proposed)

Transport-neutral operations, not finalized method names or JSON schemas:

| Operation           | Contract                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open/attach session | Create a managed session or attach to an authorized browser target. Declare owned versus borrowed resources and return session identity/capabilities.                     |
| Inspect session     | Return current targets, capabilities, policy/config versions, operation status and available result references without restarting scans.                                  |
| Request scan        | Capture scope/configuration and return an operation identity. Report actual full/incremental mode, epoch and completeness with the terminal result.                       |
| Run playbook        | Invoke an authorized, versioned playbook with typed inputs. Return an operation identity; emit step/checkpoint outcomes and scan references.                              |
| Subscribe to events | Stream progress and results with session, operation and sequence identities. Resume within advertised retention; signal gaps rather than pretending delivery is complete. |
| Cancel operation    | Request cooperative cancellation or permitted host enforcement. Distinguish requested from confirmed cancellation and report remaining/uncertain side effects.            |
| End session         | Dispose owned analysis state and resources according to ownership policy. Detach from borrowed targets; do not implicitly close a customer's browser.                     |

Operations have explicit terminal outcomes and queryable status after a client
reconnects. Progress is provisional. Request correlation/retry semantics must
prevent accidental replay; do not claim exactly-once execution across crashes.
SDK, CLI and agent integrations share these contracts. No particular RPC
transport, hosted provider or agent framework is required by this sketch.

## Runtime ownership and rule contract

- Each engine owns an immutable effective rule/configuration snapshot. Each scan
  owns its epoch, scope, facts, work queues, diagnostics and cleanup. No global
  mutable default instance or caches shared between organizations.
- Rules receive explicit typed context and declare options, capabilities and
  evaluation scope: node, relationship, root/document or cross-frame aggregation.
  Declared dependencies make scheduling and later incremental reuse inspectable.
- Shared capabilities provide facts such as accessible names, visibility,
  relationships, styles and geometry. Compute reusable facts once per relevant
  scan context, not independently in every evaluator. Collect only needed facts;
  do not eagerly serialize the whole page for hypothetical future rules.
- DOM-dependent rules can access a scoped reader without being falsely labeled
  portable. Portable evaluators consume materialized facts, not live nodes or
  mutable CSSOM objects. Neither contract makes arbitrary JavaScript a sandbox.
- Validate rule IDs, configuration and capability requirements before evaluation.
  Keep registration explicit and distinguish catalog membership from activation.
  Custom rules use namespaces; they cannot silently replace baseline rules.
- Aggregation is a deliberate stage. Document/frame-wide checks cannot be reduced
  to independent subtree verdicts merely to parallelize work.

Cross-frame coordination must preserve frame/root identity and completeness.
Managed hosts may inject into permitted frames; embedded hosts have their own
access limits. Validate message provenance and run identity. Missing injection,
navigation or inaccessible frames produce explicit coverage limits, not success.

## Realtime execution without stale results

Start with correct full scans and explicit epochs. Build change tracking into the
reader boundary, then enable incremental reuse only for dependencies demonstrated
by the realtime acceptance cases.

MutationObserver, ResizeObserver, font readiness and relevant browser events can
provide invalidation signals. They are not a complete model of CSS, layout,
animations or application state. Unknown effects invalidate broadly or require a
full scan; unsupported observation remains visible.

Batch read-only DOM/style/geometry work where safe. Yield long-running work to
protect responsiveness, but do not call the resulting multi-turn scan atomic.
If the page changes during collection/evaluation, invalidate affected work or
restart within a bounded policy. If a coherent result cannot be established,
report staleness/partial completion rather than mixing epochs silently.

Cancellation prevents superseded results from committing. AbortSignal and
cooperative scheduling cannot interrupt a synchronous infinite loop. Untrusted
agent-authored rules require a disposable, restricted execution environment with
host-enforced termination; an embedded page supports trusted rules only unless a
real isolation mechanism is provided. No mandatory worker pool is assumed.

## Result and reporting boundary

Keep four concepts distinct before choosing their exact TypeScript/schema shape:

1. **Scan envelope:** engine/rule/config versions, epoch, requested and evaluated
   scope, capabilities, completion/error status and timing context.
2. **Raw occurrences:** rule outcome, scoped target identity, impact, relevant
   evidence and remediation. This is the input to semantic parity comparisons.
3. **Issue groups and history:** deduplicated views referencing occurrences,
   identity/matcher versions, grouping basis and new/existing/resolved/recurring
   state. Scan-local node IDs are not durable issue IDs across builds.
4. **Gate decisions:** explicit organizational policy applied to findings and
   completeness, with exception owners/expiry and auditable reasons.

Deduplication is a reporting capability, not a shortcut in rule evaluation.
Preserve every occurrence and expose grouped and occurrence counts. Uncertain
identity matches remain separate; selector similarity alone does not prove a
shared defect. Cross-build matching uses caller-supplied prior state and recorded
coverage, so a skipped rule or failed scan cannot falsely resolve an issue.

Reporting algorithms remain portable. Hosts supply history storage and delivery;
a database, issue tracker or telemetry service is not required to scan. Adapters
must disclose representation loss rather than turn unknown/incomplete results
into green gates. Any streamed progress is provisional until an explicit terminal
scan status establishes what completed.

Agents use the same supported operations and result contracts as other clients.
Keep credentials outside page evaluation and collect only necessary evidence.
HTML dumps, screenshots, customer identifiers and external delivery need explicit
capture/redaction policy, not automatic inclusion in every finding.

## Why this over the alternatives?

| Approach                                             | Benefit                                                                                           | Cost / decision                                                                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live DOM with explicit reader and shared facts       | Native browser fidelity across the agreed engines; avoids mandatory full-page extraction/transfer | Still competes with the page's main thread. Recommended starting point, not a performance claim.                                                                                 |
| Mandatory snapshot-first external engine             | Replayable inputs and natural off-thread analysis                                                 | Must first prove style/layout, frame, shadow and dynamic-state fidelity; extraction and serialization can dominate. Keep as a measured alternative, not the baseline dependency. |
| CDP-first collection                                 | Additional capabilities in supported Chromium hosts                                               | Not the cross-browser baseline. Treat as an optional host capability with separately labeled enhanced coverage.                                                                  |
| Direct reuse of axe-core's runtime with new wrappers | Shortest route to an immediately familiar scan surface                                            | Retains the ownership and execution constraints we intend to address. Canonical remains a separate reference instead.                                                            |

Modern APIs earn adoption through correctness and end-to-end measurements.
Explicit capabilities allow later worker, packed-data or incremental acceleration;
they do not guarantee that any of those approaches will be faster.

## Next checkpoint

The [typed public contract prototype](propellr-public-contract.md) now covers
sessions, operations, playbooks, scan/report results and event delivery. Review it
and the remaining execution placements before creating the greenfield workspace.
Compiler checks are not runtime or parity verification. Do not build a cloud
platform first.

First technical slice should stress layout-dependent analysis, relationships and
aggregation against canonical fixtures, not only a convenient custom rule. Use it
to challenge these boundaries before expanding toward the complete catalog. It
is a bounded implementation slice, never a substitute for the full parity goal.

Exact package/export layout, Node/browser versions, scheduling primitives, fact
representation, issue identity policy and first enterprise adapters remain open.
No legacy migration work or new execution host is authorized by this proposal.
