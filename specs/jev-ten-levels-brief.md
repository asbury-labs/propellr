# Jev: ten integration levels and where they fit Propellr

September 29, 2026. Research brief, not an approved plan. It builds on the [Jev brief](jev-brief.md)
and [Propellr recommendations](propellr-jev-recommendations.md) of September 23, and on the phase 2
dev evaluations in [component inference evidence](component-inference-validation.md). Source:
[disler/ten-levels-of-jev](https://github.com/disler/ten-levels-of-jev) (README, the
`apps/ten-levels` rules and the `hyper-jev` cookbook), read September 29, 2026. Its figures are the
repo's own live runs and were not reproduced here.

Plan: [Jev semantic review and scale integration](propellr-jev-semantic-review.html).

## The ten levels

Levels 1–5 call Jev from code. Levels 6–10 put Jev inside a coding agent's loop, and each level gives
the agent more say over the questions.

| #   | Level             | The one idea                                                                                                                          | Repo examples                                                                                |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Single decisions  | One `noul` is a smart `if`: code owns the threshold                                                                                   | Prompt-injection gate, urgency gate (≥ 0.7), ticket classifier with an `other` exit          |
| 2   | Multiple choice   | Ask every question about one state in one call; code picks which answers to use                                                       | Support triage, resume screening, sponsor qualification                                      |
| 3   | Composite scoring | One `score` per factor, weights in code; Jev never sees them                                                                          | Ticket priority (severity 0.6, frustration 0.3, quality 0.1), code-review risk, idea verdict |
| 4   | Confidence gating | "The answer says what, confidence says whether": below a 0.5 floor a human decides, above a 0.9 bar it acts, between them it confirms | Bash-command gate, account actions, citation check                                           |
| 5   | Routing           | One cheap decision in front of expensive work                                                                                         | Agent, intent and model routers                                                              |
| 6   | Guardrail hooks   | Jev on every tool call and tool result; the agent never sees it                                                                       | Blocks `rm -rf` and credential writes; flags an instruction planted in a file at 0.98        |
| 7   | Should I compact  | Four questions after each turn; the token lines stay in code                                                                          | Detects a task switch at 0.97; picks the cut point                                           |
| 8   | Cheap reads       | A judgment about a file, never the file itself                                                                                        | "Does session.ts validate tokens?" for $0.00049, 187× less than one large-model read         |
| 9   | Files at scale    | The same question block over many files in parallel, then pick one                                                                    | 17 files asked, 2 relevant, one opened                                                       |
| 10  | Agentic Jev       | The agent writes its own questions through an `ask_jev` tool                                                                          | Triages a test failure, scores its own diff: 3 calls, $0.000084                              |

The repo's rules, which match TypeSafe's guidance:

- One snap judgment per question.
- Fan out independent questions in one call.
- Keep numbers, dates and counting in code.
- Treat confidence as a second axis.
- Always offer an `other` / `none` exit.
- Describe situations, not degrees.
- Keep questions and thresholds in one reviewable file.
- Isolate the state.
- Make a second request only for a real dependency.
- Prune candidates to the 255-option cap in code.

It warns that numbers "move a little from run to run", and that a security gate is one signal, not a control.

## What the phase 2 evaluation taught us

- **We starved Jev.** Component attribution sent text-free fingerprints: element names, opaque
  shape hashes and repeat counts. That is the heuristic's own signal, so Jev, Haiku and
  `structural-template/1` made the same membership choice on every dev case. Jev adds value only
  where the state carries meaning, and our privacy boundary removed it.
- **Wrong target.** Component membership is structural. Code answers it for free, and
  instrumented apps answer it exactly.
- **Confidence was ignored, then gated.** The draft gate (#24) raises Jev's dev precision from
  0.75 to 1.00 at 0.75 coverage, but only in-sample and 0.01 from the gate, and Jev varied between
  identical requests.

## Where Jev fits Propellr, ranked

All benefits are hypotheses until evaluated.

### 1. Semantic review lane (levels 1–4)

Today's naming rules check that a name exists, not that it is useful. Many real barriers sit in
that gap:

- link purpose (WCAG 2.4.4) and descriptive headings and labels (2.4.6);
- generic or filename-like alt text (1.1.1, judged from text only; Jev cannot see images);
- error messages that don't explain how to recover (3.3.3);
- identically named controls that can't be told apart.

For each element that passes a naming rule, ask these as one fan-out call. Keep the weights in
code and apply a floor/bar confidence gate: auto-flag, review, or abstain. Results are **review
candidates**, kept outside `Occurrence` verdicts, report counts and gate policy, as AGENTS.md
requires. The labeling sheet and comparison tooling from #23 carry over for adjudication.

### 2. Triage at scale (levels 3, 5, 9)

- **Impact scoring:** estimate user impact per finding (a critical-path control versus a footer icon) from factor scores with weights in code.
- **Routing:** send each finding to a fix recipe, a coding agent, a vision model or a human.
- **Source localization for uninstrumented apps:** ask every source file in parallel whether it renders the failing component, then pick one. This is a third attribution path, beside the bridge and the structural heuristic.

Illustrative arithmetic, not measured: about 300 tokens per element means a million elements cost
about $13 at $0.042 per million tokens. The published limits (1,200 requests a minute,
250,000 tokens a second) bind first. Batching about 20 elements per page request would take
roughly 40 minutes per million elements.

### 3. Agent-loop guard and cheap reads (levels 6, 8, 10)

Propellr already delivers repair views to agents over IPC.

- **Result screen:** page text is untrusted, so screen what Propellr hands an agent and flag
  instruction-like content with a banner. This is a signal, never a control.
- **Cheap reads:** let agents ask typed questions about observed page state instead of loading
  DOM dumps into their context.
- **Claim checks:** check agents' "fixed" or "tested" claims against scan evidence, for the
  verification records proposed on September 23.

### Not recommended

Keep Jev out of:

- rule verdicts, gate waivers and scan skipping;
- judgments about images;
- per-node or per-mutation calls, which the rate limits cannot sustain;
- distilling Jev's outputs into a replacement model, which the MCA restricts.

## Prerequisite and first step

1. **Text capture.** Semantic review needs an approved, minimal, redacted text-capture contract
   (names, labels, alt, link text and nearby headings), used first on synthetic fixtures only.
   Naming evidence deliberately omits these strings today (September 23 recommendations, open
   decision 5).
2. **First pilot: semantic naming review** over the existing naming rules. It compares the
   heuristic, Jev and Haiku under a frozen floor/bar gate, with two-person adjudication.
3. **The phase 2 PR stack:** land #20–#23, whose transport, approval gates, LLM comparison arm and
   labeling tooling are reused. Park #24; if the attribution evaluation continues, replace its
   single threshold with a floor/bar gate.
