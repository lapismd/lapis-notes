<script lang="ts">
  import {
    App,
    installApplicationCompatibility,
    listVaultProfiles,
    provideApplicationState,
    type NativeDesktopVaultAdapter,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import { AiPlugin } from "@lapis-notes/ai";
  import "@lapis-notes/ai/styles.css";
  import { BasesPlugin } from "@lapis-notes/bases";
  import "@lapis-notes/bases/styles.css";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
  import { RolesPlugin } from "@lapis-notes/lapis-plugin-cv-roles";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { SearchPlugin } from "@lapis-notes/search";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import {
    WorkspaceStartup,
    type WorkspaceStartupFailure,
    type WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
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
    onOpenRecent,
    onManageVaults,
  }: {
    adapter: NativeDesktopVaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    appInfo: DesktopAppInfo;
    bridge: ElectronDesktopBridge;
    onReady(app: App): void;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onManageVaults(): Promise<void>;
  } = $props();

  const STARTUP_TASKS: WorkspaceStartupTask[] = [
    { id: "vault", label: "Open the vault", status: "pending" },
    { id: "configuration", label: "Load app configuration", status: "pending" },
    { id: "plugins", label: "Load configured core plugins", status: "pending" },
    { id: "layout", label: "Restore the workspace layout", status: "pending" },
  ];

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
  provideApplicationState(app);
  const disposeApplicationCompatibility =
    installApplicationCompatibility(app);
  let ready = $state(false);
  let tasks = $state<WorkspaceStartupTask[]>(structuredClone(STARTUP_TASKS));
  let failure = $state<WorkspaceStartupFailure | null>(null);
  let disposed = false;
  let booting = false;
  let corePluginsRegistered = false;
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

  function setTask(
    id: string,
    taskStatus: WorkspaceStartupTask["status"],
  ): void {
    tasks = tasks.map((task) =>
      task.id === id ? { ...task, status: taskStatus } : task,
    );
  }

  async function teardownPartialBoot(): Promise<void> {
    ready = false;
    stopMetadataTracking?.();
    stopMetadataTracking = null;
    await app.workspace.disposeWorkspaceHost().catch(() => undefined);
    await app.metadataCache.dispose().catch(() => undefined);
    for (const plugin of [...app.plugins.corePlugins].reverse()) {
      await plugin.disable().catch(() => undefined);
    }
    unregisterLanguageService?.();
    unregisterLanguageService = null;
  }

  async function initialize(): Promise<void> {
    if (disposed || booting) return;
    booting = true;
    failure = null;
    tasks = structuredClone(STARTUP_TASKS);
    let activeTask = "vault";
    try {
      if (
        corePluginsRegistered ||
        unregisterLanguageService ||
        stopMetadataTracking
      ) {
        await teardownPartialBoot();
      }
      if (disposed) return;

      setTask(activeTask, "active");
      await bridge.invoke("desktop_app_info_get").catch(() => undefined);
      unregisterLanguageService =
        await registerElectronMarkdownLanguageServiceProvider(
          app,
          (command, payload) => bridge.invoke(command, payload),
        );
      if (!corePluginsRegistered) {
        app.plugins.registerCorePlugins([
          { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
          { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
          { plugin: FileExplorerPlugin, required: false, enabledByDefault: true },
          { plugin: SearchPlugin, required: false, enabledByDefault: true },
          { plugin: HistoryPlugin, required: false, enabledByDefault: true },
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
        corePluginsRegistered = true;
      }
      await app.vault.load();
      await app.vault.mkpath(".obsidian");
      const hasPersistedLayout = await adapter.exists(
        ".obsidian/workspace.json",
      );
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "configuration";
      setTask(activeTask, "active");
      await app.configuration.load();
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "plugins";
      setTask(activeTask, "active");
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      stopMetadataTracking = app.metadataTypeManager.trackChanges();
      await app.metadataCache.load();
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "layout";
      setTask(activeTask, "active");
      await app.workspace.loadLayout();
      if (
        app.plugins.isPluginEnabled("search") &&
        !hasPersistedLayout &&
        app.workspace.getLeavesOfType("search").length === 0
      ) {
        const searchLeaf = app.workspace.ensureSideLeaf("search");
        await searchLeaf.setViewState({ type: "search", state: {} });
      }
      if (disposed) return;
      setTask(activeTask, "complete");
      ready = true;
      onReady(app);
    } catch (error) {
      setTask(activeTask, "failed");
      const detail = error instanceof Error ? error.message : String(error);
      failure = {
        title: "Lapis Notes could not start",
        description:
          activeTask === "plugins"
            ? "A configured core plugin failed while the workspace was starting."
            : "The workspace could not complete its startup sequence.",
        detail,
        actions: [
          {
            id: "retry",
            label: "Retry",
            icon: "refresh-cw",
            onSelect: () => initialize(),
          },
        ],
      };
    } finally {
      booting = false;
    }
  }

  export async function dispose(persistLayout: boolean): Promise<void> {
    if (disposed) return;
    disposed = true;
    try {
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
    } finally {
      disposeApplicationCompatibility();
    }
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
    <WorkspaceStartup
      title="Opening Lapis Notes"
      {tasks}
      {failure}
    />
  {/if}
</section>
