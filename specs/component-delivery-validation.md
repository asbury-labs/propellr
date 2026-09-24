# Component delivery: phase 3 evidence

## Checkpoint, September 24, 2026

Phase 3 of the [component intelligence plan](propellr-component-intelligence.html): real
component ownership with one opt-in Vue integration, and additive host/agent delivery.
Branch `feat/component-delivery` from `main@ae10343a`. Tony directed phase 3 before phase 2
(explicit no-Jev decision); no provider, model or inference is involved.
[Protocol](component-delivery-protocol.md) was written before implementation.

## What exists

- `analyzeComponents` command and `components` operation kind, advertised as
  `component-analysis@1` only when `SessionHost` receives `components` options. Same input
  shape, admission, origin, document and one-active-operation rules as `scan`. The exact
  reported scan commits first (`raw-scan` event); the operation then completes with
  `{ scan, enrichment }`. Enrichment is `available`, `unavailable` or `evicted`, and carries
  scan ID, document ID, epoch and generation. SDK `LocalClient.analyzeComponents` and the CLI
  support it. Existing command inputs and outputs are unchanged.
- Views are capped at 192 KiB (`limits.componentViewBytes`). At most eight available views per
  session; older ones become `evicted` with an operation event. Session end releases the
  build association without closing borrowed pages.
- Fixture-scoped Vue bridge (`test/fixtures/components/vue/`): an opt-in plugin and composable
  using `provide`/`inject`, `useId` and attribute binding only. SFCs are compiled by
  `@vitejs/plugin-vue` in production mode (minified, no devtools). The manifest is
  hand-authored with relative source references.
- Dependencies: `vue@3.5.43`, `@vitejs/plugin-vue@6.0.9` as exact devDependency pins, with 19
  transitive packages. None declares install lifecycle scripts; `.npmrc` still disables them.

## Executed results

**Pinned `pnpm validate` passed all 269 tests**: 68 contract, 44 host, 13 playbook,
80 parity/browser, 46 component and 18 reporting, plus build, six strict type scopes (new
`tsconfig.fixtures.json` for the bridge, store and entry), lint and required Oxfmt. Browser
analysis source is unchanged from `main`, so `bench:slice` was not rerun.

Identical in Chromium, Firefox and WebKit, through real Unix IPC:

| Case                                      | Result                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Vue grid, 70 ProductCard + 10 Tile        | 80 violations, 80 exact issues, **2 supported scopes**; also via the CLI (Chromium) |
| Vue controls, matches hand-written oracle | 16 violations: 10 supported scopes (15 occurrences), 1 unattributed                 |
| Raw scan vs plain `scan` command          | identical raw results; `raw-scan` event precedes completion                         |
| Missing, stale and drifted manifests      | storefront favorites conflicting; partner app still supported                       |
| Keyed reorder / removal / re-key          | reorder keeps the Vue instance token; re-key yields a new one; fresh scan IDs       |
| Opt-in off                                | no capability; `capability-unavailable`                                             |
| Mutation during transfer                  | `scan-stale`, no raw commit or enrichment                                           |
| Cancellation while held                   | `cancelled`, `scan-cancelled`                                                       |
| Reconnect with lease                      | original acknowledgment returned; no rerun                                          |
| Nine analyses                             | first `evicted`, eight `available`                                                  |
| View over a 1,024-byte limit              | `component-result-limit`; 16-violation raw scan still delivered                     |
| Old cursor with 4-event retention         | explicit gap                                                                        |
| Page closed mid-analysis                  | operation `lost`                                                                    |
| Session end                               | borrowed page stays open and can be reopened                                        |

Controls cover: different-DOM/same-cause desktop and mobile variants as one template scope;
two data-record image defects as separate scopes (one split); IconButton blamed on its
`cartrow-remove` caller, while the labelled `header-search` call passes; slot content owned
by the calling page template, not `SlotPanel`; a teleported close button still owned by
`QuickView`; a two-root fragment as one instance; `LegacyCard` and `PromoCard` both named
`Card` but kept distinct; a partner app with the same `ProductCard` definition ID kept
separate; an app without the plugin left unattributed. Delivered operations contain no
`.vue` source references and no product text.

## Failures and corrections

- Two test bugs, fixed in the tests: nine concurrent inspects exceeded the SDK's 8-request
  limit, and ending a session after breaking a subscription iterator hit the connection that
  iterator closes by design.
- Existing contract tests needed a sample and admission cases for the new command; one test
  looked up a request by array index and now finds it by command name.

## Evidence artifacts

- [Manifest](component-delivery-evidence/phase-3-manifest.json): commands, per-engine Vue counts,
  source, fixture-bundle and archived-file hashes.
- [Raw archive](component-delivery-evidence/phase-3-results.tar.gz): per-engine Vue operation
  records and the validate log.
- Source-tree SHA-256: `24c8f5caeaf554e652fd3cf3f008e16317b3286e6ae1fb05f367df73a3d86147`.
- Archive SHA-256: `72e60d5b7b32e2dcf5d52597da8063b94c82164e40e3cf9cc57c2082f25d0fd0`.

## Limits

The Vue bridge is a fixture, not a shipped adapter, and `.vue` script blocks are not
`tsc`-checked. There is no request coalescing or inference queue: concurrent requests are
rejected with `operation-conflict`, as for every operation. That plan item is inference-specific
and waits for phase 2 and the realtime scheduler. No cross-build lineage, matcher-revision
supersession, dashboard, React adapter, automatic repair, performance or agent-usefulness claim.
