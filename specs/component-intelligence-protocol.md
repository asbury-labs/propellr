# Component intelligence protocol, phase 1

September 23, 2026. Authored before implementation. Plan:
[component intelligence](propellr-component-intelligence.html), phase 1 only.
Base `42f7a47b927c1a5b40b3533f6666ad4d5c2e0312` on branch
`feat/component-intelligence`. Untracked Jev research and other worktrees stay untouched.

Phase 1 is deterministic: an instrumented fixture bridge, host-approved manifests and a
portable repair view. No provider, model, framework dependency, text capture, wire
command or rule coverage change. Raw `ScanResult`, `Report`, `IssueGroup` and
`applyGate` semantics are unchanged; component output is a separate, versioned view.

## Versions

| Artifact           | Version                                     | Owner                        |
| ------------------ | ------------------------------------------- | ---------------------------- |
| Page bridge        | `propellr-bridge/1` (data attributes)       | cooperative page             |
| Browser capture    | `propellr-component-capture/1`              | `src/browser/components.ts`  |
| Build manifest     | `propellr-component-manifest/1`             | host, approved at startup    |
| Resolved evidence  | `propellr-component-evidence/1`, resolver 1 | `src/components/attribution` |
| Repair view        | `propellr-component-repair-view/1`          | `src/components/grouping`    |
| Grouping algorithm | `component-repair/1`                        | `src/components/grouping`    |

Any change to bridge semantics, bounds, resolution or grouping keys requires a new
version. Consumers must reject unknown schema literals. Views are never rewritten after
a version change; a new version produces a new view.

## Bridge, `propellr-bridge/1`

Page declarations are untrusted until matched to a host-approved manifest. Attributes:

- Instance root: `data-propellr-instance`, `data-propellr-app`, `data-propellr-build`,
  `data-propellr-definition`; optional `data-propellr-variant`, `data-propellr-callsite`,
  `data-propellr-record`, `data-propellr-parent`.
- Part: `data-propellr-part` plus explicit owner `data-propellr-owner`. One element can
  be both a root and a part. Nearest DOM ancestry never assigns ownership.
- Every value is a token: `^[A-Za-z0-9][A-Za-z0-9._:-]*$`, at most 128 characters.
  Invalid values, a root missing a required attribute, or an owner/parent/callsite/record
  attribute on a non-root non-part are malformed declarations.

Instance tokens are scoped to one document: the main document or one same-origin frame,
across its open shadow roots. Several roots with byte-identical declarations are one
fragment/multi-root instance. Differing declarations under one token conflict.

## Identity lifetimes

- Definition key: application, build and definition ID from the manifest. Display names,
  CSS classes and roles are not identity. No cross-build continuity is inferred.
- Instance: evidence-local key bound to scan ID, document ID and epoch. Repeated
  instances stay distinct. Reorder, rerender, list-key reuse, virtualized row reuse,
  navigation and any later scan require fresh capture. Tokens are never carried forward.
- Part: definition-local key from the manifest part schema. DOM order is not identity.
- Target: the exact reader target path from the same scan. Joining is by canonical
  target equality only.
- Association: the host binds approved application/build pairs to the current document ID.
  Frame navigation creates a new document ID, so association and prior evidence lapse.

## Manifest and trust

Host constructs a registry from at most 16 manifests, unique by application/build. A
manifest has at most 256 definitions and 256 callsites. A definition has at most 32
variants and 32 parts. Part bindings are host-reviewed cause evidence:

- `template`: the definition's own template supplies the checked content.
- `callsite`: the caller at a registered callsite supplies it; callsite declares its
  caller and rendered definition.
- `data-record`: per-instance data supplies it, named by a field token.
- `unreviewed`: no cause evidence. Membership can be suggested, never supported.

Source references are relative POSIX paths without `..`, at most 512 characters. They
stay in the host registry and never enter evidence or views. No source file is read and
no page-provided code or path is evaluated. Page markers can impersonate valid
registrations: `source-linked` means linked to a cooperative instrumented build through
the approved manifest, not a security or authorization guarantee. Denied frames and
closed roots stay unobserved.

Resolution states for a target: `supported`, `unknown` or `conflicting`. Whole-evidence
states: `complete`, `partial`, `stale` or `unavailable`. `inferred` is reserved for
phase 2; resolver 1 never emits it. Absence of a candidate is not an accessibility verdict.

Instance checks, in order: approved application/build; associated with this document;
known definition; declared variant listed; callsite exists and renders this definition;
parent token exists in the same document. Second pass: a declared parent must itself pass
local checks, and a callsite's caller must equal the parent's definition in the same build.
Any failure makes the instance `conflicting` with coded reasons. Part checks: explicit
owner present (else `unknown`, `ownership-uncertain`); owner resolves (else
`conflicting`, `owner-missing`); owner supported (else `owner-conflicting`); part key in
the owner's definition (else `unknown-part`). Provenance is `source-linked` when the
definition has a manifest source reference, otherwise `declared`.

