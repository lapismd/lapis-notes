<script lang="ts">
  import {
    App,
    clearVerifiedPluginMarkdownCache,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    Plugin,
    type InstalledPluginRecord,
    type PluginCatalogDetail,
    type PluginCatalogEntry,
    type PluginDistributionManager,
    type PluginDownloadStatsSummary,
    type PluginInstallProgressEvent,
    type PluginProfile,
    type PluginUpdateInfo,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { registerPluginManagementSettings } from "@lapis-notes/workspace";
  import { WorkspaceSettingsSurface } from "@lapismd/design-core/workspace/settings";
  import { onDestroy, onMount, tick, untrack } from "svelte";

  type PluginManagementScenario =
    | "empty"
    | "catalog"
    | "installed"
    | "failure"
    | "progress"
    | "community";

  let {
    scenario = "catalog",
    section = "plugin-registry",
    markdownMode = "valid",
  }: {
    scenario?: PluginManagementScenario;
    section?: "plugin-registry" | "core-plugins" | "community-plugins";
    markdownMode?: "valid" | "invalid";
  } = $props();

  const graphOverview =
    "# Graph\n\nExplore local and global relationships between notes.\n\n## Highlights\n\n- Open graph navigation\n- Local relationship exploration\n";
  const graphChangelog = `# Changelog

## 0.2.0 — Structured plugin details

Released 24 August 2026.

### Added

- Added signed Overview, Changelog, and Versions content to plugin details.
- Added a resizable results rail for comparing plugins without closing the dialog.
- Added Web and Desktop compatibility badges with platform-specific icons.

### Changed

- Refined the selected-plugin treatment with an accent ring and tinted background.
- Improved keyboard focus, narrow drill-in navigation, and release metadata layout.

### Fixed

- Preserved result and documentation scrolling while switching detail tabs.
- Kept plugin metadata available when verified Markdown cannot be loaded.

## 0.1.0 — First public package

Released 1 August 2026.

### Added

- Published the initial graph navigation experience for Web and Desktop.
- Added local relationship exploration and direct note navigation.
`;

  function renderStoryMarkdown(markdown: string, element: HTMLElement): void {
    const fragment = document.createDocumentFragment();
    let list: HTMLUListElement | null = null;

    for (const sourceLine of markdown.split("\n")) {
      const line = sourceLine.trim();
      if (!line) {
        list = null;
        continue;
      }

      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      if (heading) {
        list = null;
        const level = heading[1].length;
        const node = document.createElement(
          level === 1 ? "h1" : level === 2 ? "h2" : "h3",
        );
        node.textContent = heading[2];
        fragment.append(node);
        continue;
      }

      if (line.startsWith("- ")) {
        if (!list) {
          list = document.createElement("ul");
          fragment.append(list);
        }
        const item = document.createElement("li");
        item.textContent = line.slice(2);
        list.append(item);
        continue;
      }

      list = null;
      const paragraph = document.createElement("p");
      paragraph.textContent = line.replace(/\*\*/g, "");
      fragment.append(paragraph);
    }

    element.replaceChildren(fragment);
  }

  const catalog: PluginCatalogEntry[] =
    untrack(() => scenario) === "empty"
      ? []
      : [
          {
            id: "lapis-source-editor",
            name: "Source Editor",
            description: "Plain text, JSON, and YAML editing for Lapis apps.",
            readmeUrl: "https://story.invalid/source-editor/README.md",
            author: "Lapis Notes",
            authorUrl: "https://lapis.md",
            channel: "official",
            status: "active",
            latestVersion: "0.1.0",
            minAppVersion: "0.0.0",
            platforms: ["web", "desktop"],
            categories: ["editor"],
            badges: ["official", "verified"],
            latestRelease: {
              releasedAt: "2026-08-22T12:00:00.000Z",
              bundleSize: 18_432,
            },
            detail: "https://story.invalid/v1/plugins/lapis-source-editor.json",
          },
          {
            id: "lapis-graph",
            name: "Graph",
            description: "Explore local and global relationships between notes.",
            readmeUrl: "https://story.invalid/graph/README.md",
            author: "Lapis Notes",
            authorUrl: "https://lapis.md",
            channel: "official",
            status: "active",
            latestVersion: "0.2.0",
            minAppVersion: "0.0.0",
            platforms: ["web", "desktop"],
            categories: ["visualization"],
            badges: ["official", "update-available"],
            latestRelease: {
              releasedAt: "2026-08-24T12:00:00.000Z",
              bundleSize: 44_032,
            },
            detail: "https://story.invalid/v1/plugins/lapis-graph.json",
          },
          {
            id: "revoked-plugin",
            name: "Revoked Example",
            description: "A fixture used to preserve the registry revocation state.",
            author: "Community Author",
            channel: "community",
            status: "revoked",
            latestVersion: "1.1.0",
            minAppVersion: "0.0.0",
            platforms: ["web"],
            categories: ["fixture"],
            badges: ["revoked"],
            latestRelease: {
              releasedAt: "2026-08-20T12:00:00.000Z",
              bundleSize: 8_192,
            },
            detail: "https://story.invalid/v1/plugins/revoked-plugin.json",
          },
        ];

  const statsPeriod = (
    counts: Record<string, number>,
  ): PluginDownloadStatsSummary["periods"]["lifetime"] => {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return {
      from: "2026-08-01",
      through: "2026-08-28",
      total,
      plugins: Object.fromEntries(
        Object.entries(counts).map(([pluginId, count]) => [
          pluginId,
          {
            total: count,
            versions: {
              [catalog.find((entry) => entry.id === pluginId)?.latestVersion ??
              "unknown"]: count,
            },
          },
        ]),
      ),
      versions: {},
      actions: { install: total },
      platforms: { desktop: total },
      os: { macos: total },
    };
  };
  const downloadStats: PluginDownloadStatsSummary = {
    schemaVersion: 1,
    generatedAt: "2026-08-29T04:17:00.000Z",
    dataset: "lapis_plugin_downloads_v1",
    metric: "approximate_redirect_requests",
    trackedSince: "2026-08-01",
    through: "2026-08-28",
    periods: {
      lifetime: statsPeriod({
        "lapis-source-editor": 12_300,
        "lapis-graph": 48_200,
        "revoked-plugin": 960,
      }),
      "7d": statsPeriod({
        "lapis-source-editor": 220,
        "lapis-graph": 810,
        "revoked-plugin": 25,
      }),
      "30d": statsPeriod({
        "lapis-source-editor": 720,
        "lapis-graph": 2_400,
        "revoked-plugin": 120,
      }),
    },
  };

  const installed = $state<InstalledPluginRecord[]>(
    untrack(() => scenario) === "installed"
      ? [
          {
            pluginId: "lapis-graph",
            installedVersion: "0.1.0",
            installedAt: "2026-08-01T12:00:00.000Z",
            updatedAt: "2026-08-01T12:00:00.000Z",
            provenance: "official",
            registryId: "lapis-official",
            registryUrl: "https://registry.lapis.md/v1/index.json",
            restartRequired: true,
            files: [
              { path: "main.mjs", sha256: "a".repeat(64), size: 41_984 },
              { path: "styles.css", sha256: "b".repeat(64), size: 2_048 },
            ],
          },
          {
            pluginId: "revoked-plugin",
            installedVersion: "1.0.0",
            installedAt: "2026-07-20T12:00:00.000Z",
            updatedAt: "2026-07-20T12:00:00.000Z",
            provenance: "community",
            registryId: "lapis-official",
            files: [{ path: "main.mjs", sha256: "c".repeat(64), size: 8_192 }],
            revoked: {
              revokedAt: "2026-08-20T12:00:00.000Z",
              reason: "security",
              message: "This release was revoked after a security review.",
            },
          },
        ]
      : [],
  );

  const updates = $state<PluginUpdateInfo[]>(
    untrack(() => scenario) === "installed"
      ? [
          {
            id: "lapis-graph",
            name: "Graph",
            currentVersion: "0.1.0",
            latestVersion: "0.2.0",
            targetVersion: "0.2.0",
            provenance: "official",
            registryId: "lapis-official",
            compatible: true,
            canUpdate: true,
            bundleSize: 44_032,
            status: "update-available",
            reasons: [],
          },
          {
            id: "revoked-plugin",
            name: "Revoked Example",
            currentVersion: "1.0.0",
            latestVersion: "1.1.0",
            targetVersion: "1.1.0",
            provenance: "community",
            registryId: "lapis-official",
            compatible: false,
            canUpdate: false,
            status: "revoked",
            reasons: ["revoked"],
            revoked: {
              revokedAt: "2026-08-20T12:00:00.000Z",
              reason: "security",
              message: "This installed release is no longer trusted.",
            },
          },
        ]
      : [],
  );

  function detail(entry: PluginCatalogEntry): PluginCatalogDetail {
    return {
      schemaVersion: 1,
      id: entry.id,
      name: entry.name,
      description: entry.description,
      readmeUrl: entry.readmeUrl,
      channel: entry.channel,
      status: entry.status,
      owner: {
        name: entry.author,
        verified: entry.channel === "official",
        url: entry.authorUrl,
      },
      latestVersion: entry.latestVersion,
      license: "MIT",
      links: {
        homepage: "https://lapis.md/plugins",
        repository: `https://github.com/lapismd/lapis-plugins/tree/main/packages/${entry.id.replace(/^lapis-/, "")}`,
        documentation: entry.readmeUrl,
        issues: "https://github.com/lapismd/lapis-plugins/issues",
      },
      highlights:
        entry.id === "lapis-graph"
          ? [
              "Navigate directly between graph nodes and notes.",
              "Inspect local relationships without leaving the workspace.",
            ]
          : undefined,
      content:
        entry.id === "lapis-graph"
          ? {
              overview: {
                url: "https://story.invalid/v1/content/lapis-graph/overview.md",
                sourceUrl:
                  "https://github.com/lapismd/lapis-plugins/blob/story/packages/graph/README.md",
                sha256:
                  "ad83480f9afb01c6e38f8085587e560019f600145bf73f3782987d7beb4e7b94",
                size: 136,
                mediaType: "text/markdown",
              },
              changelog: {
                url: "https://story.invalid/v1/content/lapis-graph/changelog.md",
                sourceUrl:
                  "https://github.com/lapismd/lapis-plugins/blob/story/packages/graph/CHANGELOG.md",
                sha256:
                  "513a295df3a6ded79a0521b2388117442ce6ed91a5f0a94ccfccca3c27205383",
                size: 879,
                mediaType: "text/markdown",
              },
            }
          : undefined,
      versions: {
        ...(entry.id === "lapis-graph"
          ? {
              "0.1.0": {
                version: "0.1.0",
                minAppVersion: entry.minAppVersion,
                releasedAt: "2026-08-01T12:00:00.000Z",
                platforms: entry.platforms,
                bundle: {
                  url: `https://story.invalid/releases/${entry.id}-0.1.0.lapis-plugin`,
                  sha256: "c".repeat(64),
                  size: 40_960,
                },
              },
            }
          : {}),
        [entry.latestVersion]: {
          version: entry.latestVersion,
          minAppVersion: entry.minAppVersion,
          releasedAt: "2026-08-24T12:00:00.000Z",
          platforms: entry.platforms,
          bundle: {
            url: `https://story.invalid/releases/${entry.id}.lapis-plugin`,
            sha256: "d".repeat(64),
            size: entry.id === "lapis-graph" ? 44_032 : 18_432,
          },
        },
      },
    };
  }

  let bundleInstallCalls = $state(0);
  let uninstallCalls = $state(0);
  let lastProgress = $state("idle");
  const progressListeners = new Set<(event: PluginInstallProgressEvent) => void>();
  const distribution: PluginDistributionManager = {
    async refreshCatalog() {
      if (untrack(() => scenario) === "failure") {
        throw new Error("The registry signature could not be verified.");
      }
      return {
        schemaVersion: 1,
        generatedAt: "2026-08-28T12:00:00.000Z",
        plugins: catalog,
      };
    },
    async getDownloadStats() {
      return downloadStats;
    },
    search(query = {}) {
      const text = query.text?.trim().toLowerCase() ?? "";
      return catalog.filter((entry) =>
        text ? `${entry.name} ${entry.description}`.toLowerCase().includes(text) : true,
      );
    },
    getCatalogEntry(pluginId) {
      return catalog.find((entry) => entry.id === pluginId);
    },
    async getPluginDetail(pluginId) {
      const entry = catalog.find((candidate) => candidate.id === pluginId);
      return entry ? detail(entry) : null;
    },
    async install(pluginId) {
      if (untrack(() => scenario) === "progress") {
        progressListeners.forEach((listener) =>
          listener({
            pluginId,
            phase: "downloading-bundle",
            downloadedBytes: 8_192,
            totalBytes: 44_032,
          }),
        );
        return new Promise<InstalledPluginRecord>(() => {});
      }
      const record = fixtureInstalledRecord(pluginId, "official");
      installed.splice(0, installed.length, ...installed, record);
      return record;
    },
    async installBundle() {
      bundleInstallCalls += 1;
      lastProgress = "Verifying files (2 of 4)";
      progressListeners.forEach((listener) =>
        listener({
          pluginId: "*",
          phase: "verifying-files",
          filePath: "main.mjs",
          fileIndex: 2,
          fileCount: 4,
        }),
      );
      if (untrack(() => scenario) === "progress") {
        return new Promise<InstalledPluginRecord>(() => {});
      }
      const record = fixtureInstalledRecord("manual-example", "manual");
      installed.splice(0, installed.length, ...installed, record);
      return record;
    },
    async update(pluginId, version) {
      const record = installed.find((candidate) => candidate.pluginId === pluginId);
      if (!record) return null;
      record.installedVersion = version ?? "0.2.0";
      updates.splice(
        0,
        updates.length,
        ...updates.filter((candidate) => candidate.id !== pluginId),
      );
      return record;
    },
    async uninstall(pluginId) {
      uninstallCalls += 1;
      installed.splice(
        0,
        installed.length,
        ...installed.filter((candidate) => candidate.pluginId !== pluginId),
      );
    },
    async listInstalled() {
      return [...installed];
    },
    async getInstalled(pluginId) {
      return installed.find((candidate) => candidate.pluginId === pluginId) ?? null;
    },
    async listUpdates() {
      return [...updates];
    },
    addProgressListener(listener) {
      progressListeners.add(listener);
      return () => progressListeners.delete(listener);
    },
  };

  function fixtureInstalledRecord(
    pluginId: string,
    provenance: InstalledPluginRecord["provenance"],
  ): InstalledPluginRecord {
    return {
      pluginId,
      installedVersion: "0.1.0",
      installedAt: "2026-08-28T12:00:00.000Z",
      updatedAt: "2026-08-28T12:00:00.000Z",
      provenance,
      files: [{ path: "main.mjs", sha256: "e".repeat(64), size: 12_288 }],
    };
  }

  function createPlugin(id: string, name: string, description: string) {
    return class extends Plugin {
      constructor(app: App) {
        super(app, {
          id,
          name,
          description,
          author: "Lapis Notes",
          version: "0.1.0",
          minAppVersion: "0.0.0",
          lapis: {
            manifestVersion: 1,
            database: { metadataAccess: "queries" },
          },
        });
      }
      onload() {}
    };
  }

  const SourceEditorPlugin = createPlugin(
    "lapis-source-editor",
    "Source Editor",
    "Plain text, JSON, and YAML editing.",
  );
  const MarkdownPlugin = createPlugin(
    "markdown",
    "Markdown",
    "Reading, live preview, and Markdown navigation.",
  );
  const FileExplorerPlugin = createPlugin(
    "lapis-file-explorer",
    "File Explorer",
    "Vault file navigation and actions.",
  );
  const SearchPlugin = createPlugin(
    "search",
    "Search",
    "Indexed lexical and semantic search.",
  );
  const CommunityPlugin = createPlugin(
    "community-example",
    "Community Example",
    "A manually installed plugin with lifecycle controls.",
  );
  const FailedPlugin = class extends Plugin {
    constructor(app: App) {
      super(app, {
        id: "failed-community-plugin",
        name: "Failed Community Plugin",
        description: "A plugin that failed during activation.",
        author: "Community Author",
        version: "1.0.0",
        minAppVersion: "0.0.0",
        lapis: {
          manifestVersion: 1,
          database: { metadataAccess: "queries" },
        },
      });
    }
    onload() {
      throw new Error("The plugin runtime entry could not be loaded.");
    }
  };
  const InstalledGraphPlugin = createPlugin(
    "lapis-graph",
    "Graph",
    "Explore local and global note relationships.",
  );
  const RevokedPlugin = createPlugin(
    "revoked-plugin",
    "Revoked Example",
    "A revoked installed plugin fixture.",
  );

  const adapter = new MemoryVaultAdapter({ ".obsidian/app.json": "{}" });
  const app = new App({
    version: "0.1.0-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase(
      `plugin-management-${untrack(() => scenario)}-${untrack(() => section)}`,
    ),
    markdownRenderer: async (markdown, element) =>
      renderStoryMarkdown(markdown, element),
  });
  (app as unknown as { pluginDistribution: PluginDistributionManager })
    .pluginDistribution = distribution;
  let communityToggleCalls = $state(0);
  let installedDisableCalls = $state(0);
  const enablePlugin = app.plugins.enablePlugin.bind(app.plugins);
  app.plugins.enablePlugin = async (pluginId) => {
    if (pluginId === "community-example") communityToggleCalls += 1;
    return enablePlugin(pluginId);
  };
  const disablePlugin = app.plugins.disablePlugin.bind(app.plugins);
  app.plugins.disablePlugin = async (pluginId) => {
    if (pluginId === "lapis-graph") installedDisableCalls += 1;
    return disablePlugin(pluginId);
  };

  const profile = [
    { plugin: SourceEditorPlugin, enabledByDefault: true },
    { plugin: MarkdownPlugin, enabledByDefault: true },
    { plugin: FileExplorerPlugin, enabledByDefault: true },
    { plugin: SearchPlugin, enabledByDefault: true },
  ] as const satisfies PluginProfile;
  app.plugins.registerStaticPlugins(profile);

  const communityPlugin = new CommunityPlugin(app);
  communityPlugin.configureRuntime({
    source: "community",
    provenance: "manual",
    basePath: "/.obsidian/plugins/community-example",
  });
  const failedPlugin = new FailedPlugin(app);
  failedPlugin.configureRuntime({
    source: "community",
    provenance: "community",
    basePath: "/.obsidian/plugins/failed-community-plugin",
  });
  if (untrack(() => scenario) === "community") {
    app.plugins.plugins.set(communityPlugin.manifest.id, communityPlugin);
    app.plugins.plugins.set(failedPlugin.manifest.id, failedPlugin);
  }
  const installedRuntimePlugins =
    untrack(() => scenario) === "installed"
      ? [new InstalledGraphPlugin(app), new RevokedPlugin(app)]
      : [];
  for (const plugin of installedRuntimePlugins) {
    plugin.configureRuntime({
      source: "community",
      provenance: plugin.manifest.id === "lapis-graph" ? "official" : "community",
      basePath: `/.obsidian/plugins/${plugin.manifest.id}`,
    });
    app.plugins.plugins.set(plugin.manifest.id, plugin);
  }

  const disposeSettings = registerPluginManagementSettings(app);
  const controller = getWorkspaceHostBinding(app.workspace).controller.settings;
  controller.registerSection({
    id: "source-editor-options",
    title: "Editor",
    sourcePluginId: "lapis-source-editor",
    fields: [],
  });
  controller.selectSection(untrack(() => section));
  let ready = $state(false);

  onMount(() => {
    let disposed = false;
    const storyWindow = window;
    const originalFetch = storyWindow.fetch;
    const storyFetch: typeof fetch = async (input, init) => {
      if (String(input).endsWith("/lapis-graph/overview.md")) {
        const body = untrack(() => markdownMode) === "invalid" ? "invalid" : graphOverview;
        return new Response(body, {
          status: 200,
          headers: {
            "content-type": "text/markdown",
            "content-length": String(new TextEncoder().encode(body).length),
          },
        });
      }
      if (String(input).endsWith("/lapis-graph/changelog.md")) {
        return new Response(graphChangelog, {
          status: 200,
          headers: {
            "content-type": "text/markdown",
            "content-length": String(
              new TextEncoder().encode(graphChangelog).length,
            ),
          },
        });
      }
      return originalFetch(input, init);
    };
    clearVerifiedPluginMarkdownCache();
    storyWindow.fetch = storyFetch;
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      if (untrack(() => scenario) === "community") {
        await app.plugins.enablePlugin(failedPlugin.manifest.id);
      }
      if (installedRuntimePlugins[0]) {
        const installedGraph =
          app.plugins.plugins.get(installedRuntimePlugins[0].manifest.id) ??
          installedRuntimePlugins[0];
        await installedGraph.enable();
        await tick();
        app.plugins.emit("plugin-enabled", installedGraph);
        await tick();
      }
      if (!disposed) ready = true;
    })();
    return () => {
      disposed = true;
      if (storyWindow.fetch === storyFetch) storyWindow.fetch = originalFetch;
      clearVerifiedPluginMarkdownCache();
    };
  });

  onDestroy(() => {
    disposeSettings();
    for (const plugin of app.plugins.plugins.values()) {
      void plugin.disable().catch(() => undefined);
    }
    void app.workspace.disposeWorkspaceHost();
    void app.metadataCache.dispose();
    void app.appDatabase.close();
  });
</script>

<div
  class="plugin-management-story"
  data-testid="plugin-management-story"
  data-ready={ready || undefined}
>
  {#if ready}<WorkspaceSettingsSurface {controller} />{/if}
  <output class="sr-only" data-testid="plugin-bundle-install-calls"
    >{bundleInstallCalls}</output
  >
  <output class="sr-only" data-testid="plugin-install-progress"
    >{lastProgress}</output
  >
  <output class="sr-only" data-testid="failed-plugin-state"
    >{failedPlugin.state}: {failedPlugin.lastFailureMessage ?? "none"}</output
  >
  <output class="sr-only" data-testid="community-toggle-calls"
    >{communityToggleCalls}</output
  >
  <output class="sr-only" data-testid="plugin-uninstall-calls"
    >{uninstallCalls}</output
  >
  <output class="sr-only" data-testid="installed-disable-calls"
    >{installedDisableCalls}</output
  >
</div>

<style>
  .plugin-management-story {
    box-sizing: border-box;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--ui-background-primary);
  }

  .plugin-management-story :global(.ui-workspace-settings) {
    height: 100%;
  }
</style>
