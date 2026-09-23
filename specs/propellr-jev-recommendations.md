# Propellr + Jev: build an accessibility investigation runtime

September 23, 2026. Research recommendations, not an approved implementation plan. Based on `main@42f7a47b927c1a5b40b3533f6666ad4d5c2e0312`. No model calls, customer-data export, new dependency or runtime change authorized or performed. Read the [Jev brief](jev-brief.md) first; its source IDs are used below.

> **Planning follow-up:** [Component intelligence and repair-scope deduplication](propellr-component-intelligence.html) promotes component attribution to a first-class shared capability and the first Jev evaluation. It supersedes the experiment ordering below, not the evidence, privacy or gate-separation requirements. Implementation remains unapproved.

## Recommendation

**Yes: Jev has a solid potential use case in Propellr, but not as a faster replacement for the rule engine.** Evaluate it as an optional host-side decision component that selects useful experiments and checks whether agent claims are supported by observed evidence.

The bigger opportunity is to make Propellr an accessibility investigation runtime:

> Given a user goal and a live application, identify what remains unknown, choose an authorized experiment, observe the result, and return a bounded, reproducible accessibility claim.

A rule scanner answers “what fails in this state?” A generic browser agent answers “can I finish this task somehow?” Propellr should answer **“can this task be completed through the required interaction path, where does it break, and what observation proves it?”** An agent succeeding by clicking with a mouse does not prove a keyboard path works.

Keep canonical coverage as a compatibility floor, not the product architecture. Develop the agent-feedback loop alongside rule expansion rather than waiting for all 105 rules. Do not discard exact algorithms simply because an AI alternative exists: model judgment earns its place where intent, language or experiment selection defeats simple code.

**Best first experiment:** replay synthetic interaction traces through a Jev-assisted probe selector and claim checker, outside the live scanner. Promote to a bounded live experiment only if it beats both a useful heuristic and a native structured-output LLM at matched quality. Jev is a candidate provider, not the moat.

## What exists, and what would be new

The [README](../README.md), [architecture boundaries](propellr-architecture-boundaries.md), [acceptance contract](propellr-acceptance-contract.md) and current source establish:

| Existing foundation                                                          | Consequence for this proposal                                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Nine bounded rule implementations; 96 catalog rules unimplemented            | Jev cannot make unsupported coverage disappear or justify a full-parity claim.                                        |
| Browser-native collection/evaluation; portable reporting                     | Keep remote inference out of DOM traversal, naming and geometry.                                                      |
| Local stateful host, typed SDK/CLI, owned/borrowed browser resources         | Natural placement for optional semantic decisions and auditable orchestration.                                        |
| One trusted `dialog-open-close@1` playbook; fixture-restricted execution     | Arbitrary-site exploration and a playbook catalog do not exist yet.                                                   |
| Epoch/document guards, real checkpoint scans and explicit full-scan fallback | Bind model advice to the same state. Never claim incremental acceleration from better routing.                        |
| Exact-target grouping and conservative history/gates                         | Semantic similarity may suggest relationships, not merge authoritative identities.                                    |
| Naming evidence deliberately omits actual name strings                       | Semantic analysis needs a separately approved, minimal text-capture contract. Current reports alone are insufficient. |

The [realtime observation and agent-conformance proposal](propellr-realtime-agent-conformance.html) is still proposed, not implemented. Its one-live-page identity checks, bounded observation and Stagehand evaluation are prerequisites for broad realtime use, not functionality supplied by Jev. Preserve its no-model observer lane and measure model latency separately from its proposed 500 ms local delivery target.

Relevant implementation seams: [scan lifecycle](../src/host/scan.ts), [trusted playbook](../src/host/playbook.ts), [result contracts](../src/contracts.ts), [browser reader](../src/browser/index.ts), and [reporting/gates](../src/reporting/index.ts).

## Ranked opportunities

All benefits below are hypotheses. Effort is relative integration scope, not a delivery estimate.

