// Human adjudication labels for the component corpus: schema, sheet identity and comparison.
// pnpm labels:compare <labels-a.json> <labels-b.json> [--cases <sheet-cases.json>] [--out <file>]
// Two labelers answer the same sheet independently; disagreements are recorded, never averaged.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { z } from "zod";

export const labelSchemaId = "propellr-component-labels/1";
export const memberships = [
  "target",
  ...Array.from({ length: 8 }, (_, index) => `ancestor-${index + 1}`),
  "none",
  "cannot-tell",
] as const;
export const causes = ["template", "instance", "cannot-tell"] as const;

// One labeling case per violating target. Opaque IDs: family names and split are not shown.
export interface SheetCase {
  readonly id: string;
  readonly page: string;
  readonly rules: readonly string[];
  readonly chain: readonly {
    readonly distance: number;
    readonly label: string;
    readonly shape: string;
    readonly repeats: number;
  }[];
}
export const sheetId = (cases: readonly SheetCase[]) =>
  createHash("sha256")
    .update(
      JSON.stringify(
        cases.map(({ id, page, rules, chain }) => ({ id, page, rules: [...rules].sort(), chain })),
      ),
    )
    .digest("hex");

// The private sheet key written by the generator; parsed before any comparison.
const sheetCaseSchema = z
  .strictObject({
    id: z.string().regex(/^c-[0-9a-f]{10}$/),
    page: z.string().regex(/^[A-Z]$/),
    rules: z.array(z.string().min(1).max(64)).min(1).max(16).readonly(),
    chain: z
      .array(
        z
          .strictObject({
            distance: z.number().int().min(0).max(8),
            label: z.string().min(1).max(64),
            shape: z.string().regex(/^[0-9a-f]{8}$/),
            repeats: z.number().int().min(0).max(2000),
          })
          .readonly(),
      )
      .min(1)
      .max(9)
      .readonly(),
  })
  .readonly();
export const sheetKeySchema = z
  .object({
    sheet: z.string().regex(/^[0-9a-f]{64}$/),
    cases: z
      .array(sheetCaseSchema)
      .min(1)
      .max(1000)
      .readonly()
      .refine((cases) => new Set(cases.map(({ id }) => id)).size === cases.length, {
        message: "Duplicate case IDs",
      }),
  })
  .refine(({ sheet, cases }) => sheet === sheetId(cases), {
    message: "Sheet ID does not match its cases",
  });

export const labelSetSchema = z
  .strictObject({
    schema: z.literal(labelSchemaId),
    sheet: z.string().regex(/^[0-9a-f]{64}$/),
    labeler: z.string().trim().min(1).max(64),
    exportedAt: z.iso.datetime(),
    labels: z
      .array(
        z
          .strictObject({
            id: z.string().regex(/^c-[0-9a-f]{10}$/),
            membership: z.enum(memberships),
            component: z.string().trim().max(64),
            cause: z.enum(causes),
            notes: z.string().max(500),
            // Set when the answer was copied from another case with the same structure.
            bulk: z.boolean(),
          })
          .readonly()
          // A case outside any component carries no component name; a chosen root always has one.
          .refine(
            ({ membership, component }) =>
              ["none", "cannot-tell"].includes(membership) ? component === "" : component !== "",
            { message: "Component name must be empty outside a component and present for a root" },
          ),
      )
      .max(1000)
      .readonly()
      .refine((labels) => new Set(labels.map(({ id }) => id)).size === labels.length, {
        message: "Duplicate case IDs",
      }),
  })
  .readonly();
export type LabelSet = z.infer<typeof labelSetSchema>;
type Label = LabelSet["labels"][number];

// Cohen's kappa over paired categorical answers; null when agreement by chance is certain.
export function kappa(pairs: readonly (readonly [string, string])[]): number | null {
  if (!pairs.length) return null;
  const observed = pairs.filter(([a, b]) => a === b).length / pairs.length;
  const count = (side: 0 | 1, value: string) =>
    pairs.filter((pair) => pair[side] === value).length / pairs.length;
  const values = new Set(pairs.flat());
  const expected = [...values].reduce((sum, value) => sum + count(0, value) * count(1, value), 0);
  return expected === 1 ? null : (observed - expected) / (1 - expected);
}

