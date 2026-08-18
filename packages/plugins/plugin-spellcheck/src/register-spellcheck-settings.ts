import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { SPELLCHECK_PLUGIN_ID } from "./ids";
import { spellcheckRuleOptions } from "./rules";
import {
  DEFAULT_SPELLCHECK_EXCLUDE_GLOBS,
  DEFAULT_SPELLCHECK_INCLUDE_GLOBS,
  DEFAULT_SPELLCHECK_MAX_FILE_LENGTH,
  DEFAULT_SPELLCHECK_NUM_SUGGESTIONS,
  SPELLCHECK_SETTING_IDS,
  updateSpellcheckSetting,
} from "./settings";

export const SPELLCHECK_SETTINGS_SECTION_ID = "spellcheck";

export function createSpellcheckSettingsSection(plugin: Plugin) {
  return {
    id: SPELLCHECK_SETTINGS_SECTION_ID,
    title: "Spell Check",
    description:
      "Harper grammar and spelling for open notes, plus file-type filters.",
    icon: "spell-check" as const,
    order: 27,
    navigationGroupId: "core-plugins",
    sourcePluginId: SPELLCHECK_PLUGIN_ID,
    fields: [
      {
        id: SPELLCHECK_SETTING_IDS.dialect,
        type: "enum" as const,
        title: "Dialect",
        description: "English dialect used by Harper.",
        default: "american",
        options: [
          { value: "american", label: "American" },
          { value: "british", label: "British" },
          { value: "canadian", label: "Canadian" },
          { value: "australian", label: "Australian" },
          { value: "indian", label: "Indian" },
        ],
      },
      {
        id: SPELLCHECK_SETTING_IDS.automaticChecking,
        type: "boolean" as const,
        title: "Automatic checking",
        description:
          "Pause open-document diagnostics without disabling the plugin.",
        default: true,
      },
      {
        id: SPELLCHECK_SETTING_IDS.disabledRules,
        type: "multi-enum" as const,
        title: "Disabled rules",
        description:
          "Turn off selected Harper linters. Harper defaults such as SpelledNumbers stay off unless listed here.",
        default: [] as string[],
        options: spellcheckRuleOptions(),
        allowUnknownOptions: true,
      },
      {
        id: SPELLCHECK_SETTING_IDS.userDictionary,
        type: "list" as const,
        itemType: "string" as const,
        title: "User dictionary",
        description: "Vault words that Harper should treat as valid.",
        default: [] as string[],
      },
      {
        id: SPELLCHECK_SETTING_IDS.ignoreWords,
        type: "list" as const,
        itemType: "string" as const,
        title: "Ignore words",
        description: "Never flag these words and never suggest adding them.",
        default: [] as string[],
      },
      {
        id: SPELLCHECK_SETTING_IDS.ignoredLints,
        type: "list" as const,
        itemType: "string" as const,
        title: "Ignored suggestions",
        description: "Persisted Harper lint hashes skipped on later requests.",
        default: [] as string[],
      },
      {
        id: "spellcheck.forgetIgnored",
        type: "action" as const,
        title: "Forget ignored suggestions",
        description: "Clear persisted ignored lint hashes for this vault.",
        label: "Forget ignored suggestions",
        icon: "rotate-ccw" as const,
        async run() {
          await updateSpellcheckSetting(
            plugin.app,
            SPELLCHECK_SETTING_IDS.ignoredLints,
            [],
          );
        },
      },
      {
        id: SPELLCHECK_SETTING_IDS.isolateEnglish,
        type: "boolean" as const,
        title: "Isolate English",
        description: "Ask Harper to skip text that is unlikely to be English.",
        default: false,
      },
      {
        id: SPELLCHECK_SETTING_IDS.ignoreLinkTitle,
        type: "boolean" as const,
        title: "Ignore link titles",
        description: "Skip Markdown link titles when Harper supports the option.",
        default: false,
      },
      {
        id: SPELLCHECK_SETTING_IDS.maxFileLength,
        type: "integer" as const,
        title: "Max file length",
        description: "Skip open documents larger than this many bytes.",
        default: DEFAULT_SPELLCHECK_MAX_FILE_LENGTH,
        minimum: 1,
      },
      {
        id: SPELLCHECK_SETTING_IDS.numSuggestions,
        type: "integer" as const,
        title: "Suggestion limit",
        description: "Cap replacements shown in hover and Problems menus.",
        default: DEFAULT_SPELLCHECK_NUM_SUGGESTIONS,
        minimum: 1,
        maximum: 20,
      },
      {
        id: SPELLCHECK_SETTING_IDS.checkFrontmatter,
        type: "boolean" as const,
        title: "Check frontmatter",
        description: "Spell-check YAML frontmatter. Off by default.",
        default: false,
      },
      {
        id: SPELLCHECK_SETTING_IDS.diagnosticSeverity,
        type: "enum" as const,
        title: "Diagnostic severity",
        description:
          "Override Harper kind mapping. Leave unset to map Spelling to error, Style to warning, and other kinds to hint.",
        default: "",
        options: [
          { value: "", label: "Kind mapping" },
          { value: "error", label: "Error" },
          { value: "warning", label: "Warning" },
          { value: "information", label: "Information" },
          { value: "hint", label: "Hint" },
        ],
        allowUnknownOptions: true,
      },
      {
        id: SPELLCHECK_SETTING_IDS.enabledFileTypes,
        type: "multi-enum" as const,
        title: "Enabled file types",
        description: "Harper languages to check. Markdown skips code fences.",
        default: ["markdown", "plaintext"],
        options: [
          { value: "markdown", label: "Markdown" },
          { value: "plaintext", label: "Plain text" },
        ],
      },
      {
        id: SPELLCHECK_SETTING_IDS.includeGlobs,
        type: "list" as const,
        itemType: "string" as const,
        title: "Include globs",
        description:
          "Optional path allowlist for open documents. Leave empty to check remaining files after excludes.",
        default: [...DEFAULT_SPELLCHECK_INCLUDE_GLOBS],
      },
      {
        id: SPELLCHECK_SETTING_IDS.excludeGlobs,
        type: "list" as const,
        itemType: "string" as const,
        title: "Exclude globs",
        description: "Skip matching open document paths.",
        default: [...DEFAULT_SPELLCHECK_EXCLUDE_GLOBS],
      },
    ],
  };
}

export function registerSpellcheckSettings(plugin: Plugin): void {
  if (!plugin.app.workspace) {
    return;
  }

  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) {
    return;
  }

  plugin.register(
    binding.controller.registerSettingsSection(
      createSpellcheckSettingsSection(plugin),
    ),
  );
}