| Priority | Use case                                            | Why Jev fits                                                           | Expected benefit                                                              | Effort / principal risk                                       |
| -------- | --------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **1**    | Next-probe and playbook selection                   | Choice over approved candidates plus independent suitability questions | More useful states reached per browser action; fewer expensive planning turns | Medium; candidate collection and playbook support are missing |
| **1**    | Evidence-backed agent claim checking                | Narrow Choice/Noul judgments against actual trace records              | Catch “fixed” or “tested” claims that overstate evidence                      | Small for offline experiment; correlated model errors         |
| **2**    | Contextual accessibility review                     | Text-based relevance, clarity and recovery judgments                   | Find barriers beyond attribute-presence checks                                | Medium; text disclosure, calibration and human adjudication   |
| **2**    | Adaptive evidence acquisition                       | Rank which available observation would resolve uncertainty             | Avoid both giant snapshots and unnecessary reasoning calls                    | Medium/high; instrumentation and state modeling               |
| **3**    | Repair-candidate routing and source-grounded advice | Select vetted recipes; flag unsupported explanations                   | Fewer speculative patches and standards miscitations                          | Medium; source/component bindings and generative tooling      |
| **3**    | Root-cause suggestions and corpus discovery         | Pairwise semantic judgments, decomposed features                       | Better reviewer queues and focused new fixtures                               | High; false merges, leakage and output-use terms              |

### 1. Test the frontier of unknown behavior, not just the current DOM

Maintain a bounded record of observed states, permitted transitions and unresolved test obligations. No graph database needed: initially an in-memory session record and replayable trace suffice.

Example: an address form contains an optional “Use a different delivery address” control. A static scan never sees the revealed fields. Rather than give a large model the entire page on every turn:

1. Code enumerates allowed control candidates and describes their observed text/relationships.
2. Jev ranks which candidate is likely to reveal address inputs and separately estimates whether any candidate fits.
3. Host checks permission, current target identity and preconditions before executing an approved fixture interaction.
4. Browser observations establish whether new fields appeared; a real scan evaluates them.
5. New evidence determines the next obligation, such as validation feedback or keyboard recovery.

Batch widget intent, likely disclosure behavior and playbook fit when they use the same state. Keep dependent post-action questions for after observation. Include `none` and `need-more-evidence`; a high-ranking candidate is not necessarily suitable. [S3, S5, S13]

**Architectural leap:** schedule tests around **goal × application state × interaction modality**, not URL × rule. This exposes failures in transitions, recovery and alternate interaction paths. Jev provides prioritization, not proof that an unvisited branch is accessible. Retain an explicit unexplored frontier and exploration budget; prioritize low-ranked branches periodically so the model cannot permanently hide surprising barriers.

### 2. Return evidence-backed results to coding agents

Agents should receive more than a violation list or a model's “looks fixed.” Introduce a separate proposed verification record containing:

- Requested claim and scope: for example, “dialog trigger now has a name,” not “dialog is accessible.”
- Exact target, document, scan/checkpoint references and engine/rule versions.
- Executed interaction and observed postcondition, where an interaction was tested.
- Coverage gaps, stale evidence, skipped obligations and verification method.
- Final disposition: supported within scope, contradicted, or insufficient evidence.

Code handles checks it can establish exactly: was the promised scan executed, did the expected checkpoint occur, was the result current, and was comparable coverage retained? Jev handles narrow semantic checks, such as whether a prose claim goes beyond the supplied observations. Free-form claims can first be decomposed by a generative model, but that extraction is also untrusted and must not omit inconvenient claims. Prefer agents submitting typed claims when possible. [S10, S14, S15]

Example: an agent reports “checkout is accessible” after adding labels and running naming rules. Code already knows the coverage is insufficient for that claim. Jev may help interpret the wording, but cannot upgrade the evidence. Conversely, a fresh naming scan can support the narrower repair claim without waiting for Jev.

**Architectural leap:** make verifiable feedback the product agents consume. Another scanner can add a chat summary; a trustworthy action-to-evidence history is harder to reproduce. These records are scoped verification receipts, not compliance certificates or proofs of all behavior.

