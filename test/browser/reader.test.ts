import { expect, test } from "vitest";
import { createAnalysis } from "../../src/browser/index.js";
import { minimumSize, offsetDiameter } from "../../src/browser/geometry.js";

test("canonical geometry rounding and small-target spacing boundaries", () => {
  const rect = (left: number, width: number) => ({
    left,
    right: left + width,
    top: 0,
    bottom: 24,
    width,
    height: 24,
  });
  expect(minimumSize(rect(0, 24))).toBe(true);
  expect(minimumSize(rect(0, 23.96))).toBe(true);
  expect(minimumSize(rect(0, 23.94))).toBe(false);
  expect(offsetDiameter(rect(0, 20), rect(22, 20))).toBe(20);
  expect(offsetDiameter(rect(0, 20), rect(24, 20))).toBe(24);
});
import type { PageId } from "../../src/contracts.js";

test.each([true, false])(
  "occurrence budget preserves applicability independent of rule order (disabled=%s)",
  (disabled) => {
    const fixture = document.createElement("main");
    fixture.innerHTML = Array.from(
      { length: 110 },
      (_, index) => `<button id="budget-${index}" ${disabled ? "disabled" : ""}>Save</button>`,
    ).join("");
    document.body.append(fixture);
    const analysis = createAnalysis();
    try {
      const input = {
        target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
        rules: [
          { rule: { id: "button-name", version: "4.13.0" }, options: {} },
          { rule: { id: "landmark-one-main", version: "4.13.0" }, options: {} },
          { rule: { id: "target-size", version: "4.13.0" }, options: {} },
        ],
      } as const;
      const result = analysis.scan(input);
      analysis.finish();
      expect(
        analysis.scan({ ...input, rules: [input.rules[2], input.rules[1], input.rules[0]] }),
      ).toEqual(result);
      expect(result.gaps.some((gap) => gap.code === "occurrence-limit")).toBe(true);
      expect(result.rules[1]).toMatchObject({
        state: "not-evaluated",
        reason: { code: "occurrence-limit" },
      });
      expect(result.rules[0]?.state === "evaluated" && result.rules[0].occurrences.length).toBe(96);
      // No candidates is inapplicable; existing candidates after exhaustion remain unknown.
      if (disabled) expect(result.rules[2]?.state).toBe("inapplicable");
      else
        expect(result.rules[2]).toMatchObject({
          state: "not-evaluated",
          reason: { code: "occurrence-limit" },
        });
    } finally {
      analysis.finish();
      fixture.remove();
    }
  },
);

test("naming bounds subtree work and skips unused checks after a positive label", () => {
  for (const shape of ["wide", "deep", "long-text", "comments"]) {
    const button = document.createElement("button");
    button.id = "naming-budget";
    if (shape === "wide" || shape === "comments") {
      for (let index = 0; index < 3000; index++)
        button.append(
          shape === "wide" ? document.createTextNode("x") : document.createComment("x"),
        );
    } else if (shape === "deep") {
      let parent: Element = button;
      for (let index = 0; index < 128; index++) {
        const child = document.createElement("span");
        parent.append(child);
        parent = child;
      }
      parent.textContent = "Save";
    } else button.textContent = "x".repeat(20_000);
    document.body.append(button);
    const analysis = createAnalysis();
    const input = {
      target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
      rules: [{ rule: { id: "button-name", version: "4.13.0" }, options: {} }],
    } as const;
    try {
      const limited = analysis.scan(input);
      expect(
        limited.gaps.some((gap) => gap.code === "naming-limit"),
        shape,
      ).toBe(true);
      expect(limited.rules[0]).toMatchObject({
        state: "evaluated",
        occurrences: [{ outcome: "incomplete" }],
      });
      analysis.finish();
      button.setAttribute("aria-label", "Save");
      const labelled = analysis.scan(input);
      expect(
        labelled.gaps.some((gap) => gap.code === "naming-limit"),
        shape,
      ).toBe(false);
      expect(labelled.rules[0]).toMatchObject({
        state: "evaluated",
        occurrences: [{ outcome: "pass" }],
      });
    } finally {
      analysis.finish();
      button.remove();
    }
  }
});

test("reader exhaustion stops sibling iteration and retains one limit gap", () => {
  const fixture = document.createElement("div");
  fixture.id = "traversal-fixture";
  fixture.innerHTML = Array.from(
    { length: 3000 },
    (_, index) => `<span id="traversal-${index}"></span>`,
  ).join("");
  document.body.append(fixture);
  const children = fixture.children;
  const iterate = children[Symbol.iterator].bind(children);
  let iterations = 0;
  Object.defineProperty(children, Symbol.iterator, {
    configurable: true,
    value: function* () {
      for (const child of iterate()) {
        iterations++;
        yield child;
      }
    },
  });
  const analysis = createAnalysis();
  try {
    const result = analysis.scan({
      target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
      rules: [{ rule: { id: "landmark-one-main", version: "4.13.0" }, options: {} }],
    });
    expect(iterations).toBeGreaterThan(1000);
    expect(iterations).toBeLessThanOrEqual(2001);
    expect(result.gaps.filter((gap) => gap.code === "reader-limit")).toHaveLength(1);
  } finally {
    analysis.finish();
    Reflect.deleteProperty(children, Symbol.iterator);
    fixture.remove();
  }
});

