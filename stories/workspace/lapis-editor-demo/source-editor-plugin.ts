import { json } from "@codemirror/lang-json";
import {
  Plugin,
  SourceTextFileView,
  type App,
  type PluginManifest,
} from "@lapis-notes/api";
import { markupEditor } from "@lapis-notes/api/editor";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { WorkspaceSettingField } from "@lapismd/design-core/workspace/settings";

const SOURCE_EDITOR_SETTING_FIELDS = [
  {
    id: "editor.alwaysFocusNewTabs",
    type: "boolean",
    title: "Always focus new tabs",
    description:
      "Switch to newly created tabs immediately. Turn this off to create them in the background.",
    default: false,
  },
  {
    id: "editor.display.showLineNumbers",
    type: "boolean",
    title: "Show line numbers",
    description: "Show line numbers in the editor gutter.",
    default: true,
  },
  {
    id: "editor.display.foldIndent",
    type: "boolean",
    title: "Code folding",
    description:
      "Show the fold gutter for language-defined ranges such as headings and objects.",
    default: true,
  },
  {
    id: "editor.display.wrapLines",
    type: "boolean",
    title: "Wrap lines",
    description: "Wrap long source lines to the editor width.",
    default: true,
  },
  {
    id: "editor.display.showIndentationGuides",
    type: "boolean",
    title: "Show indentation guides",
    description: "Show vertical guides for indented source.",
    default: true,
  },
  {
    id: "editor.behaviour.spellCheck",
    type: "boolean",
    title: "Spellcheck",
    description: "Use the browser spellchecker in source editors.",
    default: true,
  },
  {
    id: "editor.behaviour.indentUsingTabs",
    type: "boolean",
    title: "Indent using tabs",
    description: "Turn this off to insert spaces when indenting.",
    default: true,
  },
  {
    id: "editor.behaviour.indentVisualWidth",
    type: "integer",
    title: "Indent width",
    description: "Number of columns used by a tab or space indent.",
    minimum: 2,
    maximum: 8,
    default: 4,
  },
] satisfies readonly WorkspaceSettingField[];

const EDITOR_SCHEMA = {
  id: "editor",
  title: "Editor",
  type: "object",
  properties: Object.fromEntries(
    SOURCE_EDITOR_SETTING_FIELDS.map(({ id, ...definition }) => [
      id,
      definition,
    ]),
  ),
} as const;

const SOURCE_EDITOR_MANIFEST: PluginManifest = {
  id: "lapis-source-editor",
  name: "Lapis Source Editor",
  author: "Lapis Notes",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description:
    "Source-only text and JSON editing for the demo. Markdown is owned by @lapis-notes/markdown when enabled.",
};

const VIEW_DEFINITIONS = [
  {
    type: "text",
    label: "Text",
    extensions: ["txt", "text"],
    patterns: [".txt", ".text", "*.txt", "*.text"],
    createExtension: () => markupEditor({ language: "text" }),
  },
  {
    type: "json",
    label: "JSON",
    extensions: ["json", "data"],
    patterns: [".json", ".data", "*.json", "*.data"],
    createExtension: () => markupEditor({ language: "json" }, json()),
  },
] as const;

export class SourceEditorDemoPlugin extends Plugin {
  constructor(app: App) {
    super(app, SOURCE_EDITOR_MANIFEST);
  }

  async onload(): Promise<void> {
    this.app.configuration.schema.register(EDITOR_SCHEMA);
    this.register(() => {
      this.app.configuration.schema.unregister(EDITOR_SCHEMA);
    });

    const { controller } = getWorkspaceHostBinding(this.app.workspace);
    this.register(
      controller.registerSettingsSection({
        id: "lapis-source-editor",
        title: "Editor",
        description:
          "Source editor behavior shared by Markdown, text, and JSON files.",
        icon: "file-pen-line",
        order: 20,
        navigationGroupId: "core-plugins",
        sourcePluginId: this.id,
        fields: SOURCE_EDITOR_SETTING_FIELDS.map((field) => ({ ...field })),
      }),
    );

    for (const definition of VIEW_DEFINITIONS) {
      this.registerView(
        definition.type,
        (leaf) =>
          new SourceTextFileView(leaf, definition.type, definition.extensions),
      );
      this.registerEditorView({
        id: definition.type,
        viewType: definition.type,
        label: definition.label,
        description: `${definition.label} source editor`,
        filenamePatterns: [...definition.patterns],
        priority: "default",
      });
      this.registerExtensions([...definition.extensions], definition.type);
      this.registerEditorExtension(
        definition.createExtension(),
        definition.type,
      );
    }

    await this.app.configuration.materializeSchemaDefaults();
  }
}
