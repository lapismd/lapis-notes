import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  INVALID_FILTER_FORMULA_MESSAGE,
  parsePredicate,
  resolveFilterDraft,
  toSQL,
  validateFilterPredicate,
} from "./filter-parser";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const modelsPath = path.join(currentDir, "models.ts");

const supportedFilterQueryTypes = new Set(
  [...fs.readFileSync(modelsPath, "utf8").matchAll(/value:\s*"([^"]+)"/g)].map(
    (match) => match[1],
  ),
);

const supportedQueryTypeExamples = {
  "=": [
    {
      name: "Simple Equality",
      input: [
        `file.ext == 'md'`,
        `file.ext == 'md'`,
        `file.ext == "md"`,
        `file.ext = 'md'`,
        `file.ext = 'md'`,
        `file.ext = "md"`,
      ],
      output: { column: "file.ext", op: "=", value: "md" },
    },
  ],
  "!=": [
    {
      input: `status != "done"`,
      output: { column: "status", op: "!=", value: "done" },
      sql: `status != "done"`,
    },
  ],
  "<": [
    {
      input: `age < 12`,
      output: { column: "age", op: "<", value: 12 },
      sql: `age < 12`,
    },
  ],
  "<=": [
    {
      input: `age <= 12`,
      output: { column: "age", op: "<=", value: 12 },
      sql: `age <= 12`,
    },
  ],
  ">": [
    {
      input: `price > 2.1`,
      output: { column: "price", op: ">", value: 2.1 },
      sql: `price > 2.1`,
    },
  ],
  ">=": [
    {
      input: `price >= 2.1`,
      output: { column: "price", op: ">=", value: 2.1 },
      sql: `price >= 2.1`,
    },
  ],
  startsWith: [
    {
      input: `file.name.startsWith("Untitled")`,
      output: { column: "file.name", op: "startsWith", value: "Untitled" },
      sql: `file.name.startsWith("Untitled")`,
    },
  ],
  "!startsWith": [
    {
      input: `!file.name.startsWith("Untitled")`,
      output: { column: "file.name", op: "!startsWith", value: "Untitled" },
      sql: `!file.name.startsWith("Untitled")`,
    },
  ],
  endsWith: [
    {
      input: `file.name.endsWith(".md")`,
      output: { column: "file.name", op: "endsWith", value: ".md" },
      sql: `file.name.endsWith(".md")`,
    },
  ],
  "!endsWith": [
    {
      input: `!file.name.endsWith(".md")`,
      output: { column: "file.name", op: "!endsWith", value: ".md" },
      sql: `!file.name.endsWith(".md")`,
    },
  ],
  contains: [
    {
      input: `file.name.contains("note")`,
      output: { column: "file.name", op: "contains", value: "note" },
      sql: `file.name.contains("note")`,
    },
  ],
  "!contains": [
    {
      input: `!file.name.contains("note")`,
      output: { column: "file.name", op: "!contains", value: "note" },
      sql: `!file.name.contains("note")`,
    },
  ],
  containsAnyOf: [
    {
      input: `file.name.containsAnyOf("22", "1")`,
      output: {
        column: "file.name",
        op: "containsAnyOf",
        value: ["22", "1"],
      },
      sql: `file.name.containsAnyOf("22","1")`,
    },
  ],
  "!containsAnyOf": [
    {
      input: `!file.name.containsAnyOf("22", "1")`,
      output: {
        column: "file.name",
        op: "!containsAnyOf",
        value: ["22", "1"],
      },
      sql: `!file.name.containsAnyOf("22","1")`,
    },
  ],
  containsAllOf: [
    {
      input: `file.name.containsAllOf("22", "1")`,
      output: {
        column: "file.name",
        op: "containsAllOf",
        value: ["22", "1"],
      },
      sql: `file.name.containsAllOf("22","1")`,
    },
  ],
  "!containsAllOf": [
    {
      input: `!file.name.containsAllOf("22", "1")`,
      output: {
        column: "file.name",
        op: "!containsAllOf",
        value: ["22", "1"],
      },
      sql: `!file.name.containsAllOf("22","1")`,
    },
  ],
  hasLink: [
    {
      input: `file.hasLink("Project.md")`,
      output: { column: "file", op: "hasLink", value: "Project.md" },
      sql: `file.hasLink("Project.md")`,
    },
  ],
  "!hasLink": [
    {
      input: `!file.hasLink("Project.md")`,
      output: { column: "file", op: "!hasLink", value: "Project.md" },
      sql: `!file.hasLink("Project.md")`,
    },
  ],
  inFolder: [
    {
      input: `file.inFolder("Projects")`,
      output: { column: "file", op: "inFolder", value: "Projects" },
      sql: `file.inFolder("Projects")`,
    },
  ],
  "!inFolder": [
    {
      input: `!file.inFolder("Projects")`,
      output: { column: "file", op: "!inFolder", value: "Projects" },
      sql: `!file.inFolder("Projects")`,
    },
  ],
  hasTag: [
    {
      input: `file.hasTag("tag")`,
      output: { column: "file", op: "hasTag", value: "tag" },
      sql: `file.hasTag("tag")`,
    },
  ],
  "!hasTag": [
    {
      input: `!file.hasTag("tag")`,
      output: { column: "file", op: "!hasTag", value: "tag" },
      sql: `!file.hasTag("tag")`,
    },
  ],
  hasProperty: [
    {
      input: `file.hasProperty("status")`,
      output: { column: "file", op: "hasProperty", value: "status" },
      sql: `file.hasProperty("status")`,
    },
  ],
  "!hasProperty": [
    {
      input: `!file.hasProperty("status")`,
      output: { column: "file", op: "!hasProperty", value: "status" },
      sql: `!file.hasProperty("status")`,
    },
  ],
  isTruthy: [
    {
      input: `status.isTruthy()`,
      output: { column: "status", op: "isTruthy", value: [] },
      sql: `status.isTruthy()`,
    },
  ],
  "!isTruthy": [
    {
      input: `!status.isTruthy()`,
      output: { column: "status", op: "!isTruthy", value: [] },
      sql: `!status.isTruthy()`,
    },
  ],
  isEmpty: [
    {
      input: `status.isEmpty()`,
      output: { column: "status", op: "isEmpty", value: [] },
      sql: `status.isEmpty()`,
    },
  ],
  "!isEmpty": [
    {
      input: `!status.isEmpty()`,
      output: { column: "status", op: "!isEmpty", value: [] },
      sql: `!status.isEmpty()`,
    },
  ],
} as const;

