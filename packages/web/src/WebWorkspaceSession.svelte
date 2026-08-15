<script lang="ts">
  import {
    App,
    listVaultProfiles,
    type BrowserCoordinatedAppDatabase,
    type VaultAdapter,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { AiPlugin } from "@lapis-notes/ai";
  import "@lapis-notes/ai/styles.css";
  import { BasesPlugin } from "@lapis-notes/bases";
  import "@lapis-notes/bases/styles.css";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
  import { RolesPlugin } from "@lapis-notes/lapis-plugin-cv-roles";
  import { SearchPlugin } from "@lapis-notes/search";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import { onMount, untrack } from "svelte";
  import { registerWebAgentRuntimeBridge } from "./agent-runtime-attach";
  import { createWebPluginAssetServer } from "./plugin-asset-server";

  let {
    adapter,
    profile,
    session,
    onReady,
    onFailure,
    onOpenRecent,
    onManageVaults,
  }: {
    adapter: VaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    onReady(): void;
    onFailure(error: unknown): void;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onManageVaults(): Promise<void>;
  } = $props();

  const app = untrack(
    () =>
      new App({
        version: "2026.6.3",
        configPath: ".obsidian/app.json",
        session,
        pluginAssetServer: createWebPluginAssetServer({ adapter }),
        workspaceShell: {
          application: {
            name: "Lapis Notes",
            buildTime: null,
            copyright: "Copyright © Lapis Notes contributors.",
          },
          notifications: true,
        },
        markdownRenderer: async () => {},
      }),
  );
  globalThis.app = app;
  let ready = $state(false);
  let disposed = false;
  let stopMetadataTracking: (() => void) | null = null;
  let disposeDatabaseStatus: (() => void) | null = null;
  let disposeCoordinationListener: (() => void) | null = null;
  let recentVaults = $state.raw<VaultProfile[]>([]);
  let workspaceNavigation = $derived.by<WorkspaceNavigation>(() => {
    const browserProfiles = recentVaults.filter(
      (candidate) => candidate.kind !== "desktop-folder",
    );
    const profiles = (
      browserProfiles.some((candidate) => candidate.id === profile.id)
        ? browserProfiles
        : [profile, ...browserProfiles]
    ).slice(0, 8);
    return {
      currentLabel: profile.name,
      menuLabel: "Recent vaults",
      items: profiles.map((candidate) => ({
        id: candidate.id,
        label: candidate.name,
        description: candidate.kind,
        disabled: candidate.id === profile.id,
      })),
      emptyLabel: "No recent vaults",
      manageLabel: "Manage Vaults",
      onSelect: (item) => {
        const selected = profiles.find((candidate) => candidate.id === item.id);
        if (selected) return onOpenRecent(selected);
      },
      onManage: onManageVaults,
    };
  });

  onMount(() => {
    void initialize();
    return () => {
      void dispose(false);
    };
  });

  function syncDatabaseStatus(role: "owner" | "proxy"): void {
    disposeDatabaseStatus?.();
    disposeDatabaseStatus = getWorkspaceHostBinding(
      app.workspace,
    ).controller.status.addItem({
      id: "app:web-database-role",
      label: role === "proxy" ? "DB Proxy" : "DB Owner",
      icon: "database",
      tooltip:
        role === "proxy"
          ? "Database requests are delegated to this vault's owner tab."
          : "This tab owns the local Turso database for this vault.",
      align: "right",
      priority: 850,
    });
  }

  function registerDatabaseStatus(): void {
    const role = session.appDatabase?.descriptor.role === "proxy" ? "proxy" : "owner";
    syncDatabaseStatus(role);
    const coordinated = session.appDatabase as BrowserCoordinatedAppDatabase & {
      onCoordinationModeChange?: (
        listener: (mode: "turso-owner" | "turso-proxy") => void,
      ) => () => void;
    };
    disposeCoordinationListener = coordinated.onCoordinationModeChange?.(
      (mode) => syncDatabaseStatus(mode === "turso-proxy" ? "proxy" : "owner"),
    ) ?? null;
  }

  async function initialize(): Promise<void> {
    try {
      registerWebAgentRuntimeBridge();
      app.plugins.registerCorePlugins([
        { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
        { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
        { plugin: FileExplorerPlugin, required: false, enabledByDefault: true },
        { plugin: SearchPlugin, required: false, enabledByDefault: true },
        {
          plugin: BasesPlugin,
          required: false,
          enabledByDefault: true,
          distribution: "bundled",
        },
        {
          plugin: AiPlugin,
          required: false,
          enabledByDefault: true,
          distribution: "bundled",
        },
        {
          plugin: RolesPlugin,
          required: false,
          enabledByDefault: true,
          distribution: "first-party-external",
        },
      ]);
      await app.vault.load();
      await app.vault.mkpath(".obsidian");
      const hasPersistedLayout = await adapter.exists(".obsidian/workspace.json");
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      stopMetadataTracking = app.metadataTypeManager.trackChanges();
      await app.metadataCache.load();
      await app.workspace.loadLayout();
      if (
        app.plugins.isPluginEnabled("search") &&
        !hasPersistedLayout &&
        app.workspace.getLeavesOfType("search").length === 0
      ) {
        const searchLeaf = app.workspace.ensureSideLeaf("search");
        await searchLeaf.setViewState({ type: "search", state: {} });
      }
      recentVaults = await listVaultProfiles();
      registerDatabaseStatus();
      ready = true;
      onReady();
      const launch = new URL(window.location.href);
      if (launch.pathname === "/open") {
        const url = launch.searchParams.get("url");
        if (url) await app.urls.dispatch(url);
      }
    } catch (error) {
      onFailure(error);
    }
  }

  export async function dispose(persistLayout: boolean): Promise<void> {
    if (disposed) return;
    disposed = true;
    const serializedLayout =
      persistLayout && app.workspace.layoutReady
        ? JSON.stringify(app.workspace.getLayout(), null, 2)
        : null;
    ready = false;
    await app.workspace.disposeWorkspaceHost();
    if (serializedLayout) {
      await session.vaultAdapter.mkdir(".obsidian", { recursive: true });
      await session.vaultAdapter.write(
        ".obsidian/workspace.json",
        serializedLayout,
      );
    }
    stopMetadataTracking?.();
    stopMetadataTracking = null;
    await app.metadataCache.dispose();
    for (const plugin of [...app.plugins.corePlugins].reverse()) {
      await plugin.disable().catch(() => undefined);
    }
    disposeCoordinationListener?.();
    disposeDatabaseStatus?.();
    disposeCoordinationListener = null;
    disposeDatabaseStatus = null;
    await session.close();
    if (globalThis.app === app) delete (globalThis as { app?: App }).app;
  }
</script>

<section class="web-host__workspace" data-web-runtime="web-pwa" data-vault-id={profile.id}>
  {#if ready}
    <WorkspaceShell
      {app}
      displayMode="desktop"
      workspaceLabel={profile.name}
      {workspaceNavigation}
    />
  {:else}
    <div class="web-host__loading" aria-live="polite">
      <div class="web-host__loading-content">
        <img src="/favicon.svg" alt="" />
        <h1>Lapis Notes</h1>
        <p>Opening vault…</p>
      </div>
    </div>
  {/if}
</section>
