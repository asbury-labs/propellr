# Semantic naming review protocol, phase 2

October 23, 2026. **Draft for Tony's approval; not frozen.** Plan:
[Jev semantic review](propellr-jev-semantic-review.html), phase 2. Branch
`docs/semantic-review-protocol` from `main@9e18521f`. Input contract: the approved
[text-capture protocol](semantic-text-capture-protocol.md) and its phase 1 implementation
([evidence](semantic-review-validation.md)).

Phase 2 builds everything needed to evaluate a semantic naming review, with no provider calls.
Phase 3 spends. This protocol fixes the questions, arms, gate rule, metrics and adoption bar
before any of that exists, so that no dev result can shape them.

## Approval boundary

| Gate                                                                     | State                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Rubric `semantic-naming@1`, arms, corpus design, gate rule, metrics, bar | **Draft, awaiting Tony**                                |
| Phase 2 implementation (corpus, heuristic, adapters, evaluator, sheet)   | Not authorized until this protocol is approved          |
| Provider calls, credentials, spend and text egress (dev and holdout)     | Not authorized; per-arm approval records at phase 2 end |
| Labeler time (Tony plus one colleague, 240 cases)                        | Not requested yet; asked at the phase 2 stop            |
| Customer pages, source, production or live channels                      | Not authorized                                          |

Approving this protocol authorizes phase 2 implementation and its no-provider tests only. On
approval, record approver, date and the SHA-256 of the approved bytes in an Approval section, as
phase 1 did, and pin the final revision in `tools/semantic-protocol.json`. The evaluator refuses
to run any arm, including the heuristic, when the pin does not match. No record is manufactured
on Tony's behalf.

## Separation

Results are `SemanticReviewCandidate` records stored beside a scan, never inside it. They never
change `Occurrence` verdicts, coverage, `reportScan`, `applyGate`, grouping or text capture. An
isolation test proves `reportScan` and `applyGate` are byte-identical with candidates present or
absent. A candidate is advisory. Phase 2 and 3 add no IPC command or advertised capability.

## Population and applicability

A case is one target record in a redacted text capture (`propellr-redaction/1`) whose name is
available, non-empty and not `redacted-unavailable`.

A captured `name` is the text of the rule's successful check, not a full accessible-name
computation: `link-name` captures visible contents ahead of an overriding `aria-label`, for
example. The rubric judges the name a screen reader announces, so the corpus must make the two
equal. Invariant, checked by the corpus test: for every case, the captured name equals the
computed accessible name that Chromium reports for the element (CDP `Accessibility`), and no case
has competing name sources. A page that breaks it fails the test and is fixed before use. Results
are claimed only for names that meet this invariant, not for successful-check text in general.

Code decides which questions apply; the model is never asked a question whose evidence is
missing:

| Question          | Applies when                                                                  |
| ----------------- | ----------------------------------------------------------------------------- |
| `descriptive`     | Every case                                                                    |
| `generic`         | Every case                                                                    |
| `filename`        | Rule is `image-alt` or `input-image-alt` and `review.filename` is `available` |
| `distinguishable` | `review.distinguishable` is `available` and `sameName.count` is 2 or more     |

Authored empty alt is not a case (decorative images have no name to judge). An unavailable
question for a case is recorded as `not-asked`, separate from abstention.

## Provider state

Each arm sees the same allowlisted projection of one redacted target, with an opaque
request-local ID:

```json
{
  "id": "t07",
  "rule": "link-name",
  "role": "link",
  "name": "Read more",
  "heading": "Spring garden checklist",
  "container": "Ten jobs to do before the last frost.",
  "image": { "alt": "…", "basename": "…" },
  "sameNameCount": 3
}
```

`heading`, `container` and `image` appear only when available; `sameNameCount` only when
`distinguishable` applies. Never sent: target paths, page, document, scan or session IDs, URLs,
check IDs, redaction metadata, raw scan or report objects, other targets' fields (in per-target
mode) or secrets. The state description says that omitted fields are unknown or absent.

## Rubric `semantic-naming@1`

Wording is frozen with the rubric version; any change is a new rubric and a new dev run. The
instructions are complete because question IDs are not sent to the model.

**`descriptive`**, Score. Instructions: "A screen reader user hears the accessible name in
`target.name`, possibly on its own in a list of links or controls. Using that name, the nearest
heading `target.heading` and the surrounding text `target.container` when present, which
situation describes how well the user can tell what this element does or where it leads, or,
for an image that is not a link or button, what the image shows or conveys?" Levels, low to
high:

0. "Neither the name nor the heading and surrounding text say what the element does, where it
   leads or what the image shows, or the name contradicts what the heading and surrounding text
   say it is for."
1. "The name is vague, such as one general word. The heading or surrounding text hints at the
   purpose or the image's content, but the user still has to guess."
