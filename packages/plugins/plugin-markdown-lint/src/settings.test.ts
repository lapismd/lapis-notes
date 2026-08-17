import { describe, expect, it } from "vitest";
import { MARKDOWN_LINT_RULES, markdownLintRuleOptions } from "./rules";
import {
  DEFAULT_MARKDOWN_LINT_DISABLED_RULES,
  markdownLintRulesFromSettings,
  normalizeMarkdownLintStringList,
  readMarkdownLintSettings,
} from "./settings";

function createApp(values: Record<string, unknown> = {}) {
  return {
    configuration: {
      getConfiguration: () => ({
        get: (key: string, fallback: unknown) =>
          key in values ? values[key] : fallback,
      }),
    },
  };
}

describe("markdown lint settings", () => {
  it("lists every default markdownlint rule including MD013 and MD018", () => {
    const ids = MARKDOWN_LINT_RULES.map((rule) => rule.id);

    expect(ids).toHaveLength(53);
    expect(ids).toContain("MD013");
    expect(ids).toContain("MD018");
    expect(markdownLintRuleOptions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: "MD013",
          label: "MD013 / line-length",
        }),
        expect.objectContaining({
          value: "MD018",
          label: "MD018 / no-missing-space-atx",
        }),
      ]),
    );
  });

  it("seeds disabledRules with MD013 when the key is missing", () => {
    expect(readMarkdownLintSettings(createApp() as never)).toEqual({
      disabledRules: [...DEFAULT_MARKDOWN_LINT_DISABLED_RULES],
      includeGlobs: ["**/*.{md,markdown,mdown,mkd,mdwn,mdtxt,mdtext}"],
      excludeGlobs: [
        "**/node_modules/**",
        "**/bower_components/**",
        "**/.git/**",
        "**/vendor/**",
        "**/.obsidian/**",
        "**/.lapis/**",
        "**/.jj/**",
      ],
    });
  });

  it("treats an explicit empty disabledRules list as no suppressed rules", () => {
    const settings = readMarkdownLintSettings(
      createApp({ "markdown-lint.disabledRules": [] }) as never,
    );

    expect(settings.disabledRules).toEqual([]);
    expect(markdownLintRulesFromSettings(settings)).toBeUndefined();
  });

  it("normalizes disabled rule ids and maps them to engine disables", () => {
    expect(normalizeMarkdownLintStringList([" MD041 ", "", "MD013", 12])).toEqual(
      ["MD041", "MD013"],
    );
    expect(
      markdownLintRulesFromSettings({
        disabledRules: ["MD041", "MD013"],
        includeGlobs: [],
        excludeGlobs: [],
      }),
    ).toEqual({
      MD041: false,
      MD013: false,
    });
  });
});
