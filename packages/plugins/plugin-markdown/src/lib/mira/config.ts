import { MiraFeature, type MiraFeatureName } from "@lapismd/mira-editor";

export const MARKDOWN_SCHEMA_ID = "markdown";

export const MIRA_FEATURE_KEYS: MiraFeatureName[] = [
  MiraFeature.Toolbar,
  MiraFeature.ModeSwitch,
  MiraFeature.Formatting,
  MiraFeature.Headings,
  MiraFeature.Lists,
  MiraFeature.Links,
  MiraFeature.Tables,
  MiraFeature.GridTables,
  MiraFeature.Mermaid,
  MiraFeature.Code,
  MiraFeature.Math,
  MiraFeature.Frontmatter,
  MiraFeature.Images,
  MiraFeature.Embeds,
  MiraFeature.Wikilinks,
  MiraFeature.Tags,
  MiraFeature.SlashCommands,
  MiraFeature.BlockControls,
  MiraFeature.SourceMode,
  MiraFeature.LivePreviewMode,
  MiraFeature.PreviewMode,
];

export function miraFeatureConfigKey(feature: MiraFeatureName): string {
  return `markdown.mira.features.${feature}`;
}

export function readMiraFeatureFlags(
  get: <T>(key: string, fallback?: T) => T,
): Partial<Record<MiraFeatureName, boolean>> {
  const flags: Partial<Record<MiraFeatureName, boolean>> = {};
  for (const feature of MIRA_FEATURE_KEYS) {
    flags[feature] = get(miraFeatureConfigKey(feature), true);
  }
  // Split is Lapis-parity deferred.
  flags[MiraFeature.SplitMode] = false;
  return flags;
}

export function createMarkdownConfigurationSchema() {
  const properties: Record<string, unknown> = {
    "editor.defaultViewForNewTabs": {
      title: "Default view for new tabs",
      type: "string",
      enum: ["editing", "reading"],
      default: "editing",
      description: "Whether new Markdown tabs open in editing or reading view.",
    },
    "editor.defaultEditingMode": {
      title: "Default editing mode",
      type: "string",
      enum: ["live-preview", "source"],
      default: "source",
      description: "Default editing mode for new Markdown tabs.",
    },
    "markdown.mira.plugins.mermaid.enabled": {
      title: "Mermaid",
      type: "boolean",
      default: true,
      description: "Enable the Mira Mermaid plugin.",
    },
    "markdown.mira.plugins.ai.enabled": {
      title: "AI",
      type: "boolean",
      default: false,
      description: "Enable the Mira AI plugin (demo run stub).",
    },
    "markdown.mira.plugins.ai.slashCommand": {
      title: "AI slash command",
      type: "boolean",
      default: true,
    },
    "markdown.mira.plugins.ai.blockAction": {
      title: "AI block action",
      type: "boolean",
      default: true,
    },
    "markdown.mira.plugins.ai.label": {
      title: "AI label",
      type: "string",
      default: "Ask AI",
    },
  };

  for (const feature of MIRA_FEATURE_KEYS) {
    properties[miraFeatureConfigKey(feature)] = {
      title: feature,
      type: "boolean",
      default: true,
    };
  }

  return {
    id: MARKDOWN_SCHEMA_ID,
    title: "Markdown",
    type: "object",
    properties,
  } as const;
}