2. "The name together with the heading or surrounding text makes the element's specific action
   or destination, or the image's specific content or purpose, clear."
3. "The name on its own states the element's specific action or destination, or the image's
   specific content or purpose."

**`generic`**, Noul. Instructions: "Is the accessible name in `target.name` generic wording that
could label almost any link or control, in any language, rather than words about this
element's own action, object or destination?" True: "The name is placeholder wording such as
'click here', 'more' or 'button'." False: "The name contains words specific to what this
element does or where it leads."

**`filename`**, Noul. Instructions: "Does the image's accessible name in `target.name` (alt text
`target.image.alt`) read like a file name or storage identifier rather than text written for
people? Compare it with the image file name `target.image.basename`." True: "The name is a
file name, a camera or export identifier, has a file extension, or copies the file name."
False: "The name describes the image or its purpose in words written for people."

**`distinguishable`**, Noul. Instructions: "`target.sameNameCount` elements on this page,
including this one, have exactly the accessible name in `target.name`. From the nearest heading
`target.heading` and surrounding text `target.container`, can a user tell which item, record or
section this particular element acts on?" True: "The heading or surrounding text identifies the
specific item this element applies to." False: "Nothing in the heading or surrounding text tells
this element apart from others with the same name."

**`exit`**, Noul, asked once per case beside the others. Instructions: "Does `target` give
enough readable information to judge whether its accessible name would be useful to a screen
reader user?" True: "The name and any context are readable and specific enough to judge."
False: "The text is garbled, cut off, in a script or language that cannot be read, or too
fragmentary to judge." When `exit` is below 0.5, every question for that case abstains. The
0.5 threshold is fixed now and never tuned.

### Defect probability

Each answer becomes the probability `p` that the name is defective for that question, the only
gate input:

- `generic`, `filename`: `p = noul`.
- `distinguishable`: `p = 1 − noul`.
- `descriptive`: the probability of a defect level, matching the binary label below. Jev:
  `p = P(level 0) + P(level 1)` from the Score distribution; the `score` position is validated
  but unused. Haiku: `p = 1` for level 0 or 1, `p = 0` for level 2 or 3.
- Heuristic arm: `p = 1` where its rule applies, abstain otherwise.

Choice, Score and model confidence are not used. Gates, dispositions and metrics are per
question.

## Arms

All three arms receive identical state and are scored by the same evaluator.

**Heuristic, `semantic-heuristic/1`** (`src/review/heuristic.ts`, no network). Names are
compared after lowercasing, compacting whitespace and removing leading and trailing
punctuation.

- `generic`: `p = 1` when the name is in the frozen list below; otherwise abstain.
- `filename`: `p = 1` when the name ends in an image file extension
  (`/\.(jpe?g|png|gif|webp|avif|svg|bmp|tiff?|heic)$/i`), starts like a camera or export
  name (`/^(img|dsc|dscn|pxl|screenshot|photo|image)[-_ ]?\d+/i`), or equals the basename
  with its extension removed; otherwise abstain.
- `distinguishable`: `p = 1` when `sameNameCount` is 2 or more and neither heading nor
  container is available; otherwise abstain.
- `descriptive`: always abstains.

Generic list: `click here`, `click`, `here`, `more`, `read more`, `learn more`, `see more`,
`link`, `button`, `submit`, `go`, `ok`, `continue`, `next`, `details`, `view`, `info`,
`image`, `picture`, `photo`, `icon`, `menu`, `this`; German `hier`, `hier klicken`, `mehr`,
`mehr erfahren`, `weiter`; Spanish `aquí`, `haga clic aquí`, `más`, `leer más`, `ver más`;
French `ici`, `cliquez ici`, `plus`, `en savoir plus`; Japanese `こちら`, `詳細`, `もっと見る`.

**Jev** (`src/host/semantic-review.ts`), `jev-1.13.0` at the pinned TypeSafe endpoint, over
`BoundedTransport` with the attribution adapter's bounds: 64 KiB request, 10 s total deadline,
at most 3 attempts, retries only on 429, 529 and network errors, no redirects, 256 KiB response
cap, no body logging. Strict response validation: the model must match and answer keys must
equal the asked question keys. A Noul answer is `{type: "noul", noul}` with `noul` finite in
[0,1]. The `descriptive` answer is `{type: "score", score, probabilities, legend, confidence}`:
`score` finite in [0,3]; `probabilities` keyed exactly `"0"`–`"3"`, each finite in [0,1],
summing to 1 ± 0.02; `score` within 0.02 of the probability-weighted level; `confidence` finite
in [0,1] and otherwise unused; `legend` must equal the sent levels. Anything else is
`invalid-response` and undecided.

