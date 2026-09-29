# Component labeling: two-person adjudication

The phase 2 [protocol](component-inference-protocol.md) (amendment of September 28, 2026) needs
two independent human label sets for the 240-case corpus before the sealed holdout runs. Until
then, every score uses instrumented-oracle labels. This page covers producing, filling in and
comparing those label sets.

## Generate the sheet

```sh
pnpm labeling:sheet
```

The command renders the **uninstrumented** version of all 12 corpus families: no bridge
attributes and no oracle. It scans each page with structural capture and writes two files to
`artifacts/labeling/` (not committed):

- `component-labeling-sheet.html`: a single offline page, about 9 MB. Give it to each labeler.
- `sheet-cases.json`: the private key that maps each opaque case to its family, split and target
  path. **Never give this file to labelers.** The compare command reads it.

Families appear as pages A–L, in a fixed order that doesn't depend on their names, so labelers
see neither family names nor which pages are holdout. No provider arm runs, so the holdout stays
sealed. The sheet ID is a SHA-256 over the cases (IDs, pages, rules and chains) and is stable
across regenerations. Every label set records it.

## What labelers see and answer

Each of the 240 cases is one element that failed a check. The case shows:

- a screenshot with the element outlined in red and its ancestors in numbered blue boxes;
- an enlarged close-up;
- the ancestor chain, with how often each structure repeats on the page;
- the markup around the element, with the element highlighted.

The labeler answers three questions:

1. **Component root:** the element itself, one of its ancestors (A1–A8), _not part of a reusable
   component_, or _can't tell_. The protocol's automated arms can't choose the element itself,
   but the oracle does on at least one dev family (the cart callsites).
2. **Component name:** free text. Only the grouping it produces within a page is compared.
3. **Cause:** a template defect, an instance defect, or _can't tell_.

Answers autosave in that browser. **Export labels** downloads
`labels-<name>-<sheet>.json` (`propellr-component-labels/1`). **Load saved file** checks a whole
export first, then replaces this browser's answers with it, so answers from another session are
never exported under the loaded name. A case marked outside any component (none, or can't tell)
exports no component name. **Copy to identical cases** fills unanswered cases on the same page that have the
same structure. Copied answers are marked in the export, and editing a case clears the mark.
Pages are checked for this: bridge attributes never appear, fixture markup is shown only as text,
and a content security policy blocks all network access.

**Not yet sufficient for the attribution holdout.** The phase 2 plan
([component intelligence](propellr-component-intelligence.html), 2.1) asks both reviewers to
adjudicate membership, part, **variant** and repair cause separately. This sheet asks for
membership, a component name and cause, and derives the part from membership. Don't collect
attribution labels until a variant answer and a separately adjudicated part are added, or an
approved protocol amendment narrows the labels.

## Compare

```sh
pnpm labels:compare labels-tony-….json labels-colleague-….json --out artifacts/labeling/comparison.json
```

The command refuses:

- a sheet key that fails validation, for example duplicate IDs or a sheet ID that doesn't match
  its cases;
- label sets that belong to a different sheet, come from the same labeler twice, or name unknown
  cases;
- an answer naming an ancestor the case doesn't have.

It reports:

- coverage;
- agreement and Cohen's kappa for membership and cause;
- pairwise agreement on the component grouping within each page, with every pair grouped
  differently and both labelers' names;
- the number of copied answers per labeler;
- every membership or cause disagreement, with both answers.

**Disagreements are recorded, not resolved or averaged.** The protocol decides how human labels
replace the oracle in scoring. That needs an amendment before the holdout run.
