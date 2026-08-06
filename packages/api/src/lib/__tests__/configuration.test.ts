import { describe, expect, it, vi } from "vitest";
import type { App } from "../context.svelte";

vi.mock("../settings.svelte", () => ({
  SettingTab: class SettingTab {},
}));

import {
  Configuration,
  ConfigurationSchema,
  isFlatPrimitiveObjectSchema,
  isPrimitiveArraySchema,
  isRecordObjectSchema,
  isTableCellSchema,
  isArrayOfFlatObjectSchema,
  type ConfigurationSchemaType,
} from "../configuration.svelte";
import { EventDispatcher } from "../events";
import { Vault } from "../storage";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

function createConfigurationApp() {
  const adapter = new InMemoryDataAdapter();
  const vault = new Vault(adapter);
  const workspace = new EventDispatcher<{
    "file-change": [file: { path: string }, event: string];
  }>();

  return {
    adapter,
    app: {
      vault,
      workspace,
    } as App,
  };
}

function registerManifestSchema(schema: ConfigurationSchema) {
  schema.register({
    id: "manifest-only",
    title: "Manifest Only",
    type: "object",
    properties: {
      statusBar: {
        type: "object",
        title: "Status Bar",
        description: "Controls the plugin status bar item.",
        properties: {
          mode: {
            type: "string",
            enum: ["compact", "full"],
            default: "compact",
          },
          palette: {
            type: "array",
            items: {
              type: "string",
              enum: ["blue", "green", "amber"],
              enumDescriptions: ["Blue", "Green", "Amber"],
            },
            default: ["blue"],
            minItems: 1,
          },
          threshold: {
            type: "number",
            minimum: 0,
            maximum: 10,
            default: 5,
          },
        },
      },
    },
  });
}

describe("ConfigurationSchema", () => {
  it("flattens nested object groups into namespaced leaf settings", () => {
    const schema = new ConfigurationSchema();
    registerManifestSchema(schema);

    const definitions = schema
      .getConfiguration()
      .values<ConfigurationSchemaType>();
    const mode = definitions.find(
      (entry) => entry.configId === "manifest-only.statusBar.mode",
    );

    expect(definitions.map((entry) => entry.configId)).toEqual([
      "manifest-only.statusBar.mode",
      "manifest-only.statusBar.palette",
      "manifest-only.statusBar.threshold",
    ]);
    expect(mode?.groupPath).toEqual([
      {
        id: "manifest-only.statusBar",
        title: "Status Bar",
        description: "Controls the plugin status bar item.",
        markdownDescription: undefined,
      },
    ]);
  });

  it("rejects invalid enum arrays and range values with useful messages", () => {
    const schema = new ConfigurationSchema();
    registerManifestSchema(schema);

    expect(
      schema.validateConfigurationOption("manifest-only.statusBar.palette", [
        "blue",
        "green",
      ]),
    ).toEqual(["blue", "green"]);
    expect(() =>
      schema.validateConfigurationOption("manifest-only.statusBar.palette", [
        "violet",
      ]),
    ).toThrow(/manifest-only\.statusBar\.palette\[0\] must be one of/);
    expect(() =>
      schema.validateConfigurationOption(
        "manifest-only.statusBar.threshold",
        20,
      ),
    ).toThrow(/must be at most 10/);
  });

  it("registers integer and flat object-grid leaves without flattening the object value", () => {
    const schema = new ConfigurationSchema();
    schema.register({
      id: "plugin-test",
      title: "Plugin Test",
      type: "object",
      properties: {
        behavior: {
          type: "object",
          title: "Behavior",
          properties: {
            retryCount: {
              type: "integer",
              minimum: 0,
              maximum: 5,
              default: 2,
            },
            limits: {
              type: "object",
              title: "Limits",
              additionalProperties: false,
              properties: {
                maxItems: { type: "number", default: 10 },
                enabled: { type: "boolean", default: true },
              },
              default: { maxItems: 10, enabled: true },
            },
          },
        },
      },
    });

    const definitions = schema
      .getConfiguration()
      .values<ConfigurationSchemaType>();
    expect(definitions.map((entry) => entry.configId)).toEqual([
      "plugin-test.behavior.retryCount",
      "plugin-test.behavior.limits",
    ]);
    expect(
      isFlatPrimitiveObjectSchema(
        definitions.find(
          (entry) => entry.configId === "plugin-test.behavior.limits",
        )! as any,
      ),
    ).toBe(true);
    expect(
      schema.validateConfigurationOption("plugin-test.behavior.retryCount", 3),
    ).toBe(3);
    expect(() =>
      schema.validateConfigurationOption(
        "plugin-test.behavior.retryCount",
        1.5,
      ),
    ).toThrow(/must be an integer/);
  });

  it("validates primitive arrays and enum item label lengths", () => {
    const schema = new ConfigurationSchema();
    schema.register({
      id: "plugin-test",
      title: "Plugin Test",
      type: "object",
      properties: {
        display: {
          type: "object",
          properties: {
            tags: {
              type: "array",
              items: { type: "string" },
              default: ["fixture"],
            },
            mode: {
              type: "string",
              enum: ["compact", "full"],
              enumItemLabels: ["Compact", "Full"],
              default: "compact",
            },
          },
        },
      },
    });

    const tags = schema
      .getConfiguration()
      .values<ConfigurationSchemaType>()
      .find((entry) => entry.configId === "plugin-test.display.tags");
    expect(tags && isPrimitiveArraySchema(tags as any)).toBe(true);
    expect(
      schema.validateConfigurationOption("plugin-test.display.tags", [
        "alpha",
        "beta",
      ]),
    ).toEqual(["alpha", "beta"]);
  });

  it("registers dynamic string map object settings as leaf settings", () => {
    const schema = new ConfigurationSchema();
    schema.register({
      id: "workspace",
      title: "Workspace",
      type: "object",
      properties: {
        editorAssociations: {
          type: "object",
          title: "Editor associations",
          properties: {},
          additionalProperties: {
            type: "string",
            optionsSource: "workspace.editorViews",
            allowUnknownOptions: true,
          },
          default: {},
        },
      },
    });

    const definitions = schema
      .getConfiguration()
      .values<ConfigurationSchemaType>();
    const associations = definitions.find(
      (entry) => entry.configId === "workspace.editorAssociations",
    );

    expect(definitions.map((entry) => entry.configId)).toEqual([
      "workspace.editorAssociations",
    ]);
    expect(associations && isRecordObjectSchema(associations as any)).toBe(
      true,
    );
    expect(
      schema.validateConfigurationOption("workspace.editorAssociations", {
        "*.md": "lapis.markdown.editor",
      }),
    ).toEqual({ "*.md": "lapis.markdown.editor" });
    expect(() =>
      schema.validateConfigurationOption("workspace.editorAssociations", {
        "*.md": 123,
      }),
    ).toThrow(/workspace\.editorAssociations\.\*\.md must be a string/);
  });

  it("rejects unknown keys when additionalProperties is false", () => {
    const schema = new ConfigurationSchema();
    schema.register({
      id: "plugin-test",
      title: "Plugin Test",
      type: "object",
      properties: {
        limits: {
          type: "object",
          properties: {
            enabled: { type: "boolean", default: true },
          },
          additionalProperties: false,
        },
      },
    });

    expect(() =>
      schema.validateConfigurationOption("plugin-test.limits", {
        enabled: true,
        extra: true,
      }),
    ).toThrow(/plugin-test\.limits\.extra is not a supported property/);
  });
});

