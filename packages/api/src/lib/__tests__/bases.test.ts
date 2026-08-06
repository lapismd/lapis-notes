import { describe, expect, it } from "vitest";
import {
  BasesEntry,
  BasesQueryResult,
  BasesViewConfig,
  BasesView,
  BooleanValue,
  DateValue,
  DurationValue,
  ListValue,
  NullValue,
  NumberValue,
  StringValue,
  Value,
  parsePropertyId,
  toValue,
  type QueryController,
} from "../bases";
import { TFile } from "../storage";

function file(path: string): TFile {
  return new TFile(path, { ctime: 0, mtime: 0, size: 0 }, null);
}

describe("Bases compatibility values", () => {
  it("wraps primitive values and compares nulls predictably", () => {
    expect(toValue(true)).toBeInstanceOf(BooleanValue);
    expect(toValue(12)).toBeInstanceOf(NumberValue);
    expect(toValue("text")).toBeInstanceOf(StringValue);
    expect(Value.equals(new NullValue(), NullValue.value)).toBe(true);
  });

  it("supports list values from raw primitives", () => {
    const list = new ListValue([1, "two", null]);

    expect(list.length()).toBe(3);
    expect(list.get(0)).toBeInstanceOf(NumberValue);
    expect(list.includes(new StringValue("two"))).toBe(true);
  });

  it("supports richer shared date and duration helpers", () => {
    const date = DateValue.parseFromString("2025-12-31T23:59");
    const duration = DurationValue.parseFromString("PT2H");

    expect(date).toBeInstanceOf(DateValue);
    expect(date?.dateOnly().toString()).toBe("2025-12-31T00:00");
    expect(typeof date?.relative()).toBe("string");

    expect(duration).toBeInstanceOf(DurationValue);
    expect(duration?.getMilliseconds()).toBe(2 * 60 * 60 * 1000);
    expect(
      duration?.addToDate(new DateValue("2025-12-31T00:00")).toString(),
    ).toBe("2025-12-31T02:00");
    expect(DurationValue.fromMilliseconds(1500).getMilliseconds()).toBe(1500);
  });
});

describe("Bases result helpers", () => {
  it("supports both local and upstream-style entry constructors", () => {
    const note = file("note.md");
    const local = new BasesEntry(note, {
      "note.status": new StringValue("open"),
    });
    const upstream = new BasesEntry("row-1", note, {
      "note.status": new StringValue("done"),
    });

    expect(local.id).toBe("note.md");
    expect(upstream.id).toBe("row-1");
    expect(upstream.getValue("status")?.toString()).toBe("done");
  });

  it("groups rows and computes numeric summaries", () => {
    const entries = [
      new BasesEntry(file("a.md"), {
        "note.status": new StringValue("open"),
        "note.count": new NumberValue(2),
      }),
      new BasesEntry(file("b.md"), {
        "note.status": new StringValue("open"),
        "note.count": new NumberValue(3),
      }),
      new BasesEntry(file("c.md"), {
        "note.status": new StringValue("done"),
        "note.count": new NumberValue(5),
      }),
    ];
    const result = new BasesQueryResult(entries, ["note.count"], "note.status");

    expect(result.groupedData.map((group) => group.entries.length)).toEqual([
      2, 1,
    ]);
    expect(
      result
        .getSummaryValue({} as QueryController, entries, "note.count", "sum")
        .toString(),
    ).toBe("10");
    expect(
      result
        .getSummaryValue({} as QueryController, entries, "note.count", "avg")
        .toString(),
    ).toBe(String(10 / 3));
  });

  it("normalizes view config values", () => {
    const config = new BasesViewConfig(
      {
        type: "table",
        name: "Table",
        order: ["note.title", 42 as never],
        sort: [
          { property: "note.title", direction: "ASC" },
          { property: "note.bad", direction: "BAD" as never },
        ],
        formula: 12,
      },
      { "note.title": { displayName: "Title" } },
    );

    expect(config.getOrder()).toEqual(["note.title"]);
    expect(config.getSort()).toEqual([
      { property: "note.title", direction: "ASC" },
    ]);
    expect(config.getEvaluatedFormula({} as never, "formula")).toBeInstanceOf(
      NumberValue,
    );
    expect(config.getDisplayName("note.title")).toBe("Title");
    expect(parsePropertyId("custom")).toEqual({ type: "note", name: "custom" });
  });

  it("creates and opens a new file for a view", async () => {
    let content = "";
    let openedPath = "";
    (globalThis as { createDiv?: () => HTMLElement }).createDiv = () =>
      ({}) as HTMLElement;

    class TestBasesView extends BasesView {
      type = "test";

      constructor(controller: QueryController) {
        super(controller);
      }

      onDataUpdated(): void {}
    }

    const app = {
      fileManager: {
        getAvailablePathForAttachment: () => "/Meeting Notes.md",
        processFrontMatter: async (
          _file: TFile,
          processor: (frontmatter: any) => void,
        ) => {
          const frontmatter: Record<string, unknown> = {};
          processor(frontmatter);
          content = `---\nstatus: ${frontmatter.status}\n---\n`;
        },
      },
      vault: {
        create: async (path: string) =>
          new TFile(path, { ctime: 0, mtime: 0, size: 0 }, null),
      },
      openFile: async (file: TFile) => {
        openedPath = file.path;
      },
    };

    const view = new TestBasesView({ app } as unknown as QueryController);

    await view.createFileForView("Meeting Notes", (frontmatter: any) => {
      frontmatter.status = "draft";
    });

    expect(content).toContain("status: draft");
    expect(openedPath).toBe("/Meeting Notes.md");
  });
});
