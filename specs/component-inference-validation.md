# Component inference: phase 2 evidence

## Checkpoint, September 24, 2026

Phase 2 of the [component intelligence plan](propellr-component-intelligence.html):
uninstrumented attribution and the Jev evaluation. Branch `feat/component-inference-eval` from
`main@f76a991e`. [Protocol](component-inference-protocol.md) was frozen before implementation
(one pre-code amendment: the structure step budget, 4,000 to 8,000).

**Decision: Jev is not adopted. Inference stays disabled.** The phase stops at its approval
gates. No provider credentials, spend authority, TypeSafe agreement review, LLM-arm approval or
human adjudicators exist. **Zero live provider calls were made.**

## What exists

- `propellr-structure-capture/1`: optional, text-free fingerprints (element names, allowlisted
  roles, opaque depth-2 shape hashes and repeat counts) for each violation's composed ancestor
  chain, in the same guarded scan call. 8,000 steps and 64 KiB; exhaustion makes the capture
  `unavailable`, never dropping raw findings. The host validates it like the bridge capture.
- `structural-template/1` heuristic (`src/components/discovery.ts`): candidates are repeated
  ancestors at distance ≥ 1, indexed by shape (no all-pairs comparison); the nearest is the
  decision; near-miss alternatives are kept; groups are suggestions with opaque `shape:` IDs.
- Host-only adapter (`src/host/component-decisions.ts`) for `POST /v1/systemone`, with the wire
  format confirmed against TypeSafe's public API reference: pinned `jev-1.13.0`, native `fetch`,
  HTTPS only (loopback only when explicitly allowed), 64 KiB requests, at most 10 s total and 3
  attempts, retries only for 429/529/network, immediate cancellation, strict response validation,
  exact-input cache of 256 entries, no logging. Not wired into any operation.
- Frozen corpus (`test/fixtures/components/corpus.ts`): 12 original families of exactly 20
  violation cases each. Dev has 4 families (80 cases); holdout has 8 (160, sealed).
- `pnpm eval:components`: refuses the `jev` and `llm` arms and the holdout with exit code 2.
  With an approval record and key, a live Jev lane runs over HTTPS only, capped at the
  approved request count. That path is untested because no approval exists.

## Executed results

**Pre-review pinned `pnpm validate` (head `33a1215a`) passed all 292 tests**: 68 contract, 44 host, 13 playbook,
80 parity/browser, 69 component and 18 reporting, plus build, types, lint and Oxfmt. The browser
bundle changed, so the unchanged three-rule `pnpm bench:slice` ran once: 3 engine tests,
0 failures, bundle hash matching. No performance claim.

- Corpus integrity: all 12 families yield exactly 20 violations, each with instrumented truth; no
  uninstrumented leaks. This used the instrumented arm only; no holdout trial ran.
- Structural capture in Chromium, Firefox and WebKit: raw results identical with it on; capture
  available and text-free for all dev families.
- Adapter, no keys, loopback server: valid answers, cache (hit, and miss on a new evidence
  version), 8 malformed-response shapes, non-JSON and non-finite bodies, 429/529 retry and
  exhaustion, 401 and 422 without retry, total deadline, cancellation, refused connection, HTTPS
  enforcement and no console output. These test integration behavior, not model quality.
- Injection-shaped roles become `div|other`; the page string never reaches a request.

Heuristic arm, dev split only (Chromium, `eval:components -- --provider heuristic --split dev`):

| Family          | Candidate recall | Decision precision | Pairwise precision | Overmerged pairs |
| --------------- | ---------------- | ------------------ | ------------------ | ---------------- |
| favorites-grid  | 1.00             | 1.00               | 1.00               | 0                |
| cart-callsites  | 0.00             | 0.00               | 1.00               | 0                |
| lookalikes      | 1.00             | 1.00               | 0.47               | 100              |
| fragments       | 1.00             | 1.00               | 1.00               | 0                |
| **Pooled (80)** | **0.75**         | **0.75**           | **0.87**           | **100**          |