### 3. Add a semantic review lane without contaminating rule verdicts

Promising text-only questions:

- Does a nonempty control name describe its surrounding task, or is it generic/misleading?
- Does a validation message identify the affected field and explain a recovery action?
- Do similarly named controls have enough local context to distinguish their purposes?
- Does observed status text communicate the task outcome rather than merely repeat an action?

This goes beyond testing whether an accessible name exists. It does **not** let Jev determine computed names, focusability, contrast or whether a screen reader announced text. Browser code must establish structural facts; assistive-technology claims require the relevant observation capability.

Publish these initially as **semantic review candidates**, with target/evidence references, rubric/model versions and uncertainty. Keep them outside baseline `Occurrence` verdicts, `Report` counts and gate exceptions. Promotion into an enforced custom check needs its own reviewed semantics and acceptance evidence. A clean semantic review must never override a deterministic violation.

Jev cannot compare alt text with actual image contents. A vision model could supply another evidence channel later, but then image capture, vision accuracy, latency and privacy are separate costs and limits. [S7, S8]

### 4. Spend uncertainty on better observations before bigger models

Low confidence often means missing evidence, not insufficient intelligence. If a modal's behavior is unclear, asking a larger model to reread the same snapshot may only produce a more persuasive guess.

Build an **evidence acquisition policy**: permitted next observations include inspect a relationship, exercise a trusted keyboard probe, wait for a declared async condition, or request human review. Jev estimates relevance; code applies measured cost, permissions and mandatory test obligations. Start with simple ranking, not a speculative learned scheduler.

Example: “Does this message help recover from failure?” is ambiguous without the attempted task and the field association. Retrieve those specific facts, then re-evaluate. Do not export the whole application “for more context.”

Later, use owned transition outcomes to improve probe utility estimates. Reserve held-out applications and interaction families so the system learns transferable exploration strategies, not fixture names. Do not assume permission to distill Jev outputs into a replacement model. [S8, S17, S19]

**Architectural leap:** uncertainty becomes a request for an experiment. This is more useful than an AI score attached to every DOM node.

### 5. Verify interaction invariants and repair outcomes

Longer term, test paired interaction paths with the same declared task postcondition: reference path versus keyboard-only path, or behavior before and after an approved repair. For a dialog, obligations might include reaching the trigger, opening it, exercising expected controls, closing it and restoring focus appropriately for that scenario.

Jev can classify the interaction pattern and select a reviewed probe. It cannot invent universal keyboard expectations or infer actual assistive-technology behavior from DOM roles alone. Dialog focus and broader interaction oracles would be **new implementations**, not capabilities of today's naming rules or trusted playbook.

A generative agent can propose a patch; Jev can rank applicable vetted repair recipes or flag mismatches between patch rationale and evidence. Acceptance still requires real before/after behavior, comparable scans and regression checks. No auto-merge or arbitrary browser mutation. Unsupported standards citations go to review, not a confidently generated explanation. [S14, S15]

### 6. Grow a defensible evidence corpus, not an AI wrapper

Retain authorized, minimized examples of barrier → action → observation → repair → re-observation. Connect repeated defects to source/component lineage when independently available. Jev can suggest a shared cause or prioritize ambiguous cases for expert adjudication, but similar wording or selectors alone cannot establish identity.

Useful research loop: human-reviewed failures inform new semantic questions and original fixtures; generative tooling proposes cases; deterministic oracles and independent reviewers establish expectations. Freeze a holdout that this loop cannot see. User testing and accessibility expertise remain essential for barriers that automation cannot judge reliably.

The defensible asset is the **quality of experimental coverage, evidence and adjudicated outcomes**, not exclusive access to Jev. These are differentiation hypotheses, not claims that named competitors lack equivalent capabilities; no competitor product audit was performed.

## Recommended integration boundary

