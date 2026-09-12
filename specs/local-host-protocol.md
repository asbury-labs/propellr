# Local host protocol, phases 2 and 3

Single-user macOS/Linux host. Filesystem access is authentication: owned directory
0700, Unix socket 0600, no control TCP/HTTP listener. Every local connection has
the same configured user authority. This is not tenant isolation or a sandbox for
hostile pages/code. The host accepts only its configured policies, browsers and
borrowed Page registrations. No client endpoints, scripts or credentials.

## Framing and correlation

Before implementation: unsigned 32-bit big-endian byte length followed by UTF-8
JSON. Request frames at most 65,536 bytes, responses at most 1,048,576 bytes;
request nesting remains limited to 32. Invalid framing closes the connection.
No connection is admitted before socket permission setup succeeds; startup failure
awaits listener/socket/host teardown. A ready connection starts with `{kind:"hello"}`
or `{kind:"hello", lease:"..."}`.
Host issues an opaque, boot-local lease. Unknown leases are rejected, never recreated.
After hello: `{kind:"request", request:{command,input}}`; replies use
`{kind:"reply", requestId, reply}`. Subscription deliveries use
`{kind:"delivery", requestId, delivery}` after an accepted subscription reply.
One active subscription per connection; disconnect ends delivery, not the session.
Explicit iterator return discards queued deliveries; natural completion drains them.
After the final end/cleanup event, `{kind:"complete", requestId}` completes the
subscription iterator without dropping other command replies. A subscription to an
ended session replays retained events and then completes. Browser loss alone does
not end the session's delivery; the client can still request end/cleanup.

Each lease retains at most 256 request IDs with payload digests and pending/final
replies. Same ID + same content returns the original reply, never repeats actions;
different content is rejected. No eviction: a full ledger rejects new requests.
At most 32 leases per host boot; restart loses live state and invalidates leases.
A fresh lease is a new caller correlation scope, not a license to retry uncertain
actions. SDK never automatically retries requests. Reconnect, inspect, then decide.
Re-establishing a successful subscription requires a fresh request ID and an event
cursor. Denied subscription requests replay their original diagnostic, including denials
caused by an already-active subscription (subject to ledger capacity).

Limits: 32 connections, 8 in-flight requests per connection, 8 retained sessions,
32 retained operations per session, 64 events per session, 65 queued subscription
deliveries (64 events plus one replay gap). Limits are host configurable downward for tests. Session slots and
lease ledgers are not reclaimed in this first bounded host. Capacity exhaustion
is explicit; restart requires ending sessions, not invisible history eviction.
Slow consumers disconnect rather than grow queues. Partial frames time out.
Every request frame, including a replay attempt, counts against the per-connection
in-flight cap. Overflow closes the connection without deleting the lease ledger or
ending operations: reconnect with the same lease to inspect or replay admitted IDs.
Duplicate flooding cannot create unbounded reply waiters. Host shutdown waits for
in-flight browser initialization and its cleanup before returning. Server shutdown
marks the host stopping before draining requests; concurrent server-close callers
share the cleanup promise. Failed startup/session release rejects shutdown with
`cleanup-incomplete`, preserves prior loss diagnostics, and never invents a successful
release. The daemon reports this uncertainty on stderr; forced recovery is not provided.
Rejected handshakes are terminal; later frames cannot allocate a replacement lease
on that connection.

Cursors contain session ID and monotonic sequence. Cross-session/future cursors
are rejected. Replaying before retention produces a gap then retained events.
Unknown/evicted operation inspection returns `operation-not-retained`, not empty
success. A retained operation belonging to another session is `permission-denied`.
Conflicting session actions are rejected. Browser/page loss marks active operations
lost with uncertain side effects, including while end waits for cancellation/cleanup;
no action replay or live crash recovery.

## Trusted dialog fixture contract

Only `dialog-open-close@1` is registered. Host serves a repository-owned synthetic
fixture through Playwright routing at `http://propellr.invalid/dialog`, without
opening a network listener. Managed contexts block other HTTP/WebSocket requests, downloads and service
workers. Borrowed targets are explicit host-provided Pages, exclusively leased,
not arbitrary endpoints. Open rejects them unless they already display the configured
fixture URL.
Borrowed contexts retain their owner's network policy; this slice does not install
a customer-network firewall.

Input schema: optional `timeoutMs`, integer 100..10,000, default 2,000. No secret
references. Binding: one document target named `document`, empty path, current
host page/document IDs. Required actions: `dialog.open`, `dialog.close`. Required
origin: exact fixture origin. Prerequisite: exact fixture URL, one marked fixture,
visible opener, closed dialog. Checkpoints `opened` and `closed` observe actual
visibility; closed additionally checks returned focus. Each checkpoint records
observation and an actual explicit three-rule scan in phase 3. A reached checkpoint
may contain violations or partial coverage. If its scan is interrupted, observation
remains blocked; failed setup skips checkpoints with explicit reasons. Completed
checkpoint scans survive later cancellation, browser loss and cleanup failure. Cleanup closes an open dialog if still authorized; failure
is explicit and cancellation preserves checkpoints. Navigation invalidates document
IDs, including any child-frame navigation; a changed document cannot commit an old checkpoint.
Direct-scan and journey failures retain `scan-document-changed` diagnostics instead of
collapsing navigation into evaluator failure. Page scripts and external
browser users are not locked out, so this does not claim atomic DOM observation.

Direct scans enforce allowed current origin and one whole current document. Each scan
uses lexical bundle injection with a host-held handle, never a page-owned analyzer global;
finish/disposal bounds runtime lifetime. Execution remains in the main world, not a claim
of hostile-page isolation. Defaults
resolve 89 stable canonical defaults, not the three-rule slice. Unimplemented rules,
options and narrower/excluded scopes remain not-evaluated/partial. Incremental
requests record full-scan fallback. DOM/viewport changes detected during transfer
produce stale coverage; cancelled/navigation-invalidated work cannot commit current
results. No CSSOM-wide atomicity or closed/cross-origin-root inspection claim.

Raw results and exact-target groups stay separate. Eight prior raw scans support
bounded local continuity; document/config/rule/policy differences or missing coverage
prevent false resolution. Host gate `local-zero-violations@1` has zero unwaived
unique and occurrence thresholds, with incomplete scans indeterminate. Group counts
refer only to current scan. Report history is released at end; retained operation
results remain available under operation limits. Each serialized reported scan is
capped at 192 KiB, leaving room for two checkpoints duplicated in a failed operation
and framing within the 1 MiB reply limit. Oversized historical groups are omitted
with `report-history-limit` and no lifecycle comparison. Current raw findings/counts
remain intact; a still-oversized current-only result fails before commit instead of
breaking IPC. Reader bounds: 2,000 elements,
32 boundary steps, 96 occurrences, 1,024 characters per target path, 128 KiB raw
evidence and 32 gap diagnostics per scan. Budget exhaustion
is partial. Native modals rooted inside shadow DOM make selected rules not-evaluated
with `shadow-modal-unavailable`; this cross-root visibility branch is not implemented.
No text names, page HTML or screenshots are captured; scoped selectors
and numeric evidence can still contain page identifiers. Controlled fixtures only.

Audit retains only command, decision code, session/operation IDs and timestamp,
bounded to 128 entries. No payloads, URLs, selectors, browser error text, secrets
or lease tokens. Playbook records only its validated timeout input. Host policy is
copied on creation. No durable logs, remote identity or secret-store integration.
