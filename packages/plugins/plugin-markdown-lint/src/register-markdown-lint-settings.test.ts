import { describe, expect, it } from "vitest";
import {
  createMarkdownLintSettingsSection,
  MARKDOWN_LINT_SETTINGS_SECTION_ID,
} from "./register-markdown-lint-settings";
import { MARKDOWN_LINT_RULES } from "./rules";
import {
  DEFAULT_MARKDOWN_LINT_DISABLED_RULES,
  DEFAULT_MARKDOWN_LINT_EXCLUDE_GLOBS,
  DEFAULT_MARKDOWN_LINT_INCLUDE_GLOBS,
  MARKDOWN_LINT_SETTING_IDS,
} from "./settings";

describe("markdown lint settings section", () => {
  it("seeds disabled rules and file globs for the Settings UI", () => {
    const section = createMarkdownLintSettingsSection();

    expect(section.id).toBe(MARKDOWN_LINT_SETTINGS_SECTION_ID);
    expect(section.title).toBe("Markdown Lint");
    expect(section.navigationGroupId).toBe("core-plugins");
    expect(section.fields.map((field) => field.id)).toEqual([
      MARKDOWN_LINT_SETTING_IDS.disabledRules,
      MARKDOWN_LINT_SETTING_IDS.includeGlobs,
      MARKDOWN_LINT_SETTING_IDS.excludeGlobs,
    ]);
    const disabledRules = section.fields.find(
      (field) => field.id === MARKDOWN_LINT_SETTING_IDS.disabledRules,
    );
    expect(disabledRules).toMatchObject({
      type: "multi-enum",
      default: [...DEFAULT_MARKDOWN_LINT_DISABLED_RULES],
    });
    expect(
      disabledRules && "options" in disabledRules ? disabledRules.options : [],
    ).toHaveLength(MARKDOWN_LINT_RULES.length);
    expect(
      section.fields.find(
        (field) => field.id === MARKDOWN_LINT_SETTING_IDS.includeGlobs,
      ),
    ).toMatchObject({
      type: "list",
      default: [...DEFAULT_MARKDOWN_LINT_INCLUDE_GLOBS],
    });
    expect(
      section.fields.find(
        (field) => field.id === MARKDOWN_LINT_SETTING_IDS.excludeGlobs,
      ),
    ).toMatchObject({
      type: "list",
      default: [...DEFAULT_MARKDOWN_LINT_EXCLUDE_GLOBS],
    });
  });
});
