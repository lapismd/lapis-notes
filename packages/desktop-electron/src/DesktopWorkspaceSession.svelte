<script lang="ts">
  import {
    App,
    listVaultProfiles,
    type NativeDesktopVaultAdapter,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
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
  import { getVaultProfileLocation } from "./desktop-vault-profiles";
  import { registerElectronMarkdownLanguageServiceProvider } from "./native-language-services";
  import { createElectronPluginAssetServer } from "./plugin-asset-server";
  import type { DesktopAppInfo } from "./DesktopVaultHost.svelte";
  import type { ElectronDesktopBridge } from "./main";

  let {
    adapter,
    profile,
    session,
    appInfo,
    bridge,
    onReady,
    onFailure,
    onOpenRecent,
    onManageVaults,
  }: {
    adapter: NativeDesktopVaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    appInfo: DesktopAppInfo;
    bridge: ElectronDesktopBridge;
    onReady(app: App): void;
    onFailure(error: unknown): void;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onManageVaults(): Promise<void>;
  } = $props();

  const app = untrack(
    () =>
      new App({
        version: appInfo.version,
        configPath: ".obsidian/app.json",
        session,
        pluginAssetServer: createElectronPluginAssetServer({ adapter, bridge }),
        workspaceShell: { application: appInfo, notifications: true },
        markdownRenderer: async () => {},
      }),
  );
  globalThis.app = app;
  let ready = $state(false);
  let disposed = false;
  let unregisterLanguageService: (() => void) | null = null;
  let stopMetadataTracking: (() => void) | null = null;
  let recentVaults = $state.raw<VaultProfile[]>([]);
  let workspaceNavigation = $derived.by<WorkspaceNavigation>(() => {
    const desktopProfiles = recentVaults.filter(
      (candidate) => candidate.kind === "desktop-folder",
    );
    const profiles = (
      desktopProfiles.some((candidate) => candidate.id === profile.id)
        ? desktopProfiles
        : [profile, ...desktopProfiles]
    ).slice(0, 8);
    return {
      currentLabel: profile.name,
      menuLabel: "Recent vaults",
      items: profiles.map((candidate) => ({
        id: candidate.id,
        label: candidate.name,
        description: getVaultProfileLocation(candidate),
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
    void loadRecentVaults();
    void initialize();
    return () => {
      void dispose(false);
    };
  });

  async function loadRecentVaults(): Promise<void> {
    try {
      const profiles = await listVaultProfiles();
      recentVaults = profiles;
    } catch {
      recentVaults = [];
    }
  }

  async function initialize(): Promise<void> {
    try {
      unregisterLanguageService =
        await registerElectronMarkdownLanguageServiceProvider(
          app,
          (command, payload) => bridge.invoke(command, payload),
        );
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
          plugin: RolesPlugin,
          required: false,
          enabledByDefault: true,
          distribution: "first-party-external",
        },
      ]);
      await app.vault.load();
      await app.vault.mkpath(".obsidian");
      const hasPersistedLayout = await adapter.exists(
        ".obsidian/workspace.json",
      );
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
      ready = true;
      onReady(app);
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
    unregisterLanguageService?.();
    unregisterLanguageService = null;
    bridge.closeAllWatches?.();
    await bridge
      .invoke("desktop_plugin_host_shutdown", { contextId: profile.id })
      .catch(() => {});
    await session.close();
  }
</script>

<section
  class="desktop-host__workspace"
  data-native-runtime="electron-desktop"
  data-vault-id={profile.id}
>
  {#if ready}
    <WorkspaceShell
      {app}
      displayMode="desktop"
      workspaceLabel={profile.name}
      {workspaceNavigation}
    />
  {:else}
    <div
      class="desktop-host__loading"
      data-desktop-vault-loading
      aria-live="polite"
    >
      <div class="desktop-host__loading-content">
        <div class="desktop-host__mark" aria-hidden="true">L</div>
        <h1>Lapis Notes</h1>
        <p>Opening vault…</p>
      </div>
    </div>
  {/if}
</section>