```text
Live browser
  ├─ local exact collection + rule evaluation ──> raw scans ──> reporting/gates
  └─ approved minimal evidence
       └─ host semantic decision adapter (optional)
            ├─ deterministic fast path / fallback
            ├─ Jev: candidate ranking and narrow judgments
            └─ larger model or human when needed
                 └─ advisory decision tied to observed state
                      └─ host permissions + freshness checks
                           └─ trusted probe ──> fresh observation and scan
```

No new service, package graph, model SDK in browser analysis, or generalized agent framework. Start with one host module and schemas derived from actual use cases. The existing result model need not be rewritten for the offline experiment.

### Required contract properties

- **Evidence:** session/document/epoch, scoped targets, collector version, source provenance, omissions and bounded text. Current evidence does not retain name strings; capture must be opt-in and redacted before any egress. Missing text means unavailable semantic review, not permission to reconstruct it from secrets or raw HTML.
- **Decisions:** candidate IDs, raw probabilities, question/rubric/model versions, state digest, disposition and latency/token usage. A digest supports correlation, not anonymization or proof of correctness. Avoid free-form model-generated selectors or executable actions.
- **States:** advised, abstained, unavailable and stale are distinct. No model failure can suppress normal scanning. An enabled but unavailable advisory capability remains visible as unavailable.
- **Permissions:** host-owned candidate actions only. Page text, model confidence and another model's injection detector cannot authorize an action, broaden scope or waive a gate.
- **Freshness:** revalidate document and relevant change generation after inference and before action. Current scan epochs alone do not prove the DOM stayed unchanged after a scan. A new long-lived observation mechanism or fresh precondition check is required. Late replies remain historical advice, never current commands.
- **Bounds:** one bounded decision queue, coalesced superseded requests, total deadline, explicit token/spend ceilings and circuit breaker. Retry read-only inference only while evidence is current; never retry an uncertain browser side effect.
- **Provider boundary:** validate exact answer keys, allowed candidates, finite/ranged numbers and distribution consistency. Do not rely solely on inferred SDK types. Disable body logging. Pin `jev-1.13.0` for an initial evaluation; pin/review any client separately. [S9]
- **Caching:** start with exact request reuse only, scoped to tenant/session and model, rubric, collector and policy versions. A cached judgment still needs live target/permission checks. No fuzzy cross-page cache may assert equivalent state.

Confidence controls prioritization and abstention; it does not replace authorization. Question parallelism also does not prove statistical independence. Avoid multiplying probabilities into a claimed end-to-end reliability number.

## Will it speed up processing?

**Likely candidate: fewer expensive agent reasoning turns. Unproven: faster end-to-end journeys. Wrong target: faster deterministic scans.**

If the current workflow uses a large model to repeatedly classify widgets, choose a playbook and inspect trace claims, Jev could replace several such turns with one batched call. Savings disappear if extraction, network latency, fallback frequency or browser actions dominate. Compare at equal confirmed coverage and error rate, not equal request count.

A simple break-even model:

```text
Jev-assisted cost = evidence collection + Jev + fallback fraction × larger-model cost
```

Use the same decomposition for expected latency only when the stages are sequential. Measure tail latency directly; do not add stage p95s and call the sum an end-to-end p95. Also report cost and time **per successfully verified journey**, including failures and retries.

At listed prices, an illustrative 4,000-input-token request costs $0.000168; 10,000 cost $1.68 before other models, browsers and infrastructure. That is not a measured Propellr workload or an approved spend budget.

Capacity may matter before price: 1,200 requests/minute is an average of 20/second. One request/second across 100 sessions would require 100 requests/second and, at 4,000 tokens each, 400,000 tokens/second, above both published limits. Batch related questions, trigger at meaningful checkpoints and respect backpressure. Never issue an inference call for every node or mutation. [S7]

Keep baseline scan latency separate from time-to-semantic-advice. Do not make exact findings wait for the network. Preserve fair equivalent-work benchmarks against canonical axe-core; measure newly reached states and semantic coverage in separate lanes.

## Smallest evaluation worth approving

**Offline replay first; live routing second.** This is an experiment proposal, not a replacement for the existing approved phase boundaries.