test("occurrence exhaustion stops geometry work, not just output retention", () => {
  const fixture = document.createElement("div");
  let geometryReads = 0;
  for (let index = 0; index < 120; index++) {
    const button = document.createElement("button");
    button.textContent = "A";
    button.style.cssText = "width:32px;height:32px;display:inline-block";
    const getRects = button.getClientRects.bind(button);
    button.getClientRects = () => {
      geometryReads++;
      return getRects();
    };
    fixture.append(button);
  }
  document.body.append(fixture);
  const analysis = createAnalysis();
  try {
    const result = analysis.scan({
      target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
      rules: [{ rule: { id: "target-size", version: "4.13.0" }, options: {} }],
    });
    expect(geometryReads).toBe(96);
    expect(result.gaps.some((gap) => gap.code === "occurrence-limit")).toBe(true);
  } finally {
    analysis.finish();
    fixture.remove();
  }
});

test("oversized target identities and evidence remain explicit gaps", () => {
  const fixture = document.createElement("main");
  const analysis = createAnalysis();
  const input = {
    target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
    rules: [
      { rule: { id: "button-name", version: "4.13.0" }, options: {} },
      { rule: { id: "target-size", version: "4.13.0" }, options: {} },
    ],
  } as const;
  document.body.append(fixture);
  try {
    fixture.innerHTML = `<button id="${"x".repeat(1025)}">Save</button>`;
    expect(analysis.scan(input).gaps.some((gap) => gap.code === "identity-limit")).toBe(true);
    analysis.finish();
    fixture.innerHTML = Array.from(
      { length: 40 },
      (_, index) =>
        `<button id="${"x".repeat(950)}-${index}" style="position:absolute;top:40px;left:40px;width:20px;height:20px">A</button>`,
    ).join("");
    const large = analysis.scan(input);
    expect(large.gaps[0]?.code).toBe("evidence-limit");
    expect(large.rules.every((rule) => rule.state === "not-evaluated")).toBe(true);
  } finally {
    analysis.finish();
    fixture.remove();
  }
});

test("unread scope stays unknown after diagnostic retention fills", async () => {
  const fixture = document.createElement("div");
  fixture.innerHTML = Array.from(
    { length: 32 },
    (_, index) =>
      `<div id="${"x".repeat(1025)}-${index}">${index === 0 ? "<main></main>" : ""}</div>`,
  ).join("");
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "");
  const loaded = new Promise<void>((resolve) =>
    frame.addEventListener("load", () => resolve(), { once: true }),
  );
  frame.srcdoc = "<main></main>";
  fixture.append(frame);
  document.body.append(fixture);
  const analysis = createAnalysis();
  try {
    await loaded;
    expect(frame.contentDocument).toBeNull();
    const result = analysis.scan({
      target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
      rules: [{ rule: { id: "landmark-one-main", version: "4.13.0" }, options: {} }],
    });
    expect(result.gaps).toHaveLength(32);
    expect(result.gaps.every((gap) => gap.code === "identity-limit")).toBe(true);
    expect(result.rules[0]).toMatchObject({
      state: "evaluated",
      occurrences: [{ outcome: "incomplete" }],
    });
  } finally {
    analysis.finish();
    fixture.remove();
  }
});

test("large rule selections cannot exceed the evidence budget through fallback metadata", () => {
  const analysis = createAnalysis();
  try {
    const result = analysis.scan({
      target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
      rules: [
        { rule: { id: "unknown-first", version: "unknown" }, options: {} },
        ...Array.from({ length: 1023 }, (_, index) => ({
          rule: { id: `unknown-${index}`, version: "unknown" },
          options: {},
        })),
      ],
    });
    expect(result.gaps[0]?.code).toBe("evidence-limit");
    expect(result.rules).toEqual([]);
    expect(new TextEncoder().encode(JSON.stringify(result)).byteLength).toBeLessThanOrEqual(
      131_072,
    );
  } finally {
    analysis.finish();
  }
});

