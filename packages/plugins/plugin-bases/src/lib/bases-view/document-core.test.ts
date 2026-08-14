import { describe, expect, it } from "vitest";
import { normalizeBasesDocument } from "./document-core";

describe("normalizeBasesDocument", () => {
  it("creates a default table document for empty input", () => {
    const document = normalizeBasesDocument(undefined);

    expect(document.activeView).toBe("Table");
    expect(document.views).toHaveLength(1);
    expect(document.views[0]).toMatchObject({
      type: "table",
      name: "Table",
      layout: "table",
      order: [],
      sort: [],
    });
  });

  it("normalizes partial parsed yaml into a usable bases document", () => {
    const document = normalizeBasesDocument({
      activeView: "Bad",
      views: [
        {
          type: "table",
          name: "Custom",
        },
      ],
    });

    expect(document.activeView).toBe("Custom");
    expect(document.views[0]).toMatchObject({
      type: "table",
      name: "Custom",
      filter: { and: [] },
      columnSize: {},
    });
  });

  it("preserves cards views when parsed back from source mode", () => {
    const document = normalizeBasesDocument({
      activeView: "Card",
      views: [
        {
          type: "cards",
          name: "Card",
          order: ["file.name"],
          sort: [],
          filter: { and: [] },
          limit: 0,
          imageAspectRatio: 0.25,
          cardSize: 283,
        },
      ],
    });

    expect(document.activeView).toBe("Card");
    expect(document.views).toHaveLength(1);
    expect(document.views[0]).toMatchObject({
      type: "cards",
      name: "Card",
      order: ["file.name"],
      filter: { and: [] },
      imageFit: "contain",
      imageAspectRatio: 0.25,
      cardSize: 283,
    });
  });

  it("preserves custom view types", () => {
    const document = normalizeBasesDocument({
      activeView: "Task List",
      views: [
        {
          type: "tasknotesTaskList",
          name: "Task List",
          order: ["note.title"],
          sort: [],
          filter: { and: [] },
          limit: 0,
        },
      ],
    });

    expect(document.activeView).toBe("Task List");
    expect(document.views[0]).toMatchObject({
      type: "tasknotesTaskList",
      name: "Task List",
      filter: { and: [] },
    });
  });
});