Use original synthetic applications/traces with reviewer-authored expectations. Include dialog, form-validation, disclosure, ambiguous-control and no-applicable-probe cases. The first live slice should use only supported trusted interactions; other families can begin as offline trace cases, not claimed runtime support.

Proposed decision dataset: 240 cases grouped by application/template, split 80 for development and 160 untouched for evaluation. Include broken/repaired variants, missing evidence, denied frames, stale targets, deceptive page instructions, non-English text and misleading but valid names. Keep variants in the same split. Have two reviewers adjudicate semantic labels; retain genuine ambiguity rather than force agreement. This size is an initial engineering screen, not rare-event safety certification.

Compare four arms on identical evidence and candidate sets:

1. Useful deterministic heuristic, including explicit abstention.
2. Native structured-output small LLM, without unnecessary reasoning or probability generation.
3. Jev alone.
4. Jev with evidence-gathering/escalation routing.

For abstaining arms, score the complete route, including fallback cost and failures. Preserve the unassisted agent baseline in any subsequent end-to-end comparison. Freeze model versions, rubrics, thresholds, request limits and stopping rules before the held-out run.

| Question                  | Required measurement                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Better decisions?         | Probe suitability, useful new states reached, missed barriers, inappropriate recommendations, and abstention rate                                 |
| Trustworthy claim review? | Precision/recall for unsupported claims, especially false acceptance; exact versus semantic checks reported separately                            |
| Meaningful probabilities? | Reliability plots and Brier score against adjudicated labels, plus error-versus-automation-rate curves; segment by task/language/evidence quality |
| Faster/cheaper?           | End-to-end p50/p95, tokens, retries, escalation rate and cost per verified journey; client-region and queue time recorded                         |
| Safe integration?         | Zero unauthorized execution, stale action or false resolution in executed cases; adversarial model advice may fail, host enforcement must not     |
| No degradation?           | Same raw scan results/coverage/gates with Jev off, unavailable or delayed; no new network dependency for baseline operation                       |

**Proposed adoption bar, to approve before execution:** preserve the quality floor and show either at least 30% lower cost/time per verified journey, or at least 20% more independently confirmed useful states at the same budget. Report uncertainty and all attempts; inconclusive evidence means no adoption claim. Choose thresholds on development data, not the holdout. Zero observed harmful errors is a test result, not proof of zero future risk.

If offline results justify it, conduct a separately approved, bounded synthetic-browser experiment with real interventions and repeated held-out journeys. Static ranking accuracy does not establish live usefulness. Missing credentials, unsuitable access or absent egress approval means blocked live evaluation, not a cached-demo success.

## Decisions and diligence before implementation

1. **Approve only the evaluation scope**, exact models, synthetic-data disclosure and numeric spend cap. No customer data or production targets.
2. Confirm account availability, rate-limit behavior, stable model lifetime and region/tail-latency expectations. Clarify what “type-safe by construction” covers at the service boundary.
3. Obtain applicable retention/ZDR terms, subprocessors and residency commitments. US-hosted Jev must remain optional for private/offline deployments. [S16–S18]
4. Clarify permitted downstream learning and synthetic adversarial evaluation in writing. The MCA's restrictions make automatic Jev-to-local-model distillation an unsafe assumption, despite the feature-learning cookbook. [S17, S19]
5. Decide whether to authorize minimal semantic text capture separately from current scan evidence. Redaction that removes essential meaning must produce an evidence gap, not a guess.

**Do not build yet:** learned scan skipping, probabilistic issue merging, cloud-required baseline checks, Jev-driven quality-gate waivers, unrestricted browser actions, a graph platform or an accessibility “autopilot” that certifies itself.

## Final call

**Pursue the architecture; make Jev earn the implementation slot.** The high-value move is not adding AI to axe-style findings. It is making Propellr a fast, evidence-driven partner for agents: selecting useful tests, exposing uncertainty, verifying real changes and preserving every limit of what was observed. That direction remains valuable even if a heuristic, another model or a future local provider wins the evaluation.