test("frame geometry uses the child viewport, not the outer viewport", async () => {
  const frame = document.createElement("iframe");
  frame.id = "viewport-frame";
  frame.style.cssText = "width:100px;height:100px";
  const loaded = new Promise<void>((resolve) =>
    frame.addEventListener("load", () => resolve(), { once: true }),
  );
  frame.srcdoc =
    '<button id="clipped" style="position:absolute;top:150px;left:0;width:80px;height:32px">Save</button>';
  document.body.append(frame);
  await loaded;
  const analysis = createAnalysis();
  try {
    const result = analysis.scan({
      target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
      rules: [{ rule: { id: "target-size", version: "4.13.0" }, options: {} }],
    });
    expect(result.rules[0]).toMatchObject({
      state: "evaluated",
      occurrences: expect.arrayContaining([
        expect.objectContaining({
          outcome: "incomplete",
          target: expect.objectContaining({
            path: [
              { kind: "frame", selector: "#viewport-frame" },
              { kind: "element", selector: "#clipped" },
            ],
          }),
        }),
      ]),
    });
  } finally {
    analysis.finish();
    frame.remove();
  }
});

test("id-less siblings directly under a shadow root keep distinct target identities", () => {
  const host = document.createElement("div");
  host.id = "ordinal-host";
  document.body.append(host);
  host.attachShadow({ mode: "open" }).innerHTML = "<button></button><button></button>";
  const analysis = createAnalysis();
  try {
    const result = analysis.scan({
      target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
      rules: [{ rule: { id: "button-name", version: "4.13.0" }, options: {} }],
    });
    const rule = result.rules[0];
    if (rule?.state !== "evaluated") throw new Error("Expected button evaluation");
    const paths = rule.occurrences
      .filter((node) => node.target.path[0]?.selector === "#ordinal-host")
      .map((node) => node.target.path.at(-1)?.selector);
    expect(paths).toEqual(["button:nth-of-type(1)", "button:nth-of-type(2)"]);
  } finally {
    analysis.finish();
    host.remove();
  }
});

test.each(["scroll", "new-shadow"] as const)(
  "%s changes during transfer invalidate the snapshot",
  (change) => {
    const fixture = document.createElement("div");
    fixture.style.cssText = "overflow:auto;height:50px;width:100px";
    fixture.innerHTML = '<div style="height:200px"></div>';
    document.body.append(fixture);
    const analysis = createAnalysis();
    try {
      analysis.scan({
        target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
        rules: [{ rule: { id: "button-name", version: "4.13.0" }, options: {} }],
      });
      if (change === "scroll") fixture.scrollTop = 50;
      else fixture.attachShadow({ mode: "open" }).innerHTML = "<button></button>";
      expect(analysis.finish()).toBe(false);
    } finally {
      analysis.finish();
      fixture.remove();
    }
  },
);

test.each(["document", "shadow"] as const)(
  "%s focus changes invalidate transfer geometry",
  (mode) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = mode === "shadow" ? host.attachShadow({ mode: "open" }) : host;
    root.innerHTML =
      "<style>button:focus{width:40px}</style><button>One</button><button>Two</button>";
    const buttons = root.querySelectorAll("button");
    buttons[0]!.focus({ preventScroll: true });
    const analysis = createAnalysis();
    try {
      analysis.scan({
        target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
        rules: [{ rule: { id: "target-size", version: "4.13.0" }, options: {} }],
      });
      buttons[1]!.focus({ preventScroll: true });
      expect(analysis.finish()).toBe(false);
    } finally {
      analysis.finish();
      host.remove();
    }
  },
);

test("transfer mutation invalidates snapshot; next epoch rebuilds root-local facts", () => {
  const fixture = document.createElement("div");
  fixture.id = "reader-fixture";
  document.body.append(fixture);
  const root = fixture.attachShadow({ mode: "open" });
  root.innerHTML =
    '<span id="name">Save</span><button id="reader-button" aria-labelledby="name"></button>';
  const analysis = createAnalysis();
  const input = {
    target: { pageId: "page_browser" as PageId, documentId: "browser-doc", path: [] },
    rules: [{ rule: { id: "button-name", version: "4.13.0" }, options: {} }],
  } as const;
  try {
    const first = analysis.scan(input);
    expect(first.rules[0]).toMatchObject({
      state: "evaluated",
      occurrences: expect.arrayContaining([
        expect.objectContaining({
          outcome: "pass",
          target: expect.objectContaining({
            path: [
              { kind: "shadow", selector: "#reader-fixture" },
              { kind: "element", selector: "#reader-button" },
            ],
          }),
        }),
      ]),
    });
    root.querySelector("#name")!.textContent = "";
    expect(analysis.finish()).toBe(false);
    const second = analysis.scan(input);
    expect(second.rules[0]).toMatchObject({
      state: "evaluated",
      occurrences: expect.arrayContaining([expect.objectContaining({ outcome: "violation" })]),
    });
    expect(analysis.finish()).toBe(true);
  } finally {
    analysis.finish();
    fixture.remove();
  }
});
