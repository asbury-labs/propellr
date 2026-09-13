# Propellr

Private greenfield accessibility engine. Single-user local session host, typed
SDK/CLI and trusted `dialog-open-close@1` playbook. Phase 3 implements an explicitly
limited `button-name`, `target-size`, `landmark-one-main` slice with real checkpoint
scans, Chromium/Firefox/WebKit reference comparisons and conservative reporting.
**Not full axe-core parity.** Unsupported branches and inaccessible frames remain
partial/incomplete. Realtime requests use full scans, never incremental speed claims.

## Development

Use Node **26.8.2** and project-scoped PNPM **12.4.1**. Do not replace global tools
or use the inherited migration workspace. `.node-version` records the Node pin;
activate an isolated Node installation before running commands.

```sh
node --version # v26.8.2
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/browsers"
npm exec --yes --package=pnpm@12.4.1 -- pnpm install --frozen-lockfile
npm exec --yes --package=pnpm@12.4.1 -- pnpm exec playwright install chromium firefox webkit
npm exec --yes --package=pnpm@12.4.1 -- pnpm reference:prepare
npm exec --yes --package=pnpm@12.4.1 -- pnpm validate
npm exec --yes --package=pnpm@12.4.1 -- pnpm bench:slice
```

On supported CI Linux, provision browsers with `--with-deps`. `validate` runs
build, strict source/type examples, lint, required Oxfmt, contract tests, real Unix
IPC, playbook, parity, browser-reader and reporting tests in Chromium/Firefox/WebKit.
Benchmarks run separately, not as a speed gate. `test:host`, `test:playbooks` and
`test:parity` build first because they execute emitted host/browser code. `format` is `oxfmt .`;
`format:check` is `oxfmt --check .`. Lifecycle scripts remain disabled by `.npmrc`.
No dependency pins changed in phases 2 or 3.

`reference:prepare` downloads only the approved tarball into
`~/.cache/propellr-reference/axe-core-4.13.0` (override `PROPELLR_REFERENCE_CACHE`),
verifies integrity, then extracts the browser bundle/license/metadata without
installing axe-core. Cache must stay outside this worktree. Parity/benchmark tests
verify the bundle hash again and fail if absent or changed. Preparation also fails
closed on corrupt cached tarballs; inspect and explicitly repair the configured external
cache before retrying. No silent integrity-error recovery. Cache entries must be regular
files, package directories cannot be symlinks, and verified files are never rewritten.
Only missing files are created exclusively from verified archive bytes. A concurrent
exclusive-write winner is accepted only after no-follow reread and exact byte verification;
partial/conflicting entries still fail closed without retries or repair. This standalone
macOS/Linux preparation command holds checked directories during writes, rather than
relying on parent pathnames remaining unchanged. No canonical checkout
or upstream tooling is needed in CI. Raw generated results: `artifacts/parity/`
and `artifacts/bench/`; these are ignored, not a publishing channel.

## Local use

macOS/Linux only. Start the built daemon with an explicit private directory whose
parent exists and is trusted. Directory must be user-owned 0700; socket is 0600.
Existing sockets/files are never taken over or deleted at startup. No TCP control
listener. Keep the browser-cache environment above when starting the daemon.

```sh
node dist/host/daemon.js /tmp/propellr-local-$UID
# Another terminal, same user:
printf '%s\n' '{"command":"open","input":{"protocol":"propellr/0.1","requestId":"open-1","policy":{"id":"local-fixture","version":"1"},"target":{"kind":"managed","browser":"chromium"}}}' \
  | node dist/host/cli.js /tmp/propellr-local-$UID/host.sock
```

CLI accepts one command envelope on stdin, returns `{lease, reply}` as JSON, and
exits nonzero for a rejected command. Pass the returned lease as its second
argument on later calls. Subscriptions emit JSON lines until the session ends or the client disconnects.
Protect lease-bearing output as local session metadata. SIGINT/SIGTERM on the
daemon ends owned sessions; client exit does not. Command acceptance is not
operation completion or accessibility success.

SDK exports `LocalClient` from `dist/host/client.js`:

