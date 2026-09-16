# Propellr: agreed product direction

**Implementation update:** Phases 1 and 2 now exist in this greenfield worktree.
See [foundation evidence](foundation-validation.md) and
[local host evidence](local-host-validation.md). Phase 3 adds a limited three-rule
browser/reporting proof; see [slice evidence](browser-slice-validation.md). Full
catalog parity and broader product goals remain incomplete. Phase 4 adds bounded
image-alt, link-name and label coverage; see [naming evidence](naming-coverage-validation.md).
Remaining text records the agreed
planning direction at capture time, not current implementation status.

Captured September 11, 2026 from Tony's decisions; expanded to stateful sessions
and playbooks at 19:38 UTC. This brief supersedes the incremental-modernization
execution checklist. Product direction is agreed; detailed architecture,
acceptance thresholds and greenfield workspace implementation remain open.

## Purpose

Build a modern accessibility engine with **axe-core accessibility parity as its
baseline**, then improve coverage, performance, efficiency, realtime operation,
extensibility, agent support and enterprise reporting. Custom enterprise rules
are part of the product, not a substitute for standard accessibility coverage.

## Product shape: a stateful accessibility runtime

Treat the browser as a long-lived, stateful session rather than restarting a
one-shot scanner for every command. A first-class session host coordinates pages,
frames, application state, scans, finding history and streaming diagnostics.
Agents and enterprise tools can reconnect, inspect and advance an existing
session. Session lifetime is distinct from a client's connection; this does not
promise recovery of live browser state after a host/browser crash.

Provide versioned, pre-built accessibility playbooks for meaningful application
states: dialogs and keyboard interaction, form validation, navigation, login,
checkout, tabs, menus and dynamic content. Playbooks declare prerequisites,
permitted actions, checkpoints and expected behavior. They are adaptable workflow
templates, not a claim that every website works without configuration. They
extend state/interaction coverage without replacing axe-core rule parity or
human review.

**Enterprise-first by design:** support customer-owned browser pools, runners and
private networks without requiring a hosted Propellr account. Keep credentials
and authorization under host control, isolate tenants/sessions, audit actions and
apply evidence redaction/retention policies. Hosted delivery is optional future
packaging, not a prerequisite. No cloud control plane, dashboard, distributed
scheduler or identity-provider suite needs to be built before the engine.

## Agreed foundations

- **Greenfield workspace**, not continued renovation of the inherited package
  graph, build system or legacy test infrastructure.
- **Independent canonical axe-core reference**, pinned for comparisons. See
  [reference checkout and approved baseline](axe-core-reference.md). Primary
  baseline: axe-core **v4.13.0**, commit
  `1cc54b900413660610180d631feb73c9e74f4dc9`, the latest stable release verified
  September 11, 2026. Pinned upstream `develop` is a secondary comparison only.
- **Accessibility parity, not API duplication.** Match rule coverage, outcomes,
  affected targets, frame/shadow behavior and incomplete evaluations. A new public
  API and result model are allowed; old methods, JSON shapes, bundle formats and
  deep imports are not automatic requirements.
- **Selective reuse of proven knowledge:** algorithms, standards data and useful
  fixtures, preserving licenses and provenance. Greenfield does not mean blindly
  rewriting decades of accessibility logic.
- **Modern platform:** current Node releases, strong TypeScript contracts and
  modern web APIs. Choose exact versions and browser/host support deliberately;
  browser-specific acceleration must expose limits and have an appropriate
  fallback or explicit unsupported outcome.

## Core goals

### 1. Coverage and correctness

Meet axe-core's accessibility baseline and exceed its automated WCAG coverage
where reliable. Review every differential mismatch. Distinguish violations,
incomplete evaluations, operational errors and criteria requiring human review.
Missing evidence is never a pass. Do not claim automated checks establish complete
WCAG conformance or treat upstream output as an infallible oracle.

**Approved baseline policy:** inventory the complete canonical rule catalog,
including best-practice and opt-in rules, not only WCAG-tagged defaults. Track
experimental rules and their status explicitly in a separate comparison lane.
Inventory membership does not imply all rules are enabled by default. Keep the
primary release fixed within an evaluation; review changes before adopting a
newer baseline.