function runTests(
  tests: Array<{
    name?: string;
    input: string | ReadonlyArray<string>;
    output: any;
    sql?: string;
  }>,
) {
  for (const { input, name, output, sql } of tests) {
    if (typeof input !== "string") {
      describe(name || `${input.join(", ")}`, () => {
        input.forEach((value) => {
          test(value, () => {
            expect(parsePredicate(value)).toEqual(output);
            if (sql) {
              expect(toSQL(output)).toEqual(sql);
            }
          });
        });
      });
    } else {
      test(input, () => {
        expect(parsePredicate(input)).toEqual(output);
        if (sql) {
          expect(toSQL(output)).toEqual(sql);
        }
      });
    }
  }
}

runTests([
  {
    input: `formula["Untitled 3"] = true`,
    output: {
      column: `formula["Untitled 3"]`,
      op: "=",
      value: true,
    },
    sql: `formula["Untitled 3"] = true`,
  },
  {
    input: `formula.ppu > 5`,
    output: { column: "formula.ppu", op: ">", value: 5 },
    sql: `formula.ppu > 5`,
  },
  {
    input: `file.name.containsAny("22", "1")`,
    output: { column: "file.name", op: "containsAny", value: ["22", "1"] },
    sql: `file.name.containsAny("22","1")`,
  },
  {
    input: `file.name.containsAny("22", "1".lower())`,
    output: {
      column: "file.name",
      value: "",
      op: "containsAny",
      custom: `file.name.containsAny("22", "1".lower())`,
    },
  },
  {
    input: `(price / age).toFixed(2)`,
    output: {
      column: "",
      value: "",
      op: "",
      custom: `(price / age).toFixed(2)`,
    },
    sql: `(price / age).toFixed(2)`,
  },
  {
    input: `if(price, price.toFixed(2) + " dollars")`,
    output: {
      value: "",
      op: "if",
      custom: `if(price, price.toFixed(2) + " dollars")`,
    },
  },
  {
    input: `price > 2.1 AND age < 12 AND name = 'peter'`,
    output: {
      and: [
        { column: "price", op: ">", value: 2.1 },
        { column: "age", op: "<", value: 12 },
        { column: "name", op: "=", value: "peter" },
      ],
    },
    sql: `(price > 2.1 AND age < 12 AND name = "peter")`,
  },
  {
    input: `(price > 2.1 AND age < 12) OR name = 'peter'`,
    output: {
      or: [
        {
          and: [
            { column: "price", op: ">", value: 2.1 },
            { column: "age", op: "<", value: 12 },
          ],
        },
        { column: "name", op: "=", value: "peter" },
      ],
    },
    sql: `((price > 2.1 AND age < 12) OR name = "peter")`,
  },
  {
    input: `note.status && note.status != "" && note.status != null`,
    output: {
      and: [
        "note.status",
        { column: "note.status", op: "!=", value: "" },
        { column: "note.status", op: "!=", value: null },
      ],
    },
    sql: `(note.status AND note.status != "" AND note.status != null)`,
  },
  {
    input: `file.name.lower() != "<note>"`,
    output: {
      column: "",
      op: "!=",
      value: "",
      custom: `file.name.lower() != "<note>"`,
    },
  },
  ...Object.values(supportedQueryTypeExamples).flat(),
]);

describe("supported bases filter query types", () => {
  test("has a parser example for every supported filter query type", () => {
    expect(Object.keys(supportedQueryTypeExamples).sort()).toEqual(
      [...supportedFilterQueryTypes].sort(),
    );
  });
});

describe("advanced filter validation", () => {
  test("accepts empty and complete expressions", () => {
    expect(validateFilterPredicate("")).toMatchObject({
      valid: true,
      error: null,
    });
    expect(validateFilterPredicate('file.hasLink("Aurora.md")')).toMatchObject({
      valid: true,
      error: null,
    });
  });

  test("returns a stable user-facing error for an incomplete expression", () => {
    expect(validateFilterPredicate("file.hasLink(")).toEqual({
      valid: false,
      predicate: null,
      error: INVALID_FILTER_FORMULA_MESSAGE,
    });
  });

  test("preserves the applied expression until an invalid draft is corrected", () => {
    const applied = 'file.hasLink("")';
    expect(resolveFilterDraft(applied, "file.hasLink(")).toEqual({
      applied,
      error: INVALID_FILTER_FORMULA_MESSAGE,
      valid: false,
    });
    expect(resolveFilterDraft(applied, 'file.hasLink("") ')).toEqual({
      applied: 'file.hasLink("") ',
      error: null,
      valid: true,
    });
  });
});