// Component names are free text, so only the grouping they induce within a page is compared:
// for every pair of cases on one page, do both labelers put them in the same component?
function componentPairs(
  a: ReadonlyMap<string, Label>,
  b: ReadonlyMap<string, Label>,
  pageOf: ReadonlyMap<string, string>,
) {
  const ids = [...a.keys()].filter(
    (id) => b.has(id) && a.get(id)!.component !== "" && b.get(id)!.component !== "",
  );
  let agree = 0;
  let total = 0;
  // Every pair grouped differently, with both labelers' names for both cases.
  const disagreements: {
    page: string;
    ids: [string, string];
    answers: { sameComponent: boolean; components: [string, string] }[];
  }[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const [left, right] = [ids[i]!, ids[j]!];
      if (pageOf.get(left) !== pageOf.get(right)) continue;
      const view = (labels: ReadonlyMap<string, Label>) => {
        const components: [string, string] = [
          labels.get(left)!.component,
          labels.get(right)!.component,
        ];
        return {
          sameComponent: components[0].toLowerCase() === components[1].toLowerCase(),
          components,
        };
      };
      const answers = [view(a), view(b)];
      total++;
      if (answers[0]!.sameComponent === answers[1]!.sameComponent) agree++;
      else disagreements.push({ page: pageOf.get(left)!, ids: [left, right], answers });
    }
  return { pairs: total, agreement: total ? agree / total : null, disagreements };
}

export function compareLabels(cases: readonly SheetCase[], first: LabelSet, second: LabelSet) {
  const expected = sheetId(cases);
  for (const set of [first, second])
    if (set.sheet !== expected)
      throw new Error(`Label set from ${set.labeler} was made for a different sheet`);
  if (first.labeler.toLowerCase() === second.labeler.toLowerCase())
    throw new Error("Both label sets have the same labeler; adjudication needs two people");
  const byId = new Map(cases.map((entry) => [entry.id, entry]));
  for (const set of [first, second])
    for (const { id, membership } of set.labels) {
      const entry = byId.get(id);
      if (!entry) throw new Error(`Label set from ${set.labeler} has unknown case ${id}`);
      // An ancestor answer must name an ancestor this case actually has.
      const distance = /^ancestor-(\d)$/.exec(membership)?.[1];
      if (distance && !entry.chain.some((link) => link.distance === Number(distance)))
        throw new Error(
          `Label set from ${set.labeler} answers ${membership} for case ${id}, which has no such ancestor`,
        );
    }
  const a = new Map(first.labels.map((label) => [label.id, label]));
  const b = new Map(second.labels.map((label) => [label.id, label]));
  const pageOf = new Map(cases.map(({ id, page }) => [id, page]));
  const both = cases.filter(({ id }) => a.has(id) && b.has(id));
  const field = (key: "membership" | "cause") => {
    const pairs = both.map(({ id }) => [a.get(id)![key], b.get(id)![key]] as const);
    return {
      agreement: pairs.length ? pairs.filter(([x, y]) => x === y).length / pairs.length : null,
      kappa: kappa(pairs),
    };
  };
  return {
    schema: "propellr-component-label-comparison/1",
    sheet: expected,
    labelers: [first.labeler, second.labeler],
    cases: cases.length,
    // Per-labeler values are arrays in `labelers` order; names are never used as keys.
    labeled: { each: [a.size, b.size], both: both.length },
    complete: both.length === cases.length,
    membership: field("membership"),
    cause: field("cause"),
    component: componentPairs(a, b, pageOf),
    bulk: [first, second].map(({ labels }) => labels.filter(({ bulk }) => bulk).length),
    // Every membership or cause disagreement, with both answers; nothing is resolved here.
    disagreements: both
      .filter(
        ({ id }) =>
          a.get(id)!.membership !== b.get(id)!.membership || a.get(id)!.cause !== b.get(id)!.cause,
      )
      .map(({ id, page }) => ({
        id,
        page,
        answers: [a, b].map((labels) => {
          const { membership, cause, component, notes } = labels.get(id)!;
          return { membership, cause, component, notes };
        }),
      })),
    missing: cases
      .filter(({ id }) => !a.has(id) || !b.has(id))
      .map(({ id }) => ({ id, missingFrom: [a.has(id), b.has(id)].map((has) => !has) })),
  };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const { values, positionals } = parseArgs({
    args: argv[0] === "--" ? argv.slice(1) : argv,
    allowPositionals: true,
    options: {
      out: { type: "string" },
      // Private sheet key written by `pnpm labeling:sheet`.
      cases: { type: "string", default: "artifacts/labeling/sheet-cases.json" },
    },
  });
  const [command, ...files] = positionals;
  if (command !== "compare" || files.length !== 2) {
    process.stderr.write(
      "usage: node tools/component-labels.ts compare <a.json> <b.json> [--cases <file>] [--out <file>]\n",
    );
    process.exit(2);
  }
  const { cases } = sheetKeySchema.parse(JSON.parse(readFileSync(values.cases, "utf8")));
  const [first, second] = files.map((file) =>
    labelSetSchema.parse(JSON.parse(readFileSync(file!, "utf8"))),
  );
  const report = `${JSON.stringify(compareLabels(cases, first!, second!), null, 2)}\n`;
  if (values.out) writeFileSync(values.out, report);
  process.stdout.write(report);
}
