import type { App } from "@lapis-notes/api";

export const MARKDOWN_LINT_SETTING_IDS = {
  disabledRules: "markdown-lint.disabledRules",
  includeGlobs: "markdown-lint.includeGlobs",
  excludeGlobs: "markdown-lint.excludeGlobs",
} as const;

export const DEFAULT_MARKDOWN_LINT_DISABLED_RULES = ["MD013"] as const;

export const DEFAULT_MARKDOWN_LINT_INCLUDE_GLOBS = [
  "**/*.{md,markdown,mdown,mkd,mdwn,mdtxt,mdtext}",
] as const;

export const DEFAULT_MARKDOWN_LINT_EXCLUDE_GLOBS = [
  "**/node_modules/**",
  "**/bower_components/**",
  "**/.git/**",
  "**/vendor/**",
  "**/.obsidian/**",
  "**/.lapis/**",
  "**/.jj/**",
] as const;

export interface MarkdownLintSettings {
  disabledRules: string[];
  includeGlobs: string[];
  excludeGlobs: string[];
}

export function normalizeMarkdownLintStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  ];
}

export function readMarkdownLintSettings(app: App): MarkdownLintSettings {
  const configuration = app.configuration.getConfiguration();
  return {
    disabledRules: normalizeMarkdownLintStringList(
      configuration.get(
        MARKDOWN_LINT_SETTING_IDS.disabledRules,
        DEFAULT_MARKDOWN_LINT_DISABLED_RULES,
      ),
    ),
    includeGlobs: normalizeMarkdownLintStringList(
      configuration.get(
        MARKDOWN_LINT_SETTING_IDS.includeGlobs,
        DEFAULT_MARKDOWN_LINT_INCLUDE_GLOBS,
      ),
    ),
    excludeGlobs: normalizeMarkdownLintStringList(
      configuration.get(
        MARKDOWN_LINT_SETTING_IDS.excludeGlobs,
        DEFAULT_MARKDOWN_LINT_EXCLUDE_GLOBS,
      ),
    ),
  };
}

export async function updateMarkdownLintSetting(
  app: App,
  id: string,
  value: unknown,
): Promise<void> {
  await app.configuration.updateConfigurationOption(id, value);
}

export function markdownLintRulesFromSettings(
  settings: MarkdownLintSettings,
): Record<string, unknown> | undefined {
  if (settings.disabledRules.length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    settings.disabledRules.map((rule) => [rule, false] as const),
  );
}