```ts
const client = await LocalClient.connect(socketPath); // save client.lease for reconnect
const opened = await client.open({
  protocol: "propellr/0.1",
  requestId: "open-1",
  policy: { id: "local-fixture", version: "1" },
  target: { kind: "managed", browser: "chromium" },
});
if (!opened.ok) throw new Error(opened.diagnostic.code);
const session = opened.value;
const document = session.documents[0];
if (!document) throw new Error("No live document");
const accepted = await client.runPlaybook({
  protocol: "propellr/0.1",
  requestId: "dialog-1",
  sessionId: session.id,
  playbook: { id: "dialog-open-close", version: "1" },
  inputs: { timeoutMs: 2000 },
  bindings: { document: { ...document, path: [] } },
  secretRefs: {},
});
// Inspect accepted.value.id or subscribe for the actual terminal outcome.
client.close(); // does not end session or replay any command
```

All seven methods share schema-inferred inputs: `open`, `inspect`, `scan`,
`runPlaybook`, `subscribe`, `cancel`, `end`. Use a fresh request ID for each new
inspection. Reconnect with `LocalClient.connect(socketPath, savedLease)`; never
blindly repeat an uncertain browser action. Same lease/request ID/content returns
the original acknowledgment, not a fresh operation snapshot. Changed content is
rejected. Reconnect subscriptions use a fresh request ID and last event cursor.
Breaking an unfinished subscription iterator closes that client's connection.
Natural completion keeps the connection usable; terminal-session replay is finite.

Embedding hosts use `SessionHost` and `startLocalServer` from `src/host/`. Borrowed
targets are host-provided `Map<string, Page>` registrations, never client-provided
endpoints. Ending one removes host listeners without closing its Page, context,
browser or owner connection. Hosts configure allowed browsers, origins/actions,
commands and immutable policy at startup. Registered borrowed Pages must already
show the controlled fixture. No arbitrary website journeys or secret inputs.

## Scan and reporting slice

Use `selectedRequest(documentTarget, "incremental")` from `dist/analysis.js` with
`client.scan({ ...metadata, sessionId, scan: request })` for explicit three-rule
selection. `incremental` records `actual: "full"` plus a fallback reason. Explicit
selection is essential: `rules: { kind: "defaults" }` resolves the 89 canonical
stable defaults, with unimplemented rules marked not-evaluated and partial coverage.
`target-size` is opt-in. Nonempty options, unknown rules, subtree/excluded scope
are not silently evaluated with different semantics.

Host scans cover one authorized current whole document. Every frame navigation
changes its aggregated document ID. Collection is synchronous; mutation observers
cover transfer until result confirmation. Cancellation or navigation cannot commit
a current result; detected DOM/viewport changes return stale coverage. No reusable
incremental facts, CSSOM/animation-wide atomicity, closed-root inspection or
cross-origin injection is claimed. Complete selected coverage refers to observable DOM
under these capabilities, not certification of undetectable closed-root contents.
Reader bounds: 2,000 attempted element visits, 32 boundary steps,
96 total occurrences, 1,024 characters per target path, 128 KiB raw evidence and
32 diagnostic entries; budget exhaustion stays partial. Rules evaluate in stable ID order
so equivalent selections consume the shared occurrence budget identically. Child iteration stops
at reader exhaustion; native layout/query cost is not a constant-time guarantee.
Native modals rooted inside shadow DOM return explicit not-evaluated/partial results, not guessed visibility.
Generated pseudo-element boxes make target-size incomplete for their document.
Whitespace/fallback role-token lists return not-evaluated/partial results; full ARIA
role resolution is not implemented. Supported button-role comparisons are case-insensitive;
landmark selectors retain canonical case semantics.

Playbook checkpoints retain actual scans, including after later failure/cancellation.
Reached journey and complete selected coverage do not imply clean accessibility:
closed fixture has no main landmark, so its raw main-presence violation remains.
Host reports use exact rule-version/document/path identity and eight prior raw scans.
Reported scans are capped at 192 KiB so fixed two-checkpoint results fit IPC replies.
Oversized history is omitted with an explicit `report-history-limit` comparison;
if the current-only result still exceeds that cap, the operation fails before commit.
No cross-navigation/build/component matching is inferred. Counts are current-scan;
history cannot inflate them or resolve issues after incomplete/narrower scans.
The declared `local-zero-violations@1` gate allows zero unwaived unique/occurrence
violations. Missing coverage/evidence is indeterminate. Portable `reportScan` and
`applyGate` accept caller-owned history and schema-validated owner/expiry exceptions.
Portable reporting checks result consistency; callers remain responsible for truthful
coverage. The browser slice's whole-document-only execution limit is not a restriction
on other producers of portable `ScanResult` values.

