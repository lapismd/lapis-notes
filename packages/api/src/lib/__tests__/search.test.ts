import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  prepareFuzzySearch,
  prepareSimpleSearch,
  renderMatches,
  renderResults,
  sortSearchResults,
} from "../search";

type FakeNode = {
  className?: string;
  tagName?: string;
  textContent: string;
};

type FakeTarget = {
  children: FakeNode[];
  append: (...nodes: FakeNode[]) => void;
  empty: () => void;
};

const originalDocument = globalThis.document;

function createTarget(): FakeTarget {
  return {
    children: [],
    append(...nodes) {
      this.children.push(...nodes);
    },
    empty() {
      this.children = [];
    },
  };
}

beforeEach(() => {
  globalThis.document = {
    createElement(tag: string) {
      return {
        tagName: tag,
        className: "",
        textContent: "",
      };
    },
    createTextNode(text: string) {
      return {
        textContent: text,
      };
    },
  } as unknown as Document;
});

afterEach(() => {
  if (originalDocument) {
    globalThis.document = originalDocument;
  } else {
    delete (globalThis as { document?: Document }).document;
  }
});

describe("search compatibility helpers", () => {
  it("matches simple queries case-insensitively and in token order", () => {
    const search = prepareSimpleSearch("daily note");
    const result = search("Daily Note.md");

    expect(result?.matches).toEqual([
      [0, 5],
      [6, 10],
    ]);
    expect(search("Note Daily.md")).toBeNull();
  });

  it("matches fuzzy subsequences when simple search fails", () => {
    const result = prepareFuzzySearch("dn")("Daily Note.md");

    expect(result?.matches).toEqual([
      [0, 1],
      [6, 7],
    ]);
    expect(prepareFuzzySearch("zz")("Daily Note.md")).toBeNull();
  });

  it("sorts result containers by explicit or nested score", () => {
    const results = [
      { score: 1 },
      { result: { score: 5, matches: [] } },
      { score: 3 },
    ];

    sortSearchResults(results);

    expect(results.map((item) => item.score ?? item.result?.score)).toEqual([
      5, 3, 1,
    ]);
  });

  it("renders match highlights into DOM targets", () => {
    const target = createTarget();

    renderMatches(target as unknown as HTMLElement, "Daily Note", [
      [0, 5],
      [6, 10],
    ]);

    expect(target.children).toEqual([
      {
        tagName: "span",
        className: "suggestion-highlight",
        textContent: "Daily",
      },
      {
        textContent: " ",
      },
      {
        tagName: "span",
        className: "suggestion-highlight",
        textContent: "Note",
      },
    ]);

    renderResults(target as unknown as HTMLElement, "Daily Note", {
      score: 1,
      matches: [[6, 10]],
    });

    expect(target.children).toEqual([
      {
        textContent: "Daily ",
      },
      {
        tagName: "span",
        className: "suggestion-highlight",
        textContent: "Note",
      },
    ]);
  });
});