Violation targets without an explicit part get containment candidates: composed ancestors
in the same document that are declared roots. Candidates are `unknown`, not membership.
Part placement records `contained`, `slotted`, `detached` (portal/teleport) or
`unresolved`; ownership comes only from the explicit owner.

## Capture budgets and truncation

Capture runs in the same synchronous browser call as the scan, after raw rules are fixed,
under the same epoch, document guard and mutation/viewport transfer checks. Raw rule
results, gaps and coverage are identical with capture on or off.

| Bound                          | Value   | On exhaustion                                                               |
| ------------------------------ | ------- | --------------------------------------------------------------------------- |
| Capture JSON                   | 128 KiB | Drop all declarations; evidence `unavailable`, `component-evidence-limit`   |
| Recorded instance roots        | 256     | Keep first 256; parts of any token with an unrecorded root `instance-limit` |
| Relations (parts) per instance | 64      | Keep first 64 in reader order; later parts `relation-limit`                 |
| Candidates per target          | 32      | Keep nearest 32; `truncated`; `component-candidate-limit` gap               |
| Additional element visits      | 2,000   | Stop placement/containment walks; `component-visit-limit` gap               |
| Resolved evidence JSON         | 128 KiB | Evidence `unavailable`, `component-evidence-limit`                          |
| Capture gaps retained          | 32      | One per code                                                                |
| Elements considered for bridge | reader  | Reader-visited elements only; unread scope makes capture partial            |

Reading bridge attributes on reader-visited elements is not an additional visit. Each
ancestor step during placement or containment is one visit. Any gap makes evidence
`partial`; unstable transfer makes it `stale`; a scope-unavailable scan yields
`unavailable` evidence. Cancellation or document change rejects with no scan or evidence.
Limits never remove raw findings.

## Repair scopes and counts

The view consumes one `ScanResult` and evidence for that exact scan ID, document ID and
epoch; any mismatch is rejected. It recomputes the exact report from raw results and
never replaces or edits it. Only current `violation` occurrences are scoped.
`incomplete` occurrences are counted separately and never grouped.

For a supported target, owner comes from the part binding: `template` owner is the
definition; `callsite` owner is the instance's declared callsite; `data-record` owner is
the instance's declared record. A missing callsite or record is `unknown`,
`owner-undeclared`. `unreviewed` yields a suggested scope owned by the definition.

Scope key: application, build, rendering definition, part, owner, rule ID/version,
basis and defect signature. Defect signature is the rule plus canonical raw evidence
kind/observed values, excluding target paths (`related`, `neighbors`). Every member must
match every key field. There is no pairwise similarity or transitive union: a conflicting
element that resembles two scopes is excluded, not a bridge between them.

States: `supported` (manifest-consistent membership plus reviewed binding) or
`suggested` (membership only; cause unverified). Neither is a confirmed defect or fix.
A split record lists scopes sharing application, build, definition, part and rule, with
the differing fields. Each scope lists observed variants and declared unobserved variant
obligations. Members retain scan ID, occurrence ID, exact issue ID, instance key,
variant and provenance.

Counts: violation occurrences, exact violation issues, supported/suggested scopes, and
supported/suggested/unattributed occurrences. Scoped plus unattributed occurrences equal
violation occurrences. Scopes do not overlap in version 1. No scope closes in phase 1;
closure and repair receipts need later approved evidence.

## Fixtures and oracle

Original fixtures under `test/fixtures/components/` render an instrumented arm with bridge
attributes and an uninstrumented arm without bridge attributes, class names or oracle IDs.
Element IDs are neutral (`n12`). Only the instrumented arm receives a manifest. Expected
definitions, memberships, causes and scopes are hand-authored in a separate oracle module,
not derived from the renderer. Cases: 70 ProductCard plus 10 RecommendationTile favorites;
desktop/mobile variants; IconButton with caller-supplied labels; sibling data defect;
external labels; lookalikes; same definition ID in two applications; multiple defects in
one definition; forged/corrupt declarations; open roots, fragments, frames, slots and
portals. Executable defects use existing `button-name`, `image-alt` and `label` rules.

## Verification

`pnpm test:components` runs in default `pnpm validate`: schemas, forged registrations,
cross-app collisions, ambiguous parts, non-transitivity, exhaustion, exact report/gate
preservation, and real Chromium/Firefox/WebKit collection with reorder, removal,
rerender, virtualized reuse, slot/portal reassignment, frame navigation, cancellation and
mutation during transfer. Raw results are compared with capture on/off, instrumented
versus uninstrumented arms and existing parity fixtures. The browser bundle changes, so run
the unchanged three-rule `pnpm bench:slice` once. No component performance claim.

Stop after evidence review. No Jev, provider, Vue, wire delivery, PR or merge.