**LLM**, `claude-haiku-5-5` with adapter settings from the October 21 amendment of the
attribution protocol (no temperature, adaptive thinking at effort `low`, `max_tokens` 4096,
structured output). Answer schema: one `{probability}` per Noul and `{level}`, an integer 0–3,
for `descriptive`, so its descriptive `p` is 1 or 0. It has no score distribution. Validation: answer keys must equal the asked question keys, every
`probability` finite in [0,1], every `level` an integer from 0 to 3, no other fields. A
`refusal` or `max_tokens` stop is `invalid-response`.

**Cache.** Exact canonical input plus model, adapter, rubric, redaction and capture versions;
validated answers only. Repeated dev runs measure run-to-run variation, so the cache is scoped
to a single run and never carries answers between runs.

### Request mode

Two modes run on dev for each provider arm: **per-target** (one request per case, its applicable
questions fanned out) and **per-page** (one request per corpus page, all cases as
`targets[i]`, questions per case). Per-target isolates state; per-page can see when same-named
controls share identical context, which per-target cannot. Each per-page question is the frozen
per-target wording with every `target` path rewritten to `targets[i]` (for example
`targets[3].name`), prefixed with "Answer only about `targets[i]`, the element with ID
`targets[i].id`; use other entries only to compare." Question IDs stay invisible to the model;
the index in the wording binds each answer to its case, and the evaluator maps answers back by
the question ID it generated for that index. One mode per arm is frozen by
amendment after the dev runs and before gate derivation, on dev metrics only. The holdout runs
only the frozen mode.

## Corpus

`test/fixtures/semantic/corpus.ts`: 12 original synthetic families, one page each, exactly 20
cases per page (240). Splits are by family, never by case. **Dev** (80): product grid, blog
index, photo gallery, settings form. **Holdout** (160, sealed): order history, analytics
dashboard, news home page, media library, checkout and account, site navigation and footer,
event listings, support knowledge base.

Every family uses the same composition, so that each split covers every question:

| Cases per family | Content                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| 6                | Images (`image-alt` or `input-image-alt`); exactly 4 with filename-like alt |
| 6                | Three same-name pairs; context tells one pair apart and not the other two   |
| 8                | Links, buttons and form controls: descriptive, generic and misleading names |

The fixed counts give dev 16 positive cases for `filename` and for `distinguishable`, so the
support rule below can be met. At least 2 cases per family use German, Spanish, French or
Japanese, descriptive and generic. Misleading names (a name that contradicts its heading or container) appear in every family. Each
page's passing naming population is exactly its 20 cases, all seven naming rules are selected,
and the page fits the shared 2,000-step naming budget. A corpus test asserts, in Chromium, that
every page yields an available capture with 20 cases, complete same-name counts, no redacted
field and every captured name equal to the computed accessible name. No case is adversarial or injection-shaped (`adversarialTesting: "not-permitted"`).

Truth comes only from human labels (phase 3). Families carry no oracle answers in code. The
authoring intent per case (for example "filename-like") is recorded for corpus checks and is
never truth.

## Labels and truth

The generalized labeling sheet (`--corpus semantic`) shows each labeler the same projected state
the arms see, one page at a time, with opaque case IDs and the private key kept off the page.
For `generic`, `filename` and `distinguishable` a labeler answers `defect`, `not-defect` or
`cannot-tell`. For `descriptive` a labeler picks the rubric level (0–3) or `cannot-tell`; the
binary label is fixed now: levels 0 and 1 (the user has to guess) are `defect`, levels 2 and 3
are `not-defect`. Levels are kept for agreement reporting. Tony and one
colleague label all 240 cases independently. `pnpm labels:compare` records agreement, Cohen's
kappa per question and every disagreement.

The truth policy (how disagreements and `cannot-tell` become truth; never averaged) is written
and pinned by amendment in phase 3 **before** any gate is derived. Until then no threshold
exists.

## Gate: floor and bar, per arm and question

Computed on dev only, from at least 3 repeated runs per provider arm in the frozen mode, pooled:
every (case, run) answer is one observation.

- **Support:** a threshold is eligible only if the set it defines holds at least 10 distinct dev
  cases from at least 2 families. An empty or smaller set has no precision and never qualifies.
- **Bar:** the smallest eligible grid threshold (0.50, 0.55, …, 0.95) at which flags (`p ≥ bar`)
  reach at least 98% precision against dev truth.
- **Floor:** the largest eligible grid threshold, below the bar when one exists, at which the
  review band reaches at least 50% precision. The band is `floor ≤ p < bar`, or `p ≥ floor` with
  no bar.
- With no bar the arm never flags for that question. With a floor, answers at or above it go to
  review and the rest abstain. With neither, the arm abstains on that question.
- The heuristic needs no derivation: `p = 1` flags.

Thresholds and their margins (distance from the next grid point that would change the decision)
are recorded by amendment and re-pinned before the holdout. A test re-derives them from the
committed dev evidence.

