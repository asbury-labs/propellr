// Independent oracle, hand-authored from each fixture's description before execution.
// Members are neutral element IDs; the uninstrumented arm never receives this module's data.
import type { RepairOwner } from "../../../src/components/contracts.js";

export interface ExpectedScope {
  readonly status: "supported" | "suggested";
  readonly application: string;
  readonly definition: string;
  readonly part: string;
  readonly rule: string;
  readonly owner: RepairOwner | { readonly kind: "definition"; readonly definition: string };
  readonly members: readonly string[];
  readonly variants?: {
    readonly observed: readonly string[];
    readonly unobserved: readonly string[];
  };
}
export interface ExpectedCase {
  readonly scopes: readonly ExpectedScope[];
  readonly unattributed: Readonly<Record<string, "unknown" | "conflicting">>;
  readonly splits: number;
  // Instance token -> first conflict code; element ID -> attribution reason code.
  readonly instanceReasons?: Readonly<Record<string, string>>;
  readonly targetReasons?: Readonly<Record<string, string>>;
  readonly placements?: Readonly<Record<string, string>>;
  readonly candidates?: Readonly<Record<string, number>>;
}
const ids = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, index) => `n${from + index}`);
const store = "storefront";
const favorite = (definition: string, members: readonly string[]): ExpectedScope => ({
  status: "supported",
  application: store,
  definition,
  part: "favorite-control",
  rule: "button-name",
  owner: { kind: "template", definition },
  members,
});

