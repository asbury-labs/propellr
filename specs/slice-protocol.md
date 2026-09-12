# Phase 3 slice protocol

Specified before implementation/comparative trials, September 12, 2026.

## Selection and expectations

Inventory: every JSON rule at canonical v4.13.0, including opt-in, best-practice
and experimental flags, in `src/catalog.json`. Only `button-name`, `target-size`
and `landmark-one-main` have implementations, each with explicit branch limits.
Defaults resolve canonical default activation, not this slice. Unknown IDs and
unsupported options must not become successful checks.

Independent semantic expectations are authored from rule definitions and WCAG
naming/target geometry requirements before running reference comparisons. One
agent checks both implementation and expectations separately; no second-person
or external review is claimed. The canonical runtime is evidence, not an oracle.

Cases: named/empty buttons; aria-label, root-local aria-labelledby (including
hidden labels and missing references), explicit and wrapping labels, title,
hidden/disabled elements; 24px and rounding boundary targets, close small pairs,
isolated small targets and negative-tabindex incomplete outcomes; missing main,
two mains (presence passes, not duplicate detection), modal main exception;
nested open shadow roots with root-local naming; same-origin and nested frames
with main aggregation; cross-origin denied frame; unsupported CSS-generated name
and overlapping/overflowing geometry. No assertion of closed-root inspection.

Target identity is ordered frame/shadow/element selectors, rooted in a document
generation. Fixture elements have unique IDs. Raw comparisons retain outcome,
impact, scoped target, check evidence and configuration before grouping. Semantic
projection compares target/impact/outcome plus documented relevant check evidence;
message wording and selector representation may differ. Expected unsupported
mismatches require explicit per-case classification, never bulk goldens.

Dynamic cases use fresh full scans at each settled state. Requested incremental
always records full fallback. Mutation, changed labels, layout, unrelated edits,
frame navigation and narrower/changed rule selections cannot reuse stale facts.

## Reporting policy

Identity v1 groups only exact rule version + document generation + ordered target
path. No fuzzy selectors, shared ancestry, cross-page or component-cause inference.
History is caller-supplied and bounded; raw scan references remain intact. A prior
issue resolves only with equivalent complete scope/configuration/rule versions,
and no incomplete evaluation. Changed documents/identity versions are not comparable.
Counts describe current scan, never historical members. Gate v1 uses explicit
unique/occurrence thresholds; exceptions require issue ID, owner and expiry.
Incomplete coverage/findings make gate indeterminate even if violations are waived.
No enterprise adapters or persistence in this slice.

## Benchmark protocol (fixed before collection)

Pinned Node 26.8.2, PNPM 12.4.1, Playwright 1.63.0 browser revisions. Host OS,
hardware, browser versions, fixture and artifact SHA-256 recorded with output.
Headless desktop 1280x720, scale 1, Arial/system fallback, no external resources,
load event plus fonts ready. Both implementations use separate equivalent
contexts in the same browser process and explicit three-rule selection.

Per browser: 1 unmeasured warmup pair, then 5 measured pairs per cold, warm and
changed-state browser full-scan lane. Alternate implementation order by trial. Cold
uses new contexts; warm and changed-state reuse contexts equally. No early stop,
no outlier exclusions; failures retained and disqualify that lane. Serial trials,
no concurrent test workload. Browser launch/session, fixture load, injection,
scan/transfer, grouping, gate and serialization times recorded separately and
end to end. Canonical reporting fields remain unavailable, not equivalent work.
Correctness precedes timing acceptance for each measured sample.

Long-lived local session: 5 dialog playbook invocations, scans and IPC reconnects,
plus 100ms idle observations. Record actual checkpoint scans, transport/journey
cost and host process memory growth. This workload is overhead evidence, not a
canonical speed comparison. Both equivalent scan lanes retain browser contexts.

Retain every sample; report per-browser min/median/p95/max and sample count.
Five samples are exploratory, not a precise confidence interval. Node RSS/heap
observations cover harness/host only and use the same collector. Comparable
browser CPU/memory APIs are unavailable across all three engines, recorded as
null with reasons. No speedup ratio, headline, full-parity or incremental claim.

### Corpus extension, specified before second collection

First collection used only the 14-element geometry control. Its 90 samples remain
in `artifacts/bench-initial/`, not discarded as outliers. Before collecting the
expanded corpus, fix four workloads: geometry, a 40-button grid (eight naming
violations), nested open shadow roots, and nested same-origin frames. Keep one
warmup and five measured pairs per lane **per fixture and browser**. Do not pool
fixtures. Geometry rechecks change target dimensions; other workloads receive an
unrelated document attribute mutation. Actual DOM/style/frame/shadow counts and
fixture hashes are recorded. Unsupported/denied scopes are correctness cases,
not equivalent-work timing lanes. This remains a synthetic exploratory corpus,
not representative customer-site performance or a long-duration memory study.

### PR review correction: changed-state benchmark naming

Original runner labeled direct browser scans `changed-full-fallback` and constructed
incremental-request metadata without exercising the host request path. Those retained
samples are only changed-state browser full scans, not measured realtime fallback.
Current runner uses `changed-full` and full/full execution metadata. Original archive
bytes/checksums remain unchanged, with the correction recorded in its manifest.
Actual incremental-request/full-fallback correctness is tested separately through
`scanTarget`; no host-fallback timing claim is made by the browser benchmark lane.