## Metrics, per arm, question and split

Flag precision and recall, review-queue size and band precision, abstention and `not-asked`
counts, Brier score of `p` on answered cases, uncached latency p50/p95 per case, cost per 1,000
cases, attempts and failures by code, and on dev, run-to-run agreement (share of cases with the
same disposition in every run, and mean absolute difference in `p`). Intervals are bootstrapped
by family (2,000 resamples, fixed seed); with 4 dev families they are wide and are reported as
such. Every metric is reported whether or not an arm is adopted, including failures.

## Adoption bar, frozen now

Per provider arm and question, on the holdout under its frozen gate:

1. Flag precision ≥ 98%.
2. Flag recall ≥ 20% of true positives.
3. Incremental value: flag recall at least 10 percentage points above the heuristic's on the same
   question, with flag precision at least the heuristic's (matched precision). Where the heuristic
   never flags (always for `descriptive`), its recall is 0 and criterion 1 sets precision.

An arm is adopted only for the questions that meet all three. Cost and latency are reported, not
gated. A changed model, adapter, rubric, corpus or truth policy requires re-evaluation. A study
of this size cannot certify rare error rates.

## Disclosure, spend and approvals for phase 3 (proposed, decided at the phase 2 stop)

Each provider arm needs a machine-checkable record (`PROPELLR_SEMANTIC_JEV_APPROVAL`,
`PROPELLR_SEMANTIC_LLM_APPROVAL`) validated before any browser work or client construction:
provider, exact model, endpoint, adapter version, approver and date,
`textDisclosure: "synthetic-only"`, this protocol's pinned SHA-256, terms review (evaluation-only
output reuse, distillation prohibited, adversarial testing not permitted) and numeric request,
spend and price ceilings. The text-free attribution records do not satisfy it.

Synthetic-only is established by host-owned corpus provenance: the evaluator renders only the
pinned corpus revision and refuses any other origin before constructing an adapter.

Estimated attempts per arm: dev 3 runs × 80 per-target plus 3 × 4 per-page, holdout 160 at most,
about 412 before retries. Proposed ceilings: **Jev 600 requests and $1.00; Haiku 600 requests
and $3.00** (long-prompt price card, as in `llm-2026-10-21.json`; estimated actual about $1).
Labeler time: about 600 judgments per person; roughly two hours each, unmeasured.

## Phase 2 acceptance (no provider calls)

1. No-key loopback adapter tests for both providers: request shape, applicability, state
   projection (no forbidden field), invalid responses, status handling, retries, cancellation,
   spend reservation and per-run cache scope.
2. Pure tests: heuristic rules and list, defect-probability conversion, floor/bar selection edge
   cases (no bar, no floor, support boundaries, ties) and scoring.
3. Corpus test in Chromium as described above, plus isolation of `reportScan` and `applyGate`.
4. A real Chromium run of the generalized labeling sheet.
5. `pnpm validate` passes; `pnpm eval:semantic -- --arm heuristic --split dev` scores 80 dev
   cases with no provider call; `--arm jev` and `--arm llm` exit 2 without an approval record
   and key; a holdout request refuses until phase 3 conditions hold; a mismatched protocol pin
   refuses every arm.

## Interpretations and deviations from the plan, for approval

- **Exit.** The plan requires an explicit `insufficient-evidence` exit on every question, but
  TypeSafe's Noul and Score have no exit value (docs read October 23, 2026), and an exit is not
  an ordered Score level. One `exit` Noul per case, with a fixed 0.5 threshold, covers every
  question for that case, since all of them judge the same state.
- **Score levels.** `descriptive` has 4 levels, described as situations; the plan left L open.
- **Heuristic scope.** The heuristic only flags (`p = 1`) and never asserts a non-defect, and it
  never answers `descriptive`; the plan allows abstaining where its rule does not apply.
- **Image descriptiveness.** `descriptive` judges an image that is not a link or button by what
  it shows or conveys, since it has no action or destination.
- **Descriptive labels.** Labelers pick a level; levels 0–1 are a defect and 2–3 are not. The
  plan's `p = 1 − score / (L − 1)` is replaced by the probability of a defect level, so `p` is
  calibrated against that binary truth.
- **Name equals accessible name.** The corpus is restricted to cases whose captured check text
  equals Chromium's computed accessible name.
- **Matched precision.** Defined as criterion 3 above; the plan did not define it.
- **Request mode.** Both modes run on dev and one is frozen before gate derivation, following the
  plan's capacity note. This raises dev request counts.
- **Per-target `distinguishable` limit.** In per-target mode the model cannot see whether other
  same-named controls share identical context. That is measured, not assumed away.

Writing this draft authorized no code, dependencies, provider calls, spend, customer data or
disclosure.