describe("Configuration", () => {
  it("materializes schema defaults on first load and persists them", async () => {
    const { app, adapter } = createConfigurationApp();
    await app.vault.load();

    const configuration = new Configuration(app, "/.obsidian/app.json");
    registerManifestSchema(configuration.schema);

    await configuration.load();

    expect(
      configuration.getConfiguration().get("manifest-only.statusBar.mode"),
    ).toBe("compact");
    expect(
      configuration.getConfiguration().get("manifest-only.statusBar.palette"),
    ).toEqual(["blue"]);
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toEqual({
      "manifest-only.statusBar.mode": "compact",
      "manifest-only.statusBar.palette": ["blue"],
      "manifest-only.statusBar.threshold": 5,
    });
  });

  it("materializes empty object defaults for dynamic map settings", async () => {
    const { app, adapter } = createConfigurationApp();
    await app.vault.load();

    const configuration = new Configuration(app, "/.obsidian/app.json");
    configuration.schema.register({
      id: "workspace",
      title: "Workspace",
      type: "object",
      properties: {
        editorAssociations: {
          type: "object",
          properties: {},
          additionalProperties: { type: "string" },
          default: {},
        },
      },
    });

    await configuration.load();

    expect(
      configuration.getConfiguration().get("workspace.editorAssociations"),
    ).toEqual({});
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toEqual({
      "workspace.editorAssociations": {},
    });
  });

  it("rejects invalid persisted updates without mutating stored configuration", async () => {
    const { app, adapter } = createConfigurationApp();
    await app.vault.load();

    const configuration = new Configuration(app, "/.obsidian/app.json");
    registerManifestSchema(configuration.schema);

    await configuration.load();
    await configuration.updateConfigurationOption(
      "manifest-only.statusBar.threshold",
      8,
    );

    await expect(
      configuration.updateConfigurationOption(
        "manifest-only.statusBar.threshold",
        99,
      ),
    ).rejects.toThrow(/must be at most 10/);

    expect(
      configuration.getConfiguration().get("manifest-only.statusBar.threshold"),
    ).toBe(8);
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toMatchObject(
      {
        "manifest-only.statusBar.threshold": 8,
      },
    );
  });

  it("stores opaque plugin data under app.json pluginData", async () => {
    const { app, adapter } = createConfigurationApp();
    await app.vault.load();

    const configuration = new Configuration(app, "/.obsidian/app.json");
    await configuration.load();

    await configuration.updatePluginData("community-plugin", {
      enabled: true,
      filters: ["active"],
    });

    expect(configuration.getPluginData("community-plugin")).toEqual({
      enabled: true,
      filters: ["active"],
    });
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toEqual({
      pluginData: {
        "community-plugin": {
          enabled: true,
          filters: ["active"],
        },
      },
    });
  });

  it("emits plugin-data updates when app.json is externally reloaded", async () => {
    const { app, adapter } = createConfigurationApp();
    await app.vault.load();

    const configuration = new Configuration(app, "/.obsidian/app.json");
    await configuration.load();

    const events: Array<{
      pluginId: string;
      value: unknown;
      prev: unknown;
      origin: string;
    }> = [];
    configuration.on("plugin-data-updated", (event) => {
      events.push(event);
    });

    await app.vault.mkpath("/.obsidian");
    await app.vault.create(
      "/.obsidian/app.json",
      JSON.stringify(
        {
          pluginData: {
            alpha: { enabled: true },
            beta: { threshold: 2 },
          },
        },
        null,
        2,
      ),
    );

    await configuration.reloadFromDisk();

    expect(configuration.getPluginData("alpha")).toEqual({ enabled: true });
    expect(configuration.getPluginData("beta")).toEqual({ threshold: 2 });
    expect(events).toEqual([
      {
        pluginId: "alpha",
        value: { enabled: true },
        prev: undefined,
        origin: "external-reload",
      },
      {
        pluginId: "beta",
        value: { threshold: 2 },
        prev: undefined,
        origin: "external-reload",
      },
    ]);
  });

  it("materializes and persists workspace file explorer auto-reveal default", async () => {
    const { app, adapter } = createConfigurationApp();
    await app.vault.load();

    const configuration = new Configuration(app, "/.obsidian/app.json");
    configuration.schema.register({
      title: "Workspace",
      type: "object",
      properties: {
        "workspace.fileExplorer.autoRevealCurrentFile": {
          type: "boolean",
          default: false,
        },
      },
    });

    await configuration.load();

    expect(
      configuration
        .getConfiguration()
        .get("workspace.fileExplorer.autoRevealCurrentFile"),
    ).toBe(false);
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toEqual({
      "workspace.fileExplorer.autoRevealCurrentFile": false,
    });

    await configuration.updateConfigurationOption(
      "workspace.fileExplorer.autoRevealCurrentFile",
      true,
    );
    await configuration.reloadFromDisk();

    expect(
      configuration
        .getConfiguration()
        .get("workspace.fileExplorer.autoRevealCurrentFile"),
    ).toBe(true);
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toEqual({
      "workspace.fileExplorer.autoRevealCurrentFile": true,
    });
  });
});