export const oracle: Readonly<Record<string, ExpectedCase>> = {
  // 80 occurrences, two candidate fixes: each template omits its label.
  "grid-70-10": {
    scopes: [favorite("ProductCard", ids(0, 70)), favorite("RecommendationTile", ids(70, 80))],
    unattributed: {},
    splits: 0,
  },
  // Different markup, one faulty template binding; compact remains an untested obligation.
  variants: {
    scopes: [
      {
        ...favorite("ProductCard", ids(0, 5)),
        variants: { observed: ["desktop", "mobile"], unobserved: ["compact"] },
      },
    ],
    unattributed: {},
    splits: 0,
  },
  // IconButton renders every control; responsibility lies with the two unlabeled callers.
  "primitive-caller": {
    scopes: [
      {
        status: "supported",
        application: store,
        definition: "IconButton",
        part: "control",
        rule: "button-name",
        owner: { kind: "callsite", callsite: "cartrow-remove", caller: "CartRow" },
        members: ["n2", "n3", "n4"],
      },
      {
        status: "supported",
        application: store,
        definition: "IconButton",
        part: "control",
        rule: "button-name",
        owner: { kind: "callsite", callsite: "header-search", caller: "SiteHeader" },
        members: ["n0"],
      },
    ],
    unattributed: {},
    splits: 1,
  },
  // Same definition; two records lack data. Passing siblings are never members.
  "data-defect": {
    scopes: ["sku-3", "sku-5"].map((record, index) => ({
      status: "supported" as const,
      application: store,
      definition: "ProductCard",
      part: "image",
      rule: "image-alt",
      owner: { kind: "data-record" as const, definition: "ProductCard", record, field: "imageAlt" },
      members: [index ? "n4" : "n2"],
    })),
    unattributed: {},
    splits: 1,
  },
  // The external label lives with the caller; only the phone callsite omits it.
  "external-label": {
    scopes: [
      {
        status: "supported",
        application: store,
        definition: "TextField",
        part: "input",
        rule: "label",
        owner: { kind: "callsite", callsite: "signup-phone", caller: "SignupForm" },
        members: ["n1"],
      },
    ],
    unattributed: {},
    splits: 0,
  },
  // Identical markup, unrelated definitions. Unreviewed binding stays a suggestion.
  lookalikes: {
    scopes: [
      favorite("ProductCard", ["n1", "n2"]),
      {
        status: "suggested",
        application: store,
        definition: "WishlistButton",
        part: "control",
        rule: "button-name",
        owner: { kind: "definition", definition: "WishlistButton" },
        members: ["n0", "n3"],
      },
    ],
    unattributed: {},
    splits: 0,
  },
  // Same definition ID and instance tokens in two applications never merge.
  "cross-app": {
    scopes: [
      favorite("ProductCard", ["n0", "n1"]),
      { ...favorite("ProductCard", ["n2", "n3"]), application: "partner" },
    ],
    unattributed: {},
    splits: 0,
  },
  // Two distinct defects in one definition are two scopes, not one component issue.
  "multi-defect": {
    scopes: [
      favorite("ProductCard", ["n1", "n3", "n5"]),
      {
        status: "supported",
        application: store,
        definition: "ProductCard",
        part: "image",
        rule: "image-alt",
        owner: { kind: "template", definition: "ProductCard" },
        members: ["n0", "n2", "n4"],
      },
    ],
    unattributed: {},
    splits: 0,
  },
  // Forged/corrupt declarations never enter a scope; only the valid control does.
  forged: {
    // The manifest declares a desktop variant that the valid control never exercises.
    scopes: [
      {
        ...favorite("ProductCard", ["n11"]),
        variants: { observed: [], unobserved: ["desktop"] },
      },
    ],
    unattributed: {
      n0: "conflicting",
      n1: "conflicting",
      n2: "conflicting",
      n3: "conflicting",
      n4: "conflicting",
      n5: "conflicting",
      n6: "unknown",
      n7: "conflicting",
      n8: "conflicting",
      n9: "conflicting",
      n10: "conflicting",
      n12: "unknown",
      n13: "conflicting",
    },
    splits: 0,
    instanceReasons: {
      f0: "unapproved-build",
      f1: "unassociated-build",
      f2: "unknown-definition",
      dup: "instance-declaration-conflict",
      f9: "unknown-variant",
      f10: "callsite-mismatch",
      f13: "parent-conflicting",
    },
    targetReasons: {
      n0: "owner-conflicting",
      n3: "unknown-part",
      n6: "ownership-uncertain",
      n7: "owner-missing",
      n8: "malformed-declaration",
      n12: "no-declaration",
    },
    candidates: { n6: 1, n8: 1 },
  },
  // Open roots, fragments, frames, explicit slot/portal owners; closed roots unobserved.
  boundaries: {
    scopes: [
      { ...favorite("ShadowWidget", ["n0"]), part: "control" },
      { ...favorite("FragmentPair", ["n1", "n2"]), part: "control" },
      { ...favorite("FrameCard", ["n3"]), part: "control" },
      { ...favorite("PageShell", ["n4", "n6"]), part: "action" },
    ],
    unattributed: { n5: "unknown", n7: "unknown" },
    splits: 0,
    targetReasons: { n5: "ownership-uncertain", n7: "no-declaration" },
    placements: {
      n0: "contained",
      n1: "contained",
      n3: "contained",
      n4: "slotted",
      n6: "detached",
    },
    candidates: { n5: 2 },
  },
};

export interface ExpectedExhaustion {
  readonly gap: string;
  readonly availability: "partial" | "unavailable";
  readonly supported: number;
  readonly unattributed: number;
}
export const exhaustionOracle: Readonly<Record<string, ExpectedExhaustion>> = {
  "instance-limit": {
    gap: "component-instance-limit",
    availability: "partial",
    supported: 1,
    unattributed: 1,
  },
  "relation-limit": {
    gap: "component-relation-limit",
    availability: "partial",
    supported: 64,
    unattributed: 6,
  },
  "visit-limit": {
    gap: "component-visit-limit",
    availability: "partial",
    supported: 0,
    unattributed: 1,
  },
  "candidate-limit": {
    gap: "component-candidate-limit",
    availability: "partial",
    supported: 0,
    unattributed: 1,
  },
  "byte-limit": {
    gap: "component-evidence-limit",
    availability: "unavailable",
    supported: 0,
    unattributed: 1,
  },
};