Family-bootstrap 95% intervals (2,000 resamples, fixed seed): decision precision 0.25–1.00;
pairwise precision 0.61–1.00. Four families make these intervals wide. The two failures are
the ones the protocol predicts: a self-rooted primitive (IconButton) is never a distance ≥ 1
candidate, and identical markup from unrelated definitions overmerges. Coverage is 1.00: the
heuristic never abstains on dev. These are baseline numbers, not an adoption test.

## Blocked tasks

| Plan task                                         | State | Evidence                                                     |
| ------------------------------------------------- | ----- | ------------------------------------------------------------ |
| 240 cases adjudicated by two reviewers            | [f]   | Corpus frozen and split; labels are instrumented-oracle only |
| Compare heuristic, small LLM, Jev, Jev+abstention | [f]   | Only the heuristic arm exists, run on dev only               |
| Provider, spend, disclosure and terms approval    | [f]   | None given; no credentials                                   |
| Live `eval:components` run                        | [f]   | Refused with exit code 2 by design                           |
| Provider metrics (calibration, cost, latency)     | [f]   | No provider responses exist                                  |

## Failures and corrections

- Evaluator bug found by probing: truth and candidates were compared as whole targets, including
  each arm's own page/document IDs, so nothing matched and pairwise precision was trivially 1.
  It now keys identity on target paths. A missing truth case never agrees with another.
- The bootstrap initially let duplicated families pair with each other; copies are now distinct.
- Two test issues: a whitespace role triggers the reader's existing role-token limit, so the
  injection test uses one token; and `pnpm eval:components -- ...` forwards a `--` that the parser
  now strips, covered by a test.

## Review repair 1, PR #19

Copilot raised four findings:

- **Response buffering (fixed):** response bodies were buffered whole. They are now read to at
  most 256 KiB before parsing; a 300 KB body is rejected.
- **Spend cap (fixed):** the approval's spend cap was not enforced. The client now requires a
  budget and enforces requests and spend itself, charging the request byte count up front as a
  token upper bound. The test caught an earlier bytes/3 estimate that could overshoot.
- **Duplicate group IDs (fixed):** groups sharing a shape shared an ID. IDs are now unique per
  grouped key. The new test fails before the fix, and the evaluator's workaround is removed.
- **Page IDs in structure targets (clarified):** that the capture exposed page IDs was partly a
  false positive. Target paths are permitted, already in raw results, and stripped before any
  request; a test now asserts that no selector or page ID reaches a request body.

Pinned `pnpm validate` then passed all 295 tests (72 component). Browser source is unchanged by
this repair. The archive below describes the pre-review head `33a1215a`.

## Review repair 2, PR #19

Copilot found that the approval record did not encode the terms review or the exact
endpoint and client, so a minimally shaped record could enable a live call while those gates were
outstanding. The record now requires provider, model, exact endpoint and adapter, disclosure,
a terms review and numeric ceilings. It is validated before any browser work or client
construction. A test shows an incomplete record is refused with its missing fields named. No
pre-fix run was made, because it would have sent a real request with a placeholder key.
Pinned `pnpm validate` passed all 296 tests (73 component).

## Evidence artifacts

- [Manifest](component-inference-evidence/phase-2-manifest.json): approval state, corpus split,
  heuristic metrics, commands, source and archive hashes.
- [Raw archive](component-inference-evidence/phase-2-results.tar.gz): the heuristic dev report
  (all runs), validate, benchmark and evaluation logs including the refusals.
- Source-tree SHA-256: `526825d8044907a613b62bd119369ca2edebcb410fe2173ad9d39c26174e0491`.
- Archive SHA-256: `931dec1d8952118c7f5a8e4f916f2650dddc583514819be4fca99fedff5dc1d2`.

To resume: approve a provider, exact model, spend and request caps, and synthetic disclosure.
Complete the MCA review, provide two adjudicators and approve an LLM arm. Then run all arms on
dev, and on the sealed holdout exactly once, against the frozen adoption bar.
