import { describe, expect, it } from "vitest";
import { createMarkdownlintLintOptions } from "../markdownlint/options";
import {
  markdownCodeActionsForDocument,
  markdownDiagnosticsForDocument,
} from "../markdownlint/runtime";
import { markdownCodeActionsFromIssues } from "../markdownlint/runtime-core";
import { lint } from "markdownlint/sync";
import { applyFix, applyFixes } from "markdownlint";

const MD018_RULE_NAMES = new Set([
  "MD018",
  "MD018-lapis",
  "no-missing-space-atx-except-tags",
]);

function md018Issues(result: Record<string, Array<{ ruleNames?: string[] }>>) {
  return (result["note.md"] ?? []).filter((issue) =>
    issue.ruleNames?.some((name) => MD018_RULE_NAMES.has(name)),
  );
}

function lintMarkdown(content: string, rules?: Record<string, unknown>) {
  return lint({
    strings: { "note.md": content },
    ...createMarkdownlintLintOptions(rules),
  });
}

function applySingleCodeAction(
  original: string,
  action: {
    edit?: {
      changes?: Array<{ from: number; to: number; insert: string }>;
    };
  },
) {
  const change = action.edit?.changes?.[0];
  expect(change).toBeDefined();
  return (
    original.slice(0, change!.from) +
    change!.insert +
    original.slice(change!.to)
  );
}

