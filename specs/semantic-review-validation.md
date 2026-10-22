# Semantic review: executed evidence

## Phase 1: text-capture contract, October 22, 2026

Phase 1 of the [Jev semantic review plan](propellr-jev-semantic-review.html). Tony approved the
[text-capture protocol](semantic-text-capture-protocol.md) on October 21, 2026 (draft SHA-256
`2beadbeb…f2b8`, recorded in its Approval section). Branch `feat/semantic-text-capture` from
`main@84b197ea`. No provider call, credential, spend, text egress, customer page, IPC command
or advertised capability.

## What exists

- `scanComponents(..., { text: true })` returns `text` beside `scan` and `evidence`. Off by
  default: no collection and no added property. Nothing is added to `ScanResult`, occurrence
  evidence, reports or gates.
- Browser collector `src/browser/text-capture.ts` (`propellr-text-capture/1`, collector
  `semantic-text@1`). Each passing naming check records the text it already computed
  (`naming.ts`, `naming-rules.ts`); nothing is re-read or recomputed by another helper. Role,
  heading, container, image and same-name fields run after the raw results are final, on the
  residual naming budget.
- Host schemas `src/review/validation.ts` (types in `src/review/contracts.ts`). The browser
  imports types only; the bundle contains no Zod.
- `src/host/redaction.ts`: binds the capture to the completed scan (exactly one record per
  retained pass of a captured rule, same rule version and target), rejects stale scans, applies
  `propellr-redaction/1`, rechecks every bound and validates the result. Only the redacted
  sidecar leaves the function; failures return fixed codes, never page text.

## Executed results

**Pinned `pnpm validate` (Node 26.8.2, PNPM 12.4.1) exit 0 with 345 tests** on the final head:
68 contract, 44 host, 13 playbook, 80 parity/browser, 122 component (14 new) and 18 reporting,
plus build, six strict type scopes, lint and Oxfmt. The focused phase 1 command
(`pnpm build` then `vitest run test/components/text-capture.test.ts`) exit 0, 14 of 14.
Validation history: the first full run (pre-review head) passed with 344 tests; after the review
fixes, one run failed at lint (`no-useless-spread` in the new test) and the rerun passed. The
Copilot repair batch below added assertions to existing tests (still 14); its pinned validate
failed once at typecheck (DOM callback in a host-typed test) and once at lint (unused
destructured names), then exited 0 with the same 345 tests.

`test/components/text-capture.test.ts`, real Chromium, light DOM, open shadow roots, slots and
same-origin frames:

| Case                               | Result                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check identity                     | Every allowlisted check of all seven rules (asserted against `textChecks`), competing checks, empty alt, presentation, default submit/reset, authored value, multi-reference `aria-labelledby`, hidden refs                                                                                                                 |
| Leaks                              | Planted values, password, hidden input, textarea, selected option, script, hidden/inert/`aria-hidden` and editable text absent from the sidecar; a selected option referenced by `aria-labelledby` and `<output>` contents are `excluded-source`; heading context omits controls; naming evidence still has no name strings |
| Per-string bound                   | 160 units available, 161 `truncated`; 80 vs 81 emoji; long heading and container `too-long`                                                                                                                                                                                                                                 |
| Per-target and per-scan bounds     | A long target path and a 96-target capture over 64 KiB are `text-capture-limit`, raw results intact                                                                                                                                                                                                                         |
| Residual and raw budget exhaustion | `text-capture-limit`, including raw exhaustion with zero retained passes and 2,500 comment nodes in a container; raw findings unchanged                                                                                                                                                                                     |
| Context and populations            | Root-local headings, no cross-root container, slots read once, distinct frame targets; counts only for complete seven-rule populations                                                                                                                                                                                      |
| Redaction                          | Each pattern, overlaps, Unicode email, ordinary and non-English text unchanged, 5,000 generated idempotence probes, post-replacement bound, essential and basename-only redaction, population `name-redacted`                                                                                                               |
| Host validation                    | 15 malformed captures (including another epoch, missing scan identity and an image record without image fields), stale, missing, cross-scan and consecutive same-target captures fail closed without echoing page text                                                                                                      |
| Lifecycle                          | Stale transfer is unavailable; cancellation and navigation reject; the next scan binds to the new document                                                                                                                                                                                                                  |
| Isolation (every browser case)     | Raw rules/coverage, `reportScan` and `applyGate` byte-identical with capture on and off; default-off result has no `text` key                                                                                                                                                                                               |

