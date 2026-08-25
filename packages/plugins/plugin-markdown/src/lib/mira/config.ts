import { MiraFeature, type MiraFeatureName } from "@lapismd/mira-editor";
import type {
  WorkspaceSettingsSection,
  WorkspaceToggleTableSettingGroup,
} from "@lapismd/design-core/workspace";

type PublicWorkspaceSettingField = NonNullable<
  WorkspaceSettingsSection["fields"]
>[number];
type PublicWorkspaceBooleanSetting =
  WorkspaceToggleTableSettingGroup["fields"][number];

export const MARKDOWN_SCHEMA_ID = "markdown";

export const MIRA_EDITOR_SETTING_KEYS = {
  toolbar: "markdown.mira.editor.toolbar.enabled",
  selectionToolbar: "markdown.mira.editor.selectionToolbar.enabled",
  blockToolbar: "markdown.mira.editor.blockToolbar.enabled",
  doodleDividers: "markdown.mira.editor.doodleDividers.enabled",
} as const;

export const MIRA_DOCUMENT_SETTING_KEYS = {
  frontmatterDefaultOpen: "markdown.mira.frontmatter.defaultOpen",
  outlineNavigation: "markdown.mira.features.outline-navigation",
} as const;

export const MIRA_FEATURE_KEYS = [
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
] as const satisfies readonly MiraFeatureName[];

type MarkdownMiraFeature = (typeof MIRA_FEATURE_KEYS)[number];

type MarkdownMiraFeatureMetadata = {
  title: string;
  description: string;
};

export const MIRA_FEATURE_METADATA = {
  [MiraFeature.ModeSwitch]: {
    title: "Mode switch",
    description: "Show Mira's mode switch when a mode selector is available.",
  },
  [MiraFeature.Formatting]: {
    title: "Formatting",
    description:
      "Enable bold, italic, strikethrough, and inline-code authoring actions.",
  },
  [MiraFeature.Headings]: {
    title: "Headings",
    description: "Enable heading actions and heading authoring commands.",
  },
  [MiraFeature.Lists]: {
    title: "Lists",
    description: "Enable list, task, quote, and callout authoring actions.",
  },
  [MiraFeature.Links]: {
    title: "Links",
    description: "Enable link authoring actions and commands.",
  },
  [MiraFeature.Tables]: {
    title: "Tables",
    description: "Enable pipe-table authoring actions and commands.",
  },
  [MiraFeature.GridTables]: {
    title: "Grid tables",
    description: "Enable grid-table authoring actions and commands.",
  },
  [MiraFeature.Mermaid]: {
    title: "Mermaid",
    description:
      "Enable Mermaid authoring when the Mermaid plugin setting is also enabled.",
  },
  [MiraFeature.Code]: {
    title: "Code",
    description: "Enable inline-code and fenced-code authoring actions.",
  },
  [MiraFeature.Math]: {
    title: "Math",
    description: "Enable inline and block-math authoring actions.",
  },
  [MiraFeature.Frontmatter]: {
    title: "Frontmatter",
    description: "Enable Mira's rendered frontmatter controls.",
  },
  [MiraFeature.Images]: {
    title: "Images",
    description: "Enable image insertion and image block actions.",
  },
  [MiraFeature.Embeds]: {
    title: "Embeds",
    description: "Enable Mira's embedded-content capability.",
  },
  [MiraFeature.Wikilinks]: {
    title: "Wiki links",
    description: "Enable Mira's wiki-link capability.",
  },
  [MiraFeature.Tags]: {
    title: "Tags",
    description: "Enable Mira's tag capability.",
  },
  [MiraFeature.SlashCommands]: {
    title: "Slash commands",
    description: "Enable the slash menu and registered slash commands.",
  },
  [MiraFeature.BlockControls]: {
    title: "Block controls",
    description:
      "Enable block handles, movement controls, and context actions.",
  },
  [MiraFeature.SourceMode]: {
    title: "Source mode",
    description: "Make Source mode available to Mira mode controls.",
  },
  [MiraFeature.LivePreviewMode]: {
    title: "Live Preview mode",
    description: "Make Live Preview mode available to Mira mode controls.",
  },
  [MiraFeature.PreviewMode]: {
    title: "Reading mode",
    description: "Make Reading mode available to Mira mode controls.",
  },
} as const satisfies Record<MarkdownMiraFeature, MarkdownMiraFeatureMetadata>;

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

const FEATURE_SETTING_DESCRIPTORS: MarkdownBooleanSettingDescriptor[] = [
  ...MIRA_FEATURE_KEYS.map(
    (feature): MarkdownBooleanSettingDescriptor => ({
      id: miraFeatureConfigKey(feature),
      type: "boolean" as const,
      ...MIRA_FEATURE_METADATA[feature],
      default: true,
    }),
  ),
  {
    id: MIRA_DOCUMENT_SETTING_KEYS.outlineNavigation,
    type: "boolean",
    title: "Outline navigation",
    description: "Show Mira's floating heading navigation in Reading view.",
    default: true,
  },
];

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
      id: MIRA_DOCUMENT_SETTING_KEYS.frontmatterDefaultOpen,
      type: "boolean",
      title: "Expand Properties by default",
      description:
        "Start frontmatter expanded when opening Live Preview or Reading view.",
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
      description:
        "Render and edit seeded horizontal rules as doodle dividers.",
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

export function createMarkdownSettingsFields(): PublicWorkspaceSettingField[] {
  const featureIds = new Set(
    FEATURE_SETTING_DESCRIPTORS.map((descriptor) => descriptor.id),
  );
  const fields = MARKDOWN_SETTING_DESCRIPTORS.filter(
    (descriptor) => !featureIds.has(descriptor.id),
  ).map((descriptor): PublicWorkspaceSettingField => {
    if (descriptor.type === "enum") {
      return {
        ...descriptor,
        options: descriptor.options.map((option) => ({ ...option })),
      };
    }
    return { ...descriptor };
  });

  const featureFields: PublicWorkspaceBooleanSetting[] =
    FEATURE_SETTING_DESCRIPTORS.map((descriptor) => ({ ...descriptor }));
  fields.push({
    id: "markdown.mira.features",
    type: "group",
    presentation: "toggle-table",
    title: "Features",
    description:
      "Choose which Mira capabilities are available in Markdown editing and preview surfaces.",
    fields: featureFields,
  });

  return fields;
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