describe("markdownlint sync API", () => {
  it("reports default-rule violations through markdownlint/sync", () => {
    const result = lintMarkdown("hello world\n");

    const issues = result["note.md"] ?? [];
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.ruleNames?.includes("MD041"))).toBe(
      true,
    );
  });

  it("suppresses disabled rules when config disables them", () => {
    const result = lintMarkdown("hello world\n", { MD041: false });

    const issues = result["note.md"] ?? [];
    expect(issues.some((issue) => issue.ruleNames?.includes("MD041"))).toBe(
      false,
    );
  });

  it("disables MD013 line-length by default like vscode-markdownlint", () => {
    const longLine =
      "The cheapest loft stilts are plastic raised joist extensions that cost more than eighty characters.\n";
    const defaultResult = lintMarkdown(longLine);
    expect(
      (defaultResult["note.md"] ?? []).some((issue) =>
        issue.ruleNames?.includes("MD013"),
      ),
    ).toBe(false);

    const enabledResult = lintMarkdown(longLine, {
      MD013: { line_length: 80 },
    });
    expect(
      (enabledResult["note.md"] ?? []).some((issue) =>
        issue.ruleNames?.includes("MD013"),
      ),
    ).toBe(true);
  });

  it("returns fix metadata for fixable MD018 violations", () => {
    const result = lintMarkdown("#Heading\n");

    const issue = md018Issues(result)[0];
    expect(issue?.fixInfo).toMatchObject({
      editColumn: 2,
      insertText: " ",
    });
    expect(applyFix("#Heading\n", issue?.fixInfo)).toBe("# Heading\n");
  });

  it("does not report MD018 for whole-line lowercase tags", () => {
    const cases = ["#task\n", "#project/roadmap\n", "  #task\n"];

    for (const content of cases) {
      const result = lintMarkdown(content);
      expect(md018Issues(result)).toEqual([]);
    }
  });

  it("does not report MD018 for line-start tag prefixes", () => {
    const result = lintMarkdown("#task Buy milk\n");
    expect(md018Issues(result)).toEqual([]);
  });

  it("does not report MD018 for valid spaced ATX headings", () => {
    const cases = ["# Intro\n", "## Start Here\n", "### Deep Dive\n"];

    for (const content of cases) {
      const result = lintMarkdown(content, { MD041: false });
      expect(md018Issues(result)).toEqual([]);
    }
  });

  it("reports MD018 for malformed ATX headings", () => {
    const cases = ["#Introduction\n", "##Section\n", "###foo\n"];

    for (const content of cases) {
      const result = lintMarkdown(content);
      expect(md018Issues(result).length).toBeGreaterThan(0);
    }
  });

  it("does not report MD018 for lowercase whole-line tags", () => {
    const result = lintMarkdown("#bad\n");
    expect(md018Issues(result)).toEqual([]);
  });

  it("suppresses the replacement MD018 rule when disabled in vault config", () => {
    const result = lintMarkdown("#Heading\n", { MD018: false });
    expect(md018Issues(result)).toEqual([]);
  });

  it("builds frontmatter-safe MD018 fixes from the actual violation line", () => {
    const content = [
      "---",
      "title: Test",
      "---",
      "",
      "# Good",
      "",
      "##bad",
      "",
    ].join("\n");
    const document = {
      uri: "note.md",
      languageId: "markdown",
      version: 1,
      text: content,
    };
    const diagnostic = markdownDiagnosticsForDocument(document).find(
      (entry) => entry.code === "MD018",
    );

    expect(diagnostic).toBeDefined();

    const actions = markdownCodeActionsForDocument(document, diagnostic.range);
    const fixAction = actions.find(
      (action) => action.title === "Fix markdownlint MD018",
    );

    expect(fixAction).toBeDefined();

    const change = fixAction.edit?.changes?.[0];
    expect(change).toMatchObject({
      from: content.indexOf("##bad") + 2,
      to: content.indexOf("##bad") + 2,
      insert: " ",
    });

    expect(applySingleCodeAction(content, fixAction)).toBe(
      ["---", "title: Test", "---", "", "# Good", "", "## bad", ""].join("\n"),
    );
  });

  it("adds next-line ignore actions that suppress MD041 when inserted before the first content line", () => {
    const content = ["---", "title: Test", "---", "#Bad", ""].join("\n");
    const document = {
      uri: "note.md",
      languageId: "markdown",
      version: 1,
      text: content,
    };
    const diagnostic = markdownDiagnosticsForDocument(document).find(
      (entry) => entry.code === "MD018",
    );

    expect(diagnostic).toBeDefined();

    const actions = markdownCodeActionsForDocument(document, diagnostic.range);
    const ignoreNextLineAction = actions.find(
      (action) => action.title === "Ignore markdownlint MD018 on next line",
    );

    expect(ignoreNextLineAction).toBeDefined();

    const updated = applySingleCodeAction(content, ignoreNextLineAction);
    expect(updated).toContain(
      "<!-- markdownlint-disable-next-line MD018 MD041 -->",
    );
    const updatedDiagnostics = markdownDiagnosticsForDocument({
      uri: "note.md",
      languageId: "markdown",
      version: 2,
      text: updated,
    });
    expect(updatedDiagnostics.some((entry) => entry.code === "MD018")).toBe(
      false,
    );
    expect(updatedDiagnostics.some((entry) => entry.code === "MD041")).toBe(
      false,
    );
  });

  it("adds file-level ignore actions without modifying frontmatter", () => {
    const content = [
      "---",
      "title: Test",
      "---",
      "",
      "# Good",
      "",
      "##bad",
    ].join("\n");
    const document = {
      uri: "note.md",
      languageId: "markdown",
      version: 1,
      text: content,
    };
    const diagnostic = markdownDiagnosticsForDocument(document).find(
      (entry) => entry.code === "MD018",
    );

    expect(diagnostic).toBeDefined();

    const actions = markdownCodeActionsForDocument(document, diagnostic.range);
    const ignoreFileAction = actions.find(
      (action) => action.title === "Ignore markdownlint MD018 for this file",
    );

    expect(ignoreFileAction).toBeDefined();

    const updated = applySingleCodeAction(content, ignoreFileAction);
    expect(updated.startsWith("---\ntitle: Test\n---\n")).toBe(true);
    expect(updated).toContain(
      "<!-- markdownlint-disable-file MD018 MD018-lapis no-missing-space-atx-except-tags -->",
    );
    expect(md018Issues(lintMarkdown(updated))).toEqual([]);
  });

  it("does not offer next-line ignores for diagnostics inside leading YAML frontmatter", () => {
    const content = ["---", "title: Test", "# Good", ""].join("\n");
    const document = {
      uri: "note.md",
      languageId: "markdown",
      version: 1,
      text: content,
    };
    const diagnostic = markdownDiagnosticsForDocument(document).find(
      (entry) => entry.code === "MD022",
    );

    expect(diagnostic).toBeDefined();

    const actions = markdownCodeActionsForDocument(document, diagnostic.range);
    expect(
      actions.some(
        (action) => action.title === "Ignore markdownlint MD022 on next line",
      ),
    ).toBe(false);
    expect(
      actions.some(
        (action) => action.title === "Ignore markdownlint MD022 for this file",
      ),
    ).toBe(true);
  });

  it("groups intersecting same-rule MD032 fixes into unique titles", () => {
    const content = ["# Title", "- item", "next", ""].join("\n");
    const document = {
      uri: "note.md",
      languageId: "markdown",
      version: 1,
      text: content,
    };
    const issues = [
      {
        lineNumber: 2,
        ruleNames: ["MD032"],
        ruleDescription: "Lists should be surrounded by blank lines",
        errorContext: "- item",
        fixInfo: { lineNumber: 2, insertText: "\n" },
      },
      {
        lineNumber: 2,
        ruleNames: ["MD032"],
        ruleDescription: "Lists should be surrounded by blank lines",
        errorContext: "- item",
        fixInfo: { lineNumber: 3, insertText: "\n" },
      },
    ];
    const actions = markdownCodeActionsFromIssues(
      document,
      { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } },
      issues,
      (fixable) => applyFixes(document.text, fixable),
    );
    const titles = actions.map((action) => action.title);
    expect(titles).toEqual([...new Set(titles)]);
    expect(titles.filter((title) => title === "Fix markdownlint MD032")).toEqual(
      ["Fix markdownlint MD032"],
    );

    const fixAction = actions.find(
      (action) => action.title === "Fix markdownlint MD032",
    );
    expect(fixAction).toBeDefined();
    const updated = applySingleCodeAction(content, fixAction);
    expect(updated).toBe(["# Title", "", "- item", "", "next", ""].join("\n"));
  });
});
