import { MiraFeature, type MiraFeatureName } from "@lapismd/mira-editor";

export const MARKDOWN_SCHEMA_ID = "markdown";

export const MIRA_EDITOR_SETTING_KEYS = {
  toolbar: "markdown.mira.editor.toolbar.enabled",
  selectionToolbar: "markdown.mira.editor.selectionToolbar.enabled",
  blockToolbar: "markdown.mira.editor.blockToolbar.enabled",
  doodleDividers: "markdown.mira.editor.doodleDividers.enabled",
} as const;

export const MIRA_FEATURE_KEYS: MiraFeatureName[] = [
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

type MarkdownBooleanSettingDescriptor = {
  id: string;
  type: "boolean";
  title: string;
  description?: string;
  default: boolean;
};

type MarkdownStringSettingDescriptor = {
  id: string;
  type: "string";
  title: string;
  description?: string;
  default: string;
};

type MarkdownEnumSettingDescriptor = {
  id: string;
  type: "enum";
  title: string;
  description?: string;
  default: string;
  options: readonly { value: string; label: string }[];
};

export type MarkdownSettingDescriptor =
  | MarkdownBooleanSettingDescriptor
  | MarkdownStringSettingDescriptor
  | MarkdownEnumSettingDescriptor;

const FEATURE_SETTING_DESCRIPTORS: MarkdownBooleanSettingDescriptor[] =
  MIRA_FEATURE_KEYS.map((feature) => ({
    id: miraFeatureConfigKey(feature),
    type: "boolean",
    title: `Feature: ${feature}`,
    default: true,
  }));

export const MARKDOWN_SETTING_DESCRIPTORS: readonly MarkdownSettingDescriptor[] =
  [
    {
      id: "editor.defaultViewForNewTabs",
      type: "enum",
      title: "Default view for new tabs",
      description: "Whether new Markdown tabs open in editing or reading view.",
      default: "editing",
      options: [
        { value: "editing", label: "Editing" },
        { value: "reading", label: "Reading" },
      ],
    },
    {
      id: "editor.defaultEditingMode",
      type: "enum",
      title: "Default editing mode",
      description: "Default editing mode for new Markdown tabs.",
      default: "source",
      options: [
        { value: "source", label: "Source" },
        { value: "live-preview", label: "Live Preview" },
      ],
    },
    {
      id: "outline.autoScrollToCurrentSection",
      type: "boolean",
      title: "Auto-scroll Outline to current section",
      description:
        "Keep the Outline panel aligned with the visible Markdown heading.",
      default: false,
    },
    {
      id: "markdown.mira.plugins.mermaid.enabled",
      type: "boolean",
      title: "Mermaid plugin",
      description: "Enable the Mira Mermaid plugin.",
      default: true,
    },
    {
      id: "markdown.mira.plugins.ai.enabled",
      type: "boolean",
      title: "AI plugin",
      description: "Enable the Mira AI plugin with the configured provider.",
      default: false,
    },
    {
      id: "markdown.mira.plugins.ai.slashCommand",
      type: "boolean",
      title: "AI slash command",
      default: true,
    },
    {
      id: "markdown.mira.plugins.ai.blockAction",
      type: "boolean",
      title: "AI block action",
      default: true,
    },
    {
      id: "markdown.mira.plugins.ai.label",
      type: "string",
      title: "AI label",
      default: "Ask AI",
    },
    {
      id: MIRA_EDITOR_SETTING_KEYS.toolbar,
      type: "boolean",
      title: "Show editor toolbar",
      description: "Show Mira's top toolbar in Source and Live Preview.",
      default: false,
    },
    {
      id: MIRA_EDITOR_SETTING_KEYS.selectionToolbar,
      type: "boolean",
      title: "Show selection toolbar",
      description: "Show formatting actions when editable text is selected.",
      default: true,
    },
    {
      id: MIRA_EDITOR_SETTING_KEYS.blockToolbar,
      type: "boolean",
      title: "Show block type toolbar",
      description: "Add the optional block-type control beside block handles.",
      default: false,
    },
    {
      id: MIRA_EDITOR_SETTING_KEYS.doodleDividers,
      type: "boolean",
      title: "Doodle Dividers",
      description: "Render and edit seeded horizontal rules as doodle dividers.",
      default: false,
    },
    ...FEATURE_SETTING_DESCRIPTORS,
  ];

export function markdownSettingDescriptor(
  id: string,
): MarkdownSettingDescriptor {
  const descriptor = MARKDOWN_SETTING_DESCRIPTORS.find(
    (candidate) => candidate.id === id,
  );
  if (!descriptor) {
    throw new Error(`Unknown Markdown setting: ${id}`);
  }
  return descriptor;
}

export function readMarkdownSetting<T>(
  get: <Value>(key: string, fallback?: Value) => Value,
  id: string,
): T {
  const descriptor = markdownSettingDescriptor(id);
  return get(id, descriptor.default) as T;
}

export function readMiraFeatureFlags(
  get: <T>(key: string, fallback?: T) => T,
): Partial<Record<MiraFeatureName, boolean>> {
  const flags: Partial<Record<MiraFeatureName, boolean>> = {};
  for (const feature of MIRA_FEATURE_KEYS) {
    flags[feature] = readMarkdownSetting<boolean>(
      get,
      miraFeatureConfigKey(feature),
    );
  }
  // Top-toolbar visibility has a dedicated edit-surface setting. Preserve but
  // do not read the superseded markdown.mira.features.toolbar value.
  flags[MiraFeature.Toolbar] = false;
  // Split is outside the Lapis Markdown view contract.
  flags[MiraFeature.SplitMode] = false;
  return flags;
}

export function createMarkdownSettingsFields() {
  return MARKDOWN_SETTING_DESCRIPTORS.map((descriptor) => {
    if (descriptor.type === "enum") {
      return {
        ...descriptor,
        options: descriptor.options.map((option) => ({ ...option })),
      };
    }
    return { ...descriptor };
  });
}

export function createMarkdownConfigurationSchema() {
  const properties = Object.fromEntries(
    MARKDOWN_SETTING_DESCRIPTORS.map((descriptor) => {
      if (descriptor.type === "enum") {
        return [
          descriptor.id,
          {
            title: descriptor.title,
            type: "string",
            enum: descriptor.options.map((option) => option.value),
            default: descriptor.default,
            ...(descriptor.description
              ? { description: descriptor.description }
              : {}),
          },
        ];
      }
      return [
        descriptor.id,
        {
          title: descriptor.title,
          type: descriptor.type,
          default: descriptor.default,
          ...(descriptor.description
            ? { description: descriptor.description }
            : {}),
        },
      ];
    }),
  );

  return {
    id: MARKDOWN_SCHEMA_ID,
    title: "Markdown",
    type: "object",
    properties,
  } as const;
}
