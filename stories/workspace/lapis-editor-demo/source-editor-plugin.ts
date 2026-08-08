import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import {
  Plugin,
  SourceTextFileView,
  type App,
  type PluginManifest,
} from "@lapis-notes/api";
import { markupEditor } from "@lapis-notes/api/editor";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";

const EDITOR_SCHEMA = {
  id: "editor",
  title: "Editor",
  type: "object",
  properties: {
    "editor.display.showLineNumbers": {
      title: "Show line numbers",
      description: "Show line numbers in the editor gutter.",
      type: "boolean",
      default: true,
    },
    "editor.display.foldIndent": {
      title: "Fold indent",
      description: "Allow indented regions to be folded.",
      type: "boolean",
      default: true,
    },
    "editor.display.wrapLines": {
      title: "Wrap lines",
      description: "Wrap long source lines to the editor width.",
      type: "boolean",
      default: true,
    },
    "editor.display.showIndentationGuides": {
      title: "Show indentation guides",
      description: "Show vertical guides for indented source.",
      type: "boolean",
      default: true,
    },
    "editor.behaviour.spellCheck": {
      title: "Spellcheck",
      description: "Use the browser spellchecker in source editors.",
      type: "boolean",
      default: true,
    },
    "editor.behaviour.indentUsingTabs": {
      title: "Indent using tabs",
      description: "Turn this off to insert spaces when indenting.",
      type: "boolean",
      default: true,
    },
    "editor.behaviour.indentVisualWidth": {
      title: "Indent width",
      description: "Number of columns used by a tab or space indent.",
      type: "integer",
      minimum: 2,
      maximum: 8,
      default: 4,
    },
  },
} as const;

const SOURCE_EDITOR_MANIFEST: PluginManifest = {
  id: "lapis-source-editor",
  name: "Lapis Source Editor",
  author: "Lapis Notes",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "Source-only Markdown, text, and JSON editing for the demo.",
};

const VIEW_DEFINITIONS = [
  {
    type: "markdown",
    label: "Markdown",
    extensions: ["md", "markdown"],
    patterns: [".md", ".markdown", "*.md", "*.markdown"],
    createExtension: () => markupEditor(markdown()),
  },
  {
    type: "text",
    label: "Text",
    extensions: ["txt", "text"],
    patterns: [".txt", ".text", "*.txt", "*.text"],
    createExtension: () => markupEditor(),
  },
  {
    type: "json",
    label: "JSON",
    extensions: ["json", "data"],
    patterns: [".json", ".data", "*.json", "*.data"],
    createExtension: () => markupEditor(json()),
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
        fields: [
          {
            id: "editor.display.showLineNumbers",
            type: "boolean",
            title: "Show line numbers",
            default: true,
          },
          {
            id: "editor.display.foldIndent",
            type: "boolean",
            title: "Fold indent",
            default: true,
          },
          {
            id: "editor.display.wrapLines",
            type: "boolean",
            title: "Wrap lines",
            default: true,
          },
          {
            id: "editor.display.showIndentationGuides",
            type: "boolean",
            title: "Show indentation guides",
            default: true,
          },
          {
            id: "editor.behaviour.spellCheck",
            type: "boolean",
            title: "Spellcheck",
            default: true,
          },
          {
            id: "editor.behaviour.indentUsingTabs",
            type: "boolean",
            title: "Indent using tabs",
            default: true,
          },
          {
            id: "editor.behaviour.indentVisualWidth",
            type: "integer",
            title: "Indent width",
            minimum: 2,
            maximum: 8,
            default: 4,
          },
        ],
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
