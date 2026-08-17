import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { markdownLintRuleOptions } from "./rules";
import {
  DEFAULT_MARKDOWN_LINT_DISABLED_RULES,
  DEFAULT_MARKDOWN_LINT_EXCLUDE_GLOBS,
  DEFAULT_MARKDOWN_LINT_INCLUDE_GLOBS,
  MARKDOWN_LINT_SETTING_IDS,
} from "./settings";

export const MARKDOWN_LINT_SETTINGS_SECTION_ID = "markdown-lint";

export function createMarkdownLintSettingsSection() {
  return {
    id: MARKDOWN_LINT_SETTINGS_SECTION_ID,
    title: "Markdown Lint",
    description:
      "Which Markdownlint rules run on open documents and which paths they include.",
    icon: "list-checks" as const,
    order: 26,
    navigationGroupId: "core-plugins",
    sourcePluginId: "lapis-markdown-lint",
    fields: [
      {
        id: MARKDOWN_LINT_SETTING_IDS.disabledRules,
        type: "multi-enum" as const,
        title: "Disabled rules",
        description:
          "Turn off selected Markdownlint rules for this vault. MD013/line-length starts off, matching vscode-markdownlint.",
        default: [...DEFAULT_MARKDOWN_LINT_DISABLED_RULES],
        options: markdownLintRuleOptions(),
        allowUnknownOptions: true,
      },
      {
        id: MARKDOWN_LINT_SETTING_IDS.includeGlobs,
        type: "list" as const,
        itemType: "string" as const,
        title: "Include globs",
        description:
          "Optional path allowlist for open Markdown documents. Leave empty to lint remaining Markdown after excludes.",
        default: [...DEFAULT_MARKDOWN_LINT_INCLUDE_GLOBS],
      },
      {
        id: MARKDOWN_LINT_SETTING_IDS.excludeGlobs,
        type: "list" as const,
        itemType: "string" as const,
        title: "Exclude globs",
        description:
          "Skip matching open Markdown paths. Clearing the list lints remaining included files.",
        default: [...DEFAULT_MARKDOWN_LINT_EXCLUDE_GLOBS],
      },
    ],
  };
}

export function registerMarkdownLintSettings(plugin: Plugin): void {
  if (!plugin.app.workspace) {
    return;
  }

  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) {
    return;
  }

  plugin.register(
    binding.controller.registerSettingsSection(
      createMarkdownLintSettingsSection(),
    ),
  );
}
