import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigurationOptionSourceRegistry } from "../configuration-option-source-registry";
import { Configuration } from "../configuration.svelte";
import type { App } from "../context.svelte";
import { ContextKeyService } from "../context-keys.svelte";
import { EventDispatcher } from "../events";
import { Plugin } from "../plugin";
import { SearchDocumentProviderRegistry } from "../search-document-provider";
import { AppToolRegistry } from "../agent-tools";
import {
  AppSkillRegistry,
  AppSlashCommandRegistry,
} from "../agent-skills";
import { AppResultViewRegistry } from "../agent-result-views";
import { IndexProjectionRegistry, MemoryAppDatabase, Vault } from "../storage";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

vi.mock("../settings.svelte", () => ({
  SettingTab: class SettingTab {},
}));

function createPluginApp() {
  const adapter = new InMemoryDataAdapter();
  const vault = new Vault(adapter);
  const appDatabase = new MemoryAppDatabase("plugin-test");
  const workspace = new EventDispatcher<{
    "file-change": [file: { path: string }, event: string];
  }>() as EventDispatcher<{
    "file-change": [file: { path: string }, event: string];
  }> & {
    editorViews: Map<string, unknown>;
    registerEditorView: (contribution: { id: string }) => () => void;
    registerView: ReturnType<typeof vi.fn>;
    unregisterView: ReturnType<typeof vi.fn>;
    registerSidebarView: ReturnType<typeof vi.fn>;
    unregisterSidebarView: ReturnType<typeof vi.fn>;
  };
  workspace.editorViews = new Map<string, unknown>();
  workspace.registerEditorView = (contribution) => {
    workspace.editorViews.set(contribution.id, contribution);
    return () => workspace.editorViews.delete(contribution.id);
  };
  workspace.registerView = vi.fn();
  workspace.unregisterView = vi.fn();
  workspace.registerSidebarView = vi.fn();
  workspace.unregisterSidebarView = vi.fn();

  const commands = {
    registerCommand: vi.fn(),
    unregisterCommand: vi.fn(),
  };

  const releaseMetadataSnapshotLease = vi.fn();
  const acquireMetadataSnapshotLease = vi.fn(async () => ({
    snapshot: {
      fileCache: {},
      metadataCache: {},
      resolvedLinks: {},
      unresolvedLinks: {},
    },
    release: releaseMetadataSnapshotLease,
  }));

  const app = {
    vault,
    appDatabase,
    contextKeys: new ContextKeyService(),
    telemetry: {
      measureAsync: async <T>(
        _name: string,
        callback: (span: { setAttribute(): void }) => Promise<T>,
      ) => callback({ setAttribute() {} }),
      measure: <T>(
        _name: string,
        callback: (span: { setAttribute(): void }) => T,
      ) => callback({ setAttribute() {} }),
    },
    workspace,
    commands,
    configurationOptionSources: new ConfigurationOptionSourceRegistry(),
    searchDocumentProviders: new SearchDocumentProviderRegistry(),
    indexProjections: new IndexProjectionRegistry(),
    metadataCache: {
      getFileCache: () => null,
      acquireMetadataSnapshotLease,
    },
    plugins: { plugins: new Map() },
    agentTools: new AppToolRegistry(),
    agentSkills: new AppSkillRegistry(),
    agentSlashCommands: new AppSlashCommandRegistry(),
    agentResultViews: new AppResultViewRegistry(),
  } as unknown as App;

  const configuration = new Configuration(app, "/.obsidian/app.json");
  (app as App & { configuration: Configuration }).configuration = configuration;

  return {
    adapter,
    app: app as App & { configuration: Configuration },
    acquireMetadataSnapshotLease,
    releaseMetadataSnapshotLease,
  };
}

class TestPlugin extends Plugin {
  onload() {}
}

beforeEach(() => {
  const fakeElement = {
    detach() {},
    appendChild() {},
    removeChild() {},
    createDiv() {
      return fakeElement;
    },
  } as unknown as HTMLDivElement;

  globalThis.createDiv = () => fakeElement;
});

