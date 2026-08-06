import { describe, expect, it } from "vitest";
import type { ObjectType } from "../configuration.svelte";
import {
  columnLabel,
  createDefaultCellValue,
  createDefaultRow,
  filterComboboxOptions,
  isOptionsSourceComboboxField,
  moveArrayItem,
  sortedObjectProperties,
} from "../components/configuration/object-array-utils";

describe("object-array-utils", () => {
  const objectSchema: ObjectType = {
    type: "object",
    additionalProperties: false,
    properties: {
      pattern: {
        type: "string",
        title: "Pattern",
        order: 10,
        default: "*.md",
      },
      mode: {
        type: "string",
        title: "Mode",
        order: 20,
        enum: ["include", "exclude"],
        enumItemLabels: ["Include", "Exclude"],
        default: "include",
      },
      enabled: {
        type: "boolean",
        title: "Enabled",
        order: 30,
        default: true,
      },
    },
  };

  it("sorts columns by order then key", () => {
    expect(sortedObjectProperties(objectSchema).map(([key]) => key)).toEqual([
      "pattern",
      "mode",
      "enabled",
    ]);
  });

  it("uses title for column labels with key fallback", () => {
    expect(columnLabel("pattern", objectSchema.properties!.pattern)).toBe(
      "Pattern",
    );
    expect(columnLabel("fallback", { type: "string", order: 99 })).toBe(
      "fallback",
    );
  });

  it("creates default row values from property defaults", () => {
    expect(createDefaultRow(objectSchema)).toEqual({
      pattern: "*.md",
      mode: "include",
      enabled: true,
    });
  });

  it("prefers object default when present", () => {
    expect(
      createDefaultRow({
        ...objectSchema,
        default: { pattern: "*.txt", mode: "exclude", enabled: false },
      }),
    ).toEqual({
      pattern: "*.txt",
      mode: "exclude",
      enabled: false,
    });
  });

  it("creates enum and optionsSource cell defaults", () => {
    expect(
      createDefaultCellValue({
        type: "string",
        enum: ["alpha", "beta"],
      }),
    ).toBe("alpha");
    expect(
      createDefaultCellValue(
        { type: "string", optionsSource: "workspace.editorViews" },
        [{ value: "markdown", label: "Markdown" }],
      ),
    ).toBe("markdown");
  });

  it("detects searchable optionsSource columns", () => {
    expect(
      isOptionsSourceComboboxField({
        type: "string",
        optionsSource: "plugin-test.fixtureTags",
        allowUnknownOptions: true,
      }),
    ).toBe(true);
    expect(
      isOptionsSourceComboboxField({
        type: "string",
        optionsSource: "plugin-test.fixtureTags",
        allowUnknownOptions: false,
      }),
    ).toBe(false);
  });

  it("shows the full combobox option list until the user types a filter", () => {
    const options = [
      { value: "lapis-bases.table", label: "Bases table" },
      { value: "markdown.markdown", label: "Markdown" },
      { value: "canvas.canvas", label: "Canvas" },
    ];

    expect(
      filterComboboxOptions(options, "lapis-bases.table", "").map(
        (option) => option.value,
      ),
    ).toEqual(["lapis-bases.table", "markdown.markdown", "canvas.canvas"]);

    expect(
      filterComboboxOptions(options, "lapis-bases.table", "mark").map(
        (option) => option.value,
      ),
    ).toEqual(["markdown.markdown"]);
  });

  it("moves array items without mutating the source array", () => {
    const items = ["a", "b", "c"];
    expect(moveArrayItem(items, 0, 2)).toEqual(["b", "c", "a"]);
    expect(items).toEqual(["a", "b", "c"]);
    expect(moveArrayItem(items, 1, 1)).toEqual(["a", "b", "c"]);
  });
});
