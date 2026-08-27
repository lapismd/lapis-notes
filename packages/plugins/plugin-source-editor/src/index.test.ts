import { describe, expect, it, vi } from "vitest";

vi.mock("@lapis-notes/api", () => {
  class MockPlugin {
    readonly unloaders = new Set<() => void>();
    readonly id: string;

    constructor(
      readonly app: any,
      readonly manifest: any,
    ) {
      this.id = manifest.id;
    }

    register(callback: () => void): void {
      this.unloaders.add(callback);
    }

    unload(): void {
      this.unloaders.forEach((callback) => callback());
    }

    registerView(type: string, creator: unknown): void {
      this.app.registerView(type, creator);
      this.register(() => this.app.unregisterView(type, creator));
    }

    registerEditorView(config: unknown): void {
      this.app.registerEditorView(config);
    }

    registerExtensions(extensions: string[], viewType: string): void {
      this.app.registerExtensions(extensions, viewType);
      this.register(() => this.app.unregisterExtensions(extensions, viewType));
    }

    registerEditorExtension(extension: unknown, viewType: string): void {
      this.app.registerEditorExtension(extension, viewType);
      this.register(() =>
        this.app.unregisterEditorExtension(extension, viewType),
      );
    }
  }

  return {
    Plugin: MockPlugin,
    SourceTextFileView: class MockSourceTextFileView {
      constructor(
        readonly leaf: unknown,
        readonly viewType: string,
        readonly extensions: readonly string[],
      ) {}
    },
  };
});

vi.mock("@lapis-notes/api/editor", () => ({
  markupEditor: vi.fn((options, language) => ({ options, language })),
}));

vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: (workspace: any) => ({
    controller: workspace.controller,
  }),
}));

vi.mock("@codemirror/lang-json", () => ({
  json: vi.fn(() => Symbol("json-language")),
}));

vi.mock("@codemirror/lang-yaml", () => ({
  yaml: vi.fn(() => Symbol("yaml-language")),
}));

import {
  SOURCE_EDITOR_SCHEMA,
  SOURCE_EDITOR_SETTING_FIELDS,
  SOURCE_EDITOR_VIEW_DEFINITIONS,
  SourceEditorPlugin,
} from "./index";

function createMockApp() {
  const disposeSettings = vi.fn();
  return {
    configuration: {
      schema: {
        register: vi.fn(),
        unregister: vi.fn(),
      },
      materializeSchemaDefaults: vi.fn().mockResolvedValue(undefined),
    },
    workspace: {
      controller: {
        registerSettingsSection: vi.fn(() => disposeSettings),
      },
    },
    registerView: vi.fn(),
    unregisterView: vi.fn(),
    registerEditorView: vi.fn(),
    registerExtensions: vi.fn(),
    unregisterExtensions: vi.fn(),
    registerEditorExtension: vi.fn(),
    unregisterEditorExtension: vi.fn(),
    disposeSettings,
  } as any;
}

describe("SourceEditorPlugin", () => {
  it("declares text, JSON, YAML, and YML source associations", () => {
    expect(
      SOURCE_EDITOR_VIEW_DEFINITIONS.map(({ type, extensions, patterns }) => ({
        type,
        extensions,
        patterns,
      })),
    ).toEqual([
      {
        type: "text",
        extensions: ["txt", "text"],
        patterns: [".txt", ".text", "*.txt", "*.text"],
      },
      {
        type: "json",
        extensions: ["json", "data"],
        patterns: [".json", ".data", "*.json", "*.data"],
      },
      {
        type: "yaml",
        extensions: ["yaml", "yml"],
        patterns: [".yaml", ".yml", "*.yaml", "*.yml"],
      },
    ]);
  });

  it("registers the shared schema, settings, views, and language extensions", async () => {
    const app = createMockApp();
    const plugin = new SourceEditorPlugin(app);

    await plugin.onload();

    expect(plugin.manifest).toMatchObject({
      id: "lapis-source-editor",
      name: "Source Editor",
    });
    expect(app.configuration.schema.register).toHaveBeenCalledWith(
      SOURCE_EDITOR_SCHEMA,
    );
    expect(
      app.workspace.controller.registerSettingsSection,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "lapis-source-editor",
        sourcePluginId: "lapis-source-editor",
        fields: SOURCE_EDITOR_SETTING_FIELDS,
      }),
    );
    expect(app.registerView).toHaveBeenCalledTimes(3);
    expect(app.registerEditorView).toHaveBeenCalledWith({
      id: "yaml",
      viewType: "yaml",
      label: "YAML",
      description: "YAML source editor",
      filenamePatterns: [".yaml", ".yml", "*.yaml", "*.yml"],
      priority: "default",
    });
    expect(app.registerExtensions).toHaveBeenCalledWith(
      ["yaml", "yml"],
      "yaml",
    );
    expect(app.registerEditorExtension).toHaveBeenCalledTimes(3);
    expect(app.configuration.materializeSchemaDefaults).toHaveBeenCalledOnce();

    plugin.unload();
    expect(app.configuration.schema.unregister).toHaveBeenCalledWith(
      SOURCE_EDITOR_SCHEMA,
    );
    expect(app.disposeSettings).toHaveBeenCalledOnce();
    expect(app.unregisterExtensions).toHaveBeenCalledWith(
      ["yaml", "yml"],
      "yaml",
    );
  });
});