### 2. Performance and efficiency

Demonstrate materially better performance in reproducible side-by-side benchmarks.
Measure full-scan latency, repeated scans, incremental rechecks, memory and CPU
cost. Pin both engines, fixtures, browsers and hardware; use equivalent rules,
options and page states. Report repetitions and latency distributions, separating
cold/warm runs and end-to-end costs from internal timing.

Reduced coverage, missing evidence or hidden preprocessing cannot count as a
speedup. Compare added coverage separately. Numeric improvement targets follow
baseline measurements; no speedup is claimed yet.

### 3. Realtime scanning

Support trustworthy results as applications change. Reuse valid work, invalidate
stale facts and cover relevant DOM, style, layout, frame and interaction changes.
When incremental correctness is uncertain, use a full scan or report the limit.
Cancellation, timeout and staleness must remain visible.

### 4. Agent-native operation

Give agents supported, typed interfaces to discover capabilities, configure and
invoke scans, consume findings/evidence, author and test rules, and verify fixes.
Provide versioned machine-readable contracts and actionable diagnostics without
requiring knowledge of engine internals or a particular model/provider. Treat
page content and generated rule code as untrusted; no implicit customer-data
export to model services.

### 5. Extensibility

Support custom rules, enterprise/design-system policies and reusable analysis
capabilities without core modifications. Keep scan/configuration state isolated
and rule requirements explicit. Extensions must not silently weaken baseline
coverage or redefine accessibility outcomes through organizational policy.

### 6. Enterprise reporting and deduplication

Reporting is a core capability, not an afterthought:

- Actionable findings with rule/version, accessibility impact, affected targets,
  evidence, remediation and explicit incomplete/error states.
- Stable issue tracking across scans and builds: new, existing, resolved and
  recurring findings. A finding is not resolved merely because a later scan
  skipped its rule, target or scope.
- **Deduplication across scans, pages, components and frames.** Group repeated
  findings while preserving every occurrence, target and supporting evidence.
  Keep uncertain matches separate; shared ancestry is not proof of root cause.
- Expose both unique-issue and occurrence counts. Grouping must never hide
  violations or silently weaken quality gates.
- Configurable quality gates, baselines and exceptions with owners and expiry.
  Separate accessibility impact from organization-specific gating policy.
- Integrations with enterprise application-health, CI/CD, code-scanning and
  issue-tracking tools. Use one structured result model with output adapters,
  rather than coupling execution to individual vendors.

SARIF, JUnit and OpenTelemetry are formats to evaluate against actual integration
needs, not a promise that each fits every reporting use case. Initial vendors,
formats and deduplication identity/matching rules remain design decisions.

## Acceptance contract and next step

The [acceptance contract](propellr-acceptance-contract.md) captures the initial
Chromium/Firefox/WebKit matrix, fixture families, parity and mismatch-review
requirements, equivalent-work benchmark protocol, realtime correctness and
reporting/deduplication acceptance cases. These are requirements, not test results.

The [architecture boundary proposal](propellr-architecture-boundaries.md)
recommends browser-native collection/evaluation, explicit scan ownership and
portable reporting, now coordinated by a first-class stateful session host.
The [typed public contract prototype](propellr-public-contract.md) covers the
seven operations, playbooks, scan/report results and events. Detailed boundaries
and these contracts remain proposals for review before creating the greenfield
workspace. The [greenfield foundation proposal](propellr-greenfield-foundation.html)
selects exact tool pins and a first local-host/playbook/parity slice for review;
it has not been executed. Executable fixture inventory, benchmark sampling/budgets
and initial enterprise adapters remain open.
Implement measurable vertical slices toward the full agreed baseline; partial
coverage must remain explicitly partial.

Do not resume legacy CI rehabilitation or scaffold speculative packages first.
The old `streamlined-modernization-plan.html` (retained in preparation history),
migration PRs and historical results remain research/evidence, not the greenfield execution schedule. Current
migration-checkout CI is not proof of Propellr parity or performance. No publishing,
live-channel changes or customer-data use is authorized by this brief.