Benchmark: `pnpm bench:slice` on the pre-review head and on `main@84b197ea`, one run each on the
same machine. Zero failures in all three engines. Cold medians moved −9% to +8% with no
consistent direction; warm medians under 5 ms moved −31% to +52%, within run-to-run noise. No
speedup or regression is claimed. The later review fixes only move attribute compaction after
the existing budget charge; the benchmark was not rerun after them.

## Review

An independent review confirmed raw-result isolation with capture off and on (same budget calls,
order and `available()` calls). Fixed from it: text directly inside an editable container
reached the excerpt; `text()`/`name()` compacted refused attributes before charging (also with
capture off); email missed Unicode addresses and trailing characters; redaction was not
idempotent when a later rule joined tokens; a `target-size` occurrence limit marked the naming
population incomplete; non-image targets claimed a filename question; a non-limit exception in
capture would fail the raw scan. Deferred with reasons: empty-alt images form one same-name group
(the protocol counts compact values literally); an unsupported explicit role is `unknown` (the
protocol allows either reading, and this never claims a role the page overrode); the digits rule
can split a long token before the token rule (fixed protocol order, and the target is already
`redacted-unavailable`).

Copilot review of `d519185c` (7 findings, all verified and fixed in one batch): a selected
option referenced by `aria-labelledby` and `<output>` contents reached an available name, so
option, output, select, textarea and datalist text now marks a name `excluded-source` (capture
metadata only; raw naming is unchanged); heading context used the naming text walk and could
include control text, so it now uses the container excerpt walk; raw budget exhaustion with no
retained pass returned an empty available capture; empty text and comment nodes in an excerpt
walk were not charged; child lists were copied before traversal; a capture could be bound to a
later scan with identical targets, so the browser now echoes the scan ID and epoch and the host
rejects a mismatch; an image-rule record without `image` passed validation.

## Interpretations

- Heading lookup reuses the reader's ordered facts and target paths for root identity; only
  heading text work is charged. The scan over facts is in memory and does no DOM traversal.
- A container excerpt is identical for targets the walk skips anyway (controls and images), so it
  is computed and charged once per container. Links get their own walk because their subtree is
  omitted.
- Excerpts insert a space at element boundaries so adjacent words do not merge.
- Heading text is a context excerpt of the heading (controls, hidden and embedded content
  omitted), not a naming computation; generated content is not read.
- The host passes the scan ID and epoch to the browser only when text is requested; the browser
  echoes them in the capture envelope and the host compares them before binding.
- The 1 KiB per-target bound is applied to the host record including `review` and `redacted`.
- `filename` is `not-applicable` for non-image targets; image targets need an available,
  unredacted basename.
- Redaction repeats its five rules in fixed order until nothing changes (capped at 16 passes;
  generated probes needed at most two changing passes).
- Conservative over-redaction is expected: ISO dates match the phone rule, and 24+ character
  strings of `a`–`f` letters match the hex token rule.

## Limits and next step

The frozen bounds share 2,000 naming steps with raw evaluation. A dense page can therefore make
the whole sidecar unavailable while the scan stays valid; phase 2 corpus pages must fit that
budget. Same-name counts are only available when all seven rules are selected and the population
is complete. Phase 2 (corpus, arms, frozen review protocol) has not started and needs its own
approval before any provider call.