describe("Plugin data persistence", () => {
  it("leases the compatibility metadata snapshot for community plugins", async () => {
    const {
      app,
      acquireMetadataSnapshotLease,
      releaseMetadataSnapshotLease,
    } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "legacy-metadata-plugin",
      name: "Legacy Metadata Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({ source: "community" });

    await plugin.enable();
    expect(acquireMetadataSnapshotLease).toHaveBeenCalledTimes(1);
    await plugin.disable();
    expect(releaseMetadataSnapshotLease).toHaveBeenCalledTimes(1);
  });

  it("skips snapshot materialization for query-native plugin manifests", async () => {
    const { app, acquireMetadataSnapshotLease } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "query-metadata-plugin",
      name: "Query Metadata Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
      lapis: {
        manifestVersion: 1,
        database: { metadataAccess: "queries" },
      },
    });
    plugin.configureRuntime({ source: "community" });

    await plugin.enable();
    expect(acquireMetadataSnapshotLease).not.toHaveBeenCalled();
    await plugin.disable();
  });

  it("registers and disposes an agent tool with immutable owner identity", () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "fixture",
      name: "Fixture",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({ source: "core", provenance: "bundled" });
    plugin.load();

    const registration = plugin.registerAgentTool({
      name: "fixture_read",
      description: "Read fixture data.",
      inputSchema: { type: "object", properties: {} },
      effect: "read",
      async execute() {
        return { content: [{ type: "text", text: "fixture" }] };
      },
    });

    expect(app.agentTools.get("fixture_read")).toMatchObject({
      registrationId: registration.id,
      owner: {
        pluginId: "fixture",
        source: "core",
        provenance: "bundled",
      },
    });

    plugin.unload();
    expect(app.agentTools.get("fixture_read")).toBeUndefined();
  });

  it("registers and disposes a result view and rejects duplicate keys", () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "fixture",
      name: "Fixture",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({ source: "core", provenance: "bundled" });
    plugin.load();

    const component = (() => null) as never;
    plugin.registerAgentResultView({
      tool: "notes_search",
      component,
    });
    expect(app.agentResultViews.getByTool("notes_search")?.ownerPluginId).toBe(
      "fixture",
    );
    expect(() =>
      plugin.registerAgentResultView({
        tool: "notes_search",
        component,
      }),
    ).toThrow(/already registered/i);
    expect(() =>
      plugin.registerAgentResultView({
        component,
      }),
    ).toThrow(/exactly one/i);

    plugin.unload();
    expect(app.agentResultViews.getByTool("notes_search")).toBeUndefined();
  });

  it("registers and disposes skill sources and composer slash commands", () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "fixture",
      name: "Fixture",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({ source: "core", provenance: "bundled" });
    plugin.load();

    plugin.registerAgentSkillRoot("skills");
    plugin.registerAgentSkillDirectory("skills/research-notes");
    plugin.registerAgentSkill({
      name: "review-note",
      description: "Review the active note.",
      instructions: "Read the note and list issues.",
    });
    plugin.registerAgentSlashCommand({
      name: "open-daily-note",
      description: "Open today's daily note.",
      dispatch: {
        kind: "host",
        execute() {},
      },
    });

    expect(app.agentSkills.list()).toHaveLength(3);
    expect(app.agentSlashCommands.get("open-daily-note")?.ownerPluginId).toBe(
      "fixture",
    );
    expect(app.commands.registerCommand).not.toHaveBeenCalled();
    expect(() => plugin.registerAgentSkillRoot("../escape")).toThrow(
      /traversal/u,
    );
    expect(() => plugin.registerAgentSkillRoot("/abs")).toThrow(
      /extension root/u,
    );

    plugin.unload();
    expect(app.agentSkills.list()).toEqual([]);
    expect(app.agentSlashCommands.get("open-daily-note")).toBeUndefined();
  });

  it("registers and disposes a ViewAccess command with the plugin prefix", () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "fixture",
      name: "Fixture",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.load();

    plugin.registerSidebarView(
      "fixture-view",
      () => ({}) as never,
      { side: "left" },
      {
        kind: "command",
        command: {
          id: "open-fixture",
          name: "Open Fixture",
          callback: () => {},
        },
      },
    );

    expect(app.workspace.registerView).toHaveBeenCalledWith(
      "fixture-view",
      expect.any(Function),
    );
    expect(app.workspace.registerSidebarView).toHaveBeenCalledWith(
      "fixture-view",
      { side: "left" },
    );
    expect(app.commands.registerCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "fixture:open-fixture",
        name: "Fixture: Open Fixture",
      }),
    );

    plugin.unload();

    expect(app.commands.unregisterCommand).toHaveBeenCalledWith(
      "fixture:open-fixture",
    );
    expect(app.workspace.unregisterSidebarView).toHaveBeenCalledWith(
      "fixture-view",
    );
    expect(app.workspace.unregisterView).toHaveBeenCalledWith("fixture-view");
  });

  it("keeps file, internal, and alias registrations out of the palette", () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "fixture",
      name: "Fixture",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.load();

    plugin.registerView("file", () => ({}) as never, { kind: "file" });
    plugin.registerView("landing", () => ({}) as never, {
      kind: "internal",
    });
    plugin.registerView("legacy", () => ({}) as never, {
      kind: "alias",
      canonicalViewType: "file",
    });

    expect(app.commands.registerCommand).not.toHaveBeenCalled();
  });

  it("owns search-document provider registration for its lifecycle", () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "fixture",
      name: "Fixture",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.load();

    const registration = plugin.registerSearchDocumentProvider("document", {
      matches: (file) => file.extension === "fixture",
      extract: ({ content }) => ({ content }),
    });

    expect(registration.id).toBe("fixture:document");
    expect(app.searchDocumentProviders.getAll()).toHaveLength(1);

    plugin.unload();

    expect(app.searchDocumentProviders.getAll()).toHaveLength(0);
  });

  it("registers index projections with plugin-owned cleanup", async () => {
    const { app } = createPluginApp();
    const register = vi.fn().mockResolvedValue(undefined);
    const unregister = vi.fn().mockResolvedValue(undefined);
    Object.assign(app.appDatabase, {
      registerProjectionDefinition: register,
      unregisterProjectionDefinition: unregister,
      queryIndexedMetadata: vi.fn().mockResolvedValue([]),
    });
    const plugin = new TestPlugin(app, {
      id: "tasks",
      name: "Tasks",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.load();
    const handle = plugin.registerIndexProjection({
      id: "task",
      version: 1,
      fields: { title: { type: "string", indexed: true } },
      project: () => ({ rows: [] }),
    });
    expect(handle.id).toBe("tasks/task");
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ projectionId: "tasks/task", ownerPluginId: "tasks" }),
    );
    expect(() =>
      plugin.registerIndexProjection({
        id: "tasks/task",
        version: 1,
        fields: { title: { type: "string", indexed: true } },
        project: () => ({ rows: [] }),
      }),
    ).toThrow(/\//);
    plugin.unload();
    expect(app.indexProjections.get("tasks/task")).toBeUndefined();
    expect(unregister).toHaveBeenCalledWith("tasks/task");
  });

  it("registers editor-view metadata with plugin-owned cleanup", () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "editor-plugin",
      name: "Editor Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.load();

    plugin.registerEditorView({
      id: "editor-plugin.fixture",
      label: "Fixture",
      filenamePatterns: ["*.fixture"],
    });

    expect(
      app.workspace.editorViews.get("editor-plugin.fixture"),
    ).toMatchObject({
      id: "editor-plugin.fixture",
      pluginId: "editor-plugin",
      source: "plugin",
    });

    plugin.unload();

    expect(
      app.workspace.editorViews.get("editor-plugin.fixture"),
    ).toBeUndefined();
  });

  it("registers configuration option sources with plugin-owned cleanup", async () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "markdown-lint",
      name: "Markdown Lint",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.load();

    const registration = plugin.registerConfigurationOptionSource("ruleIds", {
      getOptions: () => [{ value: "MD001", label: "Heading levels" }],
    });

    expect(registration.id).toBe("markdown-lint.ruleIds");
    expect(app.configurationOptionSources.has("markdown-lint.ruleIds")).toBe(
      true,
    );
    await expect(
      app.configurationOptionSources.resolve("markdown-lint.ruleIds", {
        app,
        schema: { type: "string" },
      }),
    ).resolves.toEqual([
      {
        value: "MD001",
        label: "Heading levels",
        source: "markdown-lint.ruleIds",
      },
    ]);

    plugin.unload();

    expect(app.configurationOptionSources.has("markdown-lint.ruleIds")).toBe(
      false,
    );
  });

  it("emits registry changes when a plugin invalidates its option source", () => {
    const { app } = createPluginApp();
    const plugin = new TestPlugin(app, {
      id: "tasks",
      name: "Tasks",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.load();

    const events: string[] = [];
    app.configurationOptionSources.on("changed", (change) => {
      events.push(`${change.sourceId}:${change.reason}`);
    });

    const registration = plugin.registerConfigurationOptionSource("statuses", {
      getOptions: () => [],
    });
    registration.invalidate();

    expect(events).toEqual([
      "tasks.statuses:registered",
      "tasks.statuses:invalidated",
    ]);

    plugin.unload();
  });

  it("stores community plugin data in /.obsidian/plugins/<id>/data.json", async () => {
    const { app, adapter } = createPluginApp();
    await app.vault.load();
    await app.configuration.load();

    const plugin = new TestPlugin(app, {
      id: "community-plugin",
      name: "Community Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({
      source: "community",
      basePath: "/.obsidian/plugins/community-plugin",
    });

    await plugin.saveData({ enabled: true });

    const payload = JSON.stringify({ enabled: true }, null, 2);

    expect(
      await adapter.read("/.obsidian/plugins/community-plugin/data.json"),
    ).toBe(payload);
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toEqual({
      pluginData: {
        "community-plugin": {
          enabled: true,
        },
      },
    });
    expect(await plugin.loadData()).toEqual({ enabled: true });
  });

  it("stores core plugin data in /.obsidian/<id>.json", async () => {
    const { app, adapter } = createPluginApp();
    await app.vault.load();
    await app.configuration.load();

    const plugin = new TestPlugin(app, {
      id: "core-plugin",
      name: "Core Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({
      source: "core",
      basePath: "/.obsidian/plugins/core-plugin",
    });

    await plugin.saveData({ enabled: true });

    const payload = JSON.stringify({ enabled: true }, null, 2);

    expect(await adapter.read("/.obsidian/core-plugin.json")).toBe(payload);
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toEqual({
      pluginData: {
        "core-plugin": {
          enabled: true,
        },
      },
    });
    expect(
      await adapter.exists("/.obsidian/plugins/core-plugin/data.json"),
    ).toBe(false);
    expect(await plugin.loadData()).toEqual({ enabled: true });
  });

  it("returns null when a core plugin has no settings file", async () => {
    const { app } = createPluginApp();
    await app.vault.load();
    await app.configuration.load();

    const plugin = new TestPlugin(app, {
      id: "core-without-settings",
      name: "Core Without Settings",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({ source: "core" });

    await expect(plugin.loadData()).resolves.toBeNull();
  });

  it("stores generated plugin state in the app database", async () => {
    const { app } = createPluginApp();
    await app.vault.load();
    await app.configuration.load();

    const plugin = new TestPlugin(app, {
      id: "generated-state-plugin",
      name: "Generated State Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({ source: "community" });

    await plugin.saveGeneratedState("index-cache", { ready: true });

    await expect(
      plugin.loadGeneratedState<{ ready: boolean }>("index-cache"),
    ).resolves.toEqual({ ready: true });

    await plugin.deleteGeneratedState("index-cache");
    await expect(plugin.loadGeneratedState("index-cache")).resolves.toBeNull();
  });

  it("migrates a legacy data.json subtree into generated state once", async () => {
    const { app } = createPluginApp();
    await app.vault.load();
    await app.configuration.load();

    const plugin = new TestPlugin(app, {
      id: "migration-plugin",
      name: "Migration Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({
      source: "community",
      basePath: "/.obsidian/plugins/migration-plugin",
    });

    await plugin.saveData({
      cache: { ids: [1, 2, 3] },
      keep: true,
    });

    await expect(
      plugin.migrateDataToGeneratedState<{ ids: number[] }>("cache", {
        pruneLegacyKey: true,
      }),
    ).resolves.toEqual({ ids: [1, 2, 3] });

    await expect(plugin.loadGeneratedState("cache")).resolves.toEqual({
      ids: [1, 2, 3],
    });
    await expect(plugin.loadData()).resolves.toEqual({ keep: true });
    expect(app.configuration.getPluginData("migration-plugin")).toEqual({
      keep: true,
    });
    await expect(
      plugin.migrateDataToGeneratedState<{ ids: number[] }>("cache"),
    ).resolves.toEqual({ ids: [1, 2, 3] });
  });

  it("prefers canonical app.json plugin data and heals stale legacy files", async () => {
    const { app, adapter } = createPluginApp();
    await app.vault.load();
    await app.configuration.load();

    const plugin = new TestPlugin(app, {
      id: "canonical-plugin",
      name: "Canonical Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({
      source: "community",
      basePath: "/.obsidian/plugins/canonical-plugin",
    });

    await app.configuration.updatePluginData("canonical-plugin", {
      enabled: false,
      source: "app-json",
    });
    await app.vault.mkpath("/.obsidian/plugins/canonical-plugin");
    await app.vault.create(
      "/.obsidian/plugins/canonical-plugin/data.json",
      JSON.stringify({ enabled: true, source: "legacy" }, null, 2),
    );

    await expect(plugin.loadData()).resolves.toEqual({
      enabled: false,
      source: "app-json",
    });
    expect(
      JSON.parse(
        await adapter.read("/.obsidian/plugins/canonical-plugin/data.json"),
      ),
    ).toEqual({ enabled: false, source: "app-json" });
  });

  it("backfills canonical app.json from a legacy-only plugin data file", async () => {
    const { app, adapter } = createPluginApp();
    await app.vault.load();
    await app.configuration.load();

    const plugin = new TestPlugin(app, {
      id: "legacy-only-plugin",
      name: "Legacy Only Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });
    plugin.configureRuntime({
      source: "community",
      basePath: "/.obsidian/plugins/legacy-only-plugin",
    });

    await app.vault.mkpath("/.obsidian/plugins/legacy-only-plugin");
    await app.vault.create(
      "/.obsidian/plugins/legacy-only-plugin/data.json",
      JSON.stringify({ enabled: true, migrated: true }, null, 2),
    );

    await expect(plugin.loadData()).resolves.toEqual({
      enabled: true,
      migrated: true,
    });
    expect(app.configuration.hasPluginData("legacy-only-plugin")).toBe(true);
    expect(app.configuration.getPluginData("legacy-only-plugin")).toEqual({
      enabled: true,
      migrated: true,
    });
    expect(JSON.parse(await adapter.read("/.obsidian/app.json"))).toEqual({
      pluginData: {
        "legacy-only-plugin": {
          enabled: true,
          migrated: true,
        },
      },
    });
  });

  it("cleans up scoped context keys on unload", async () => {
    const { app } = createPluginApp();
    await app.vault.load();
    await app.configuration.load();

    const plugin = new TestPlugin(app, {
      id: "context-plugin",
      name: "Context Plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "",
      author: "test",
    });

    const handle = plugin.registerContextKey("ready", true);

    expect(app.contextKeys.get(handle.key)).toBe(true);

    plugin.load();
    plugin.unload();

    expect(app.contextKeys.get(handle.key)).toBeUndefined();
  });
});