describe("object-array schema helpers", () => {
  const flatObjectArray = {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      properties: {
        pattern: { type: "string" },
        mode: { type: "string", enum: ["include", "exclude"] },
        enabled: { type: "boolean" },
        priority: { type: "integer" },
      },
    },
  } as const;

  it("accepts arrays of flat object rows", () => {
    expect(isArrayOfFlatObjectSchema(flatObjectArray)).toBe(true);
    expect(isTableCellSchema({ type: "string", enum: ["a", "b"] })).toBe(true);
    expect(
      isTableCellSchema({
        type: "string",
        optionsSource: "workspace.editorViews",
      }),
    ).toBe(true);
  });

  it("rejects nested object, nested array, and free-form object rows", () => {
    expect(
      isArrayOfFlatObjectSchema({
        type: "array",
        items: {
          type: "object",
          properties: {
            nested: {
              type: "object",
              properties: { x: { type: "string" } },
            },
          },
        },
      }),
    ).toBe(false);

    expect(
      isArrayOfFlatObjectSchema({
        type: "array",
        items: {
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } },
          },
        },
      }),
    ).toBe(false);

    expect(
      isArrayOfFlatObjectSchema({
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
          properties: { name: { type: "string" } },
        },
      }),
    ).toBe(false);
  });

  it("rejects specialized string formats as table cells", () => {
    expect(isTableCellSchema({ type: "string", format: "color" })).toBe(false);
    expect(isTableCellSchema({ type: "string", format: "date" })).toBe(false);
    expect(
      isTableCellSchema({ type: "string", editPresentation: "multilineText" }),
    ).toBe(false);
    expect(isTableCellSchema({ type: "string", format: "email" })).toBe(true);
  });

  it("validates array-of-object configuration values", () => {
    const schema = new ConfigurationSchema();
    schema.register({
      id: "plugin-test",
      title: "Plugin Test",
      type: "object",
      properties: {
        rules: flatObjectArray,
      },
    });

    expect(
      schema.validateConfigurationOption("plugin-test.rules", [
        { pattern: "*.md", mode: "include", enabled: true, priority: 1 },
      ]),
    ).toEqual([
      { pattern: "*.md", mode: "include", enabled: true, priority: 1 },
    ]);
  });
});