## Boundaries and limits

- `src/contracts.ts`: portable public types; verdicts, coverage, groups and gate
  policy remain separate. Current session document IDs support safe bindings.
- `src/validation.ts`, `src/host/requests.ts`: schema-inferred input decoding and
  host-owned grants. Unknown fields rejected; diagnostics never echo payloads.
- `src/host/`: private Unix IPC, bounded replay/events/audit, owned/borrowed browser
  lifecycle and fixed, reviewed dialog interactions. Managed browsers intercept
  the synthetic fixture URL and abort other network requests.
- `test/host/`, `test/playbooks/`: actual IPC and browser interactions, not a DOM
  emulator. Test fixture source lives in `src/host/fixture.ts` for daemon use too.
- `src/browser/`: Vite IIFE `dist/browser/propellr.js`, no Node, Playwright or Zod
  runtime imports. Fresh facts per scan; open shadow roots/slots and accessible
  same-origin frames; denied frames produce explicit gaps.
- `src/reporting/`: portable exact-target grouping, caller-supplied history and
  declared thresholds/exceptions. No fuzzy identity, database or vendor adapters.

Request frames: 65,536 UTF-8 bytes, 32 nested containers including framing.
Replies: 1 MiB. Tokens: 128 characters; distinct `session_`, `operation_`, `page_`
prefixes. Limits: 32 connections/boot-local leases, 256 requests per lease,
8 retained sessions, 32 operations and 64 events per session, 128 audit entries.
Operation eviction/event gaps are explicit. Leases and session slots are not
reclaimed in this first implementation: capacity exhaustion requires deliberate
host restart, not silent replay-history loss. End sessions before restarting.

Filesystem access is single-user authentication, not multi-tenant isolation.
Borrowed contexts keep their owner's network policy. No hostile-code sandbox,
durable crash recovery, hosted account, remote listener, enterprise secret store
or raw page/credential capture. SDK validates host envelopes and correlation;
full result schemas remain deferred. See [protocol and fixture contract](specs/local-host-protocol.md).

## TypeScript scopes

ESM/declarations emit to `dist/`. Portable/browser/host/test scopes have explicit
libraries and ambient types. Host source has no DOM globals; browser source has
no Node imports. Browser dependency declarations remain fully checked.

Dependency-only `skipLibCheck` exceptions:

- Portable: Zod 4.6.2 declares unused URL helpers requiring ambient web types.
- Host/build: Playwright 1.63.0 declarations reference DOM names (`Node`,
  `HTMLElementTagNameMap`, `SVGElement`) even for its Node adapter. Phase 2 exposed
  this on first import. No DOM library or fake globals added to host source.
- Test/tool: Vitest 5 declarations reference browser types and absent
  `@vitest/expect`; Vite/Vitest config declarations conflict under
  `exactOptionalPropertyTypes`.

- Browser-test scope: the same Vitest/Vite dependency-only declaration exception
  as test/tool; browser **source** still gets a separate fully checked DOM-only pass.

Own source and negative type examples remain strict in every scope. These
exceptions do not suppress project errors or change tool pins.

## Requirements and provenance

- [Product direction](specs/propellr-product-brief.md)
- [Acceptance contract](specs/propellr-acceptance-contract.md)
- [Execution plan](specs/propellr-greenfield-foundation.html)
- [Phase 1 evidence](specs/foundation-validation.md)
- [Phase 2 evidence](specs/local-host-validation.md)
- [Phase 3 protocol and branch limits](specs/slice-protocol.md)
- [Phase 3 evidence](specs/browser-slice-validation.md)
- [Provenance](PROVENANCE.md)

Canonical axe-core remains independent and untouched, never a dependency or the
Propellr implementation. No release, deploy or publishing automation exists.
