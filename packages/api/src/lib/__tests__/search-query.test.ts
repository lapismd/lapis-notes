import { describe, expect, it } from "vitest";
import {
  collectSearchQueryPropertyNames,
  createVaultSearchFilterSyntax,
  formatSearchQueryValue,
  parseSearchQuery,
  parseSearchQueryAst,
} from "../search-query";
import { searchTerms } from "../storage/app-database";

describe("search query parser", () => {
  it("parses grouped boolean queries", () => {
    const tree = parseSearchQuery("tag:#work OR (file:Daily phrase)");

    expect(tree.toString()).toContain("Query(");
    expect(tree.toString()).toContain("OrExpression(");
    expect(tree.toString()).toContain("FieldExpression(");
    expect(tree.toString()).toContain("Group(");
  });

  it("lowers grouped boolean queries into an AST", () => {
    const ast = parseSearchQueryAst("tag:#work OR (file:Daily phrase)");

    expect(ast).toMatchObject({
      diagnostics: [],
      expression: {
        type: "or",
        clauses: [
          {
            type: "field",
            name: "tag",
            value: {
              type: "literal",
              kind: "word",
              value: "#work",
            },
          },
          {
            type: "group",
            expression: {
              type: "and",
              clauses: [
                {
                  type: "field",
                  name: "file",
                  value: {
                    type: "literal",
                    kind: "word",
                    value: "Daily",
                  },
                },
                {
                  type: "literal",
                  kind: "word",
                  value: "phrase",
                },
              ],
            },
          },
        ],
      },
    });
  });

  it("parses quoted phrases, regex, and negation", () => {
    const tree = parseSearchQuery('-"daily note" /2026-05-07/');

    expect(tree.toString()).toContain("Negation");
    expect(tree.toString()).toContain("Phrase");
    expect(tree.toString()).toContain("Regex");
  });

  it("lowers phrases, regexes, and negation into an AST", () => {
    const ast = parseSearchQueryAst('-"daily note" /2026-05-07/');

    expect(ast).toMatchObject({
      diagnostics: [],
      expression: {
        type: "and",
        clauses: [
          {
            type: "not",
            operand: {
              type: "literal",
              kind: "phrase",
              value: "daily note",
            },
          },
          {
            type: "literal",
            kind: "regex",
            value: "2026-05-07",
          },
        ],
      },
    });
  });

  it("accepts slash tags without changing leading regex syntax", () => {
    const slashTag = parseSearchQueryAst("tag:#team/project");
    const regex = parseSearchQueryAst("/Ship\\s+search/");

    expect(slashTag).toMatchObject({
      diagnostics: [],
      expression: {
        type: "field",
        name: "tag",
        value: { type: "literal", kind: "word", value: "#team/project" },
      },
    });
    expect(regex).toMatchObject({
      diagnostics: [],
      expression: {
        type: "literal",
        kind: "regex",
        value: "Ship\\s+search",
      },
    });
  });

  it("round-trips dynamic values through quoted field syntax", () => {
    const values = [
      "#team/project",
      "Notes/Welcome.md",
      "project alpha",
      'quoted "value"',
      "folder\\name",
      "OR",
      "null",
      "",
    ];

    expect(formatSearchQueryValue("#team/project")).toBe("#team/project");
    expect(formatSearchQueryValue("project alpha")).toBe('"project alpha"');

    for (const value of values) {
      const ast = parseSearchQueryAst(`tag:${formatSearchQueryValue(value)}`);
      expect(ast.diagnostics).toEqual([]);
      expect(ast.expression).toMatchObject({
        type: "field",
        name: "tag",
        value: { type: "literal", value },
      });
    }
  });

  it("builds a shared vault syntax with parser-safe dynamic completions", () => {
    const syntax = createVaultSearchFilterSyntax({
      fileNames: ["Welcome.md", "Project brief.md"],
      paths: ["Notes", "Project alpha"],
      tags: ["#topic/finance", "#project alpha"],
    });

    expect(syntax.fields.map((field) => field.name)).toEqual([
      "file",
      "path",
      "tag",
      "content",
      "line",
      "section",
    ]);
    expect(syntax.fields.find((field) => field.name === "tag")?.values).toEqual(
      [
        { value: "#project alpha", apply: '"#project alpha"' },
        { value: "#topic/finance", apply: "#topic/finance" },
      ],
    );

    for (const field of syntax.fields.filter((field) => field.values)) {
      for (const value of field.values ?? []) {
        expect(
          parseSearchQueryAst(`${field.name}:${value.apply}`).diagnostics,
        ).toEqual([]);
      }
    }
  });

  it("parses bracketed properties and comparisons", () => {
    const tree = parseSearchQuery('["aliases"]:null ["duration"]:<5');

    expect(tree.toString()).toContain("PropertyExpression(");
    expect(tree.toString()).toContain("NullKeyword");
    expect(tree.toString()).toContain("Comparison(");
  });

  it("lowers properties and comparisons into an AST", () => {
    const ast = parseSearchQueryAst('["aliases"]:null ["duration"]:<5');

    expect(ast).toMatchObject({
      diagnostics: [],
      expression: {
        type: "and",
        clauses: [
          {
            type: "property",
            name: "aliases",
            value: {
              type: "literal",
              kind: "null",
              value: null,
            },
          },
          {
            type: "property",
            name: "duration",
            value: {
              type: "comparison",
              operator: "<",
              value: {
                type: "literal",
                kind: "word",
                value: "5",
              },
            },
          },
        ],
      },
    });
  });

  it("retains legacy property values inside brackets", () => {
    const ast = parseSearchQueryAst("[aliases:null] [duration:<5]");

    expect(ast.diagnostics).toEqual([]);
    expect(ast.expression).toMatchObject({
      type: "and",
      clauses: [
        { type: "property", name: "aliases" },
        { type: "property", name: "duration" },
      ],
    });
  });

  it("lowers quoted property names", () => {
    const ast = parseSearchQueryAst('["note.status"] ["tags"]');

    expect(ast).toMatchObject({
      diagnostics: [],
      expression: {
        type: "and",
        clauses: [
          {
            type: "property",
            name: "note.status",
            value: null,
          },
          {
            type: "property",
            name: "tags",
            value: null,
          },
        ],
      },
    });
  });

  it("reports diagnostics for incomplete queries", () => {
    const ast = parseSearchQueryAst("(");

    expect(ast.diagnostics).not.toHaveLength(0);
    expect(ast.diagnostics[0]?.severity).toBe("error");
  });

  it("collects terms from simple literal queries via the AST", () => {
    expect(searchTerms('"Daily Note" today')).toEqual(["daily note", "today"]);
  });

  it("collects terms from bare property-existence queries via the AST", () => {
    expect(searchTerms("[notebook]")).toEqual(["notebook"]);
    expect(searchTerms("[notebook] today")).toEqual(["notebook", "today"]);
  });

  it("collects bare property-existence filters separately from text terms", () => {
    expect(collectSearchQueryPropertyNames("[notebook]")).toEqual(["notebook"]);
    expect(collectSearchQueryPropertyNames('["tags"]')).toEqual(["tags"]);
    expect(collectSearchQueryPropertyNames("[notebook] today")).toEqual([
      "notebook",
    ]);
    expect(collectSearchQueryPropertyNames('["duration"]:<5')).toEqual([]);
  });

  it("falls back to legacy term splitting for unsupported structured queries", () => {
    expect(searchTerms("tag:#work OR today")).toEqual([
      "tag:#work",
      "or",
      "today",
    ]);
  });
});
