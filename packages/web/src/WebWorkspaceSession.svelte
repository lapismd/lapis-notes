<script lang="ts">
  import {
    appStatePath,
    DEFAULT_APP_STATE_DIRECTORY,
  } from "@lapis-notes/api/path";

  import {
    App,
    type AppPluginDistributionOptions,
    createBrowserSyncUnlockHandler,
    installApplicationCompatibility,
    listVaultProfiles,
    provideApplicationState,
    requestBrowserStoragePersistence,
    takeHostSyncService,
    type SyncHostService,
    registerDefaultDailyDocumentProvider,
    type BrowserCoordinatedAppDatabase,
    type PluginAssetServer,
    type VaultAdapter,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import {
    createConfiguredNotesLocalPluginDistribution,
    notesPluginProfile,
    registerNotesPluginSettings,
    registerNotesPluginBrowser,
  } from "@lapis-notes/app-profile";
  import {
    createNativeChatPlugin,
    prepareNativeChatLeave,
    type NativeChatHost,
  } from "@lapis-notes/app-profile/native-chat";
  import {
    registerNativeRepository,
    type RepositoryFactory,
  } from "@lapis-notes/app-profile/native-repository";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import {
    WorkspaceStartup,
    type WorkspaceStartupFailure,
    type WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import { onMount, untrack } from "svelte";
  import { createWorkspaceLeave } from "./workspace/leave";
  import {
    webPluginRestrictionsFor,
    removeObsoleteServiceSecrets,
  } from "./desktop-plugin-policy";
  import { registerWebVaultTransferSettings } from "./vault-transfer-settings";
  import { createWebPluginAssetServer } from "./plugin-asset-server";
  import { setPwaRuntimeApplication } from "./pwa-runtime-application";

  let {
    adapter,
    profile,
    session,
    onReady,
    onOpenRecent,
    onManageVaults,
    runtime = "web-pwa",
    listProfiles = listVaultProfiles,
    pluginAssetServer,
    pluginDistributionOptions,
    nativeChat,
    repositoryFactory,
  }: {
    adapter: VaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    onReady(): void;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onManageVaults(): Promise<void>;
    runtime?: "web-pwa" | "node-server" | "rust-server";
    listProfiles?: () => Promise<VaultProfile[]>;
    pluginAssetServer?: PluginAssetServer;
    pluginDistributionOptions?: AppPluginDistributionOptions;
    nativeChat?: (app: App) => NativeChatHost;
    repositoryFactory?: RepositoryFactory;
  } = $props();

  const staticPluginDistributionOptions = untrack(() =>
    createConfiguredNotesLocalPluginDistribution(
      import.meta.env,
      pluginDistributionOptions,
    ),
  );

  const STARTUP_TASKS: WorkspaceStartupTask[] = [
    { id: "vault", label: "Open the vault", status: "pending" },
    { id: "configuration", label: "Load app configuration", status: "pending" },
    { id: "plugins", label: "Load configured core plugins", status: "pending" },
    { id: "layout", label: "Restore the workspace layout", status: "pending" },
  ];

  const app = untrack(() => {
    let ownedApp!: App;
    let hostSync!: SyncHostService;
    const requestCryptoUnlock = createBrowserSyncUnlockHandler({
      database: session.appDatabase!,
      getSyncHost: () => hostSync,
      rpName: "Lapis Notes",
      interaction: {
        confirmPasskeyEnrollment: async () =>
          globalThis.confirm(
            "Protect this vault's sync keys with a passkey on this device?",
          ),
        requestPassphrase: async (_pluginId, mode) => {
          const passphrase = globalThis.prompt(
            mode === "enroll"
              ? "Create a sync passphrase (at least 10 characters). Keep it somewhere safe; Lapis cannot recover it."
              : "Enter the sync passphrase for this vault.",
          );
          if (passphrase == null || mode === "unlock") return passphrase;
          const confirmation = globalThis.prompt(
            "Enter the new sync passphrase again to confirm it.",
          );
          if (confirmation !== passphrase) {
            throw new Error("Sync passphrase confirmation did not match");
          }
          return passphrase;
        },
      },
    });
    ownedApp = new App({
      version: "2026.6.3",
      configPath: appStatePath("app.json"),
      session,
      syncHost: {
        requestCryptoUnlock,
        requestRecoveryPassphrase: async (_pluginId, mode) => {
          const passphrase = globalThis.prompt(
            mode === "export"
              ? "Create a recovery-bundle passphrase (at least 10 characters)."
              : "Enter the recovery-bundle passphrase.",
          );
          if (passphrase == null || mode === "import") return passphrase;
          const confirmation = globalThis.prompt(
            "Enter the recovery-bundle passphrase again to confirm it.",
          );
          if (confirmation !== passphrase) {
            throw new Error("Recovery passphrase confirmation did not match");
          }
          return passphrase;
        },
        requestNetworkOriginGrant: async ({
          pluginId,
          origin,
          allowPrivateNetwork,
        }) =>
          globalThis.confirm(
            `${pluginId} wants to connect to ${origin}.${
              allowPrivateNetwork
                ? " This grants access to a private or loopback network address."
                : ""
            } Allow this exact origin?`,
          ),
      },
      pluginAssetServer:
        pluginAssetServer ?? createWebPluginAssetServer({ adapter }),
      pluginDistributionOptions: staticPluginDistributionOptions,
      unavailablePlugins: webPluginRestrictionsFor(!!nativeChat),
      workspaceShell: {
        application: {
          name: "Lapis Notes",
          buildTime: null,
          copyright: "Copyright © Lapis Notes contributors.",
        },
        notifications: true,
      },
      markdownRenderer: async () => {},
    });
    hostSync = takeHostSyncService(ownedApp);
    return ownedApp;
  });
  let disposeRepositoryBinding: (() => void) | undefined;
  provideApplicationState(app);
  const disposeApplicationCompatibility = installApplicationCompatibility(app);
  const disposePluginManagementSettings = registerNotesPluginSettings(app);
  const disposePluginBrowser = registerNotesPluginBrowser(app);
  const dailyDocumentProvider = registerDefaultDailyDocumentProvider(app);
  const disposePwaRuntimeApplication = untrack(() =>
    runtime === "web-pwa" ? setPwaRuntimeApplication(app) : () => {},
  );
  let ready = $state(false);
  let tasks = $state<WorkspaceStartupTask[]>(structuredClone(STARTUP_TASKS));
  let failure = $state<WorkspaceStartupFailure | null>(null);
  let disposed = false;
  // Match Desktop's stop/drain/guard order; session closure stays outside the guard.
  const leaveWorkspace = createWorkspaceLeave({
    preflight: async () => {
      await app.vaultChanges.stop();
      await app.workspace.flushPluginChanges();
      await app.plugins.flushPendingConfigWrites();
      await app.fileEditingSessions.settleOperations();
      await app.fileEditingSessions.preflightNativeRecovery();
    },
    commit: disposeOwnedWorkspace,
    isDisposed: () => disposed,
    onRefused: async (error) => {
      let failure = error;
      try {
        await app.vaultChanges.start();
      } catch (resume) {
        failure = new AggregateError(
          [error, resume],
          "Leaving failed and file watching could not resume",
        );
      }
      app.notifications.notify({
        title: "Vault could not close",
        message: failure instanceof Error ? failure.message : String(failure),
        severity: "error",
        source: "workspace",
        persist: true,
      });
      if (failure !== error) throw failure;
    },
  });
  let booting = false;
  let corePluginsRegistered = false;
  let stopMetadataTracking: (() => void) | null = null;
  let disposeDatabaseStatus: (() => void) | null = null;
  let disposeCoordinationListener: (() => void) | null = null;
  let disposeVaultTransferSettings: (() => void) | null = null;
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
    void requestBrowserStoragePersistence().catch(() => undefined);
    void initialize();
    return () => {
      void dispose(false);
    };
  });

  function startMetadataCache(): void {
    if (disposed || stopMetadataTracking) return;
    stopMetadataTracking = app.metadataTypeManager.trackChanges();
    void app.metadataCache.load();
  }

  function setTask(
    id: string,
    taskStatus: WorkspaceStartupTask["status"],
    detail?: string,
  ): void {
    tasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            status: taskStatus,
            detail: taskStatus === "active" ? detail : undefined,
          }
        : task,
    );
  }

  function syncDatabaseStatus(role: "owner" | "proxy" | "server"): void {
    disposeDatabaseStatus?.();
    disposeDatabaseStatus = getWorkspaceHostBinding(
      app.workspace,
    ).controller.status.addItem({
      id: "app:web-database-role",
      label:
        role === "server"
          ? "Server DB"
          : role === "proxy"
            ? "DB Proxy"
            : "DB Owner",
      icon: "database",
      tooltip:
        role === "server"
          ? "Application data is managed by the authenticated Lapis server."
          : role === "proxy"
            ? "Database requests are delegated to this vault's owner tab."
            : "This tab owns the local Turso database for this vault.",
      align: "right",
      priority: 850,
    });
  }

  function registerDatabaseStatus(): void {
    if (runtime === "node-server" || runtime === "rust-server") {
      syncDatabaseStatus("server");
      return;
    }
    const role =
      session.appDatabase?.descriptor.role === "proxy" ? "proxy" : "owner";
    syncDatabaseStatus(role);
    const coordinated = session.appDatabase as BrowserCoordinatedAppDatabase & {
      onCoordinationModeChange?: (
        listener: (mode: "turso-owner" | "turso-proxy") => void,
      ) => () => void;
    };
    disposeCoordinationListener =
      coordinated.onCoordinationModeChange?.((mode) =>
        syncDatabaseStatus(mode === "turso-proxy" ? "proxy" : "owner"),
      ) ?? null;
  }

  async function teardownPartialBoot(): Promise<void> {
    ready = false;
    stopMetadataTracking?.();
    stopMetadataTracking = null;
    disposeCoordinationListener?.();
    disposeDatabaseStatus?.();
    disposeVaultTransferSettings?.();
    disposeCoordinationListener = null;
    disposeDatabaseStatus = null;
    disposeVaultTransferSettings = null;
    await app.vaultChanges.stop().catch(() => undefined);
    // Retry reuses this App. Its controller/cache observers retire on final dispose.
    for (const plugin of [...app.plugins.plugins.values()].reverse()) {
      await plugin.disable().catch(() => undefined);
    }
  }

  async function initialize(): Promise<void> {
    if (disposed || booting) return;
    booting = true;
    failure = null;
    tasks = structuredClone(STARTUP_TASKS);
    let activeTask = "vault";
    try {
      if (corePluginsRegistered || stopMetadataTracking) {
        await teardownPartialBoot();
      }
      if (disposed) return;

      setTask(activeTask, "active");
      if (!corePluginsRegistered) {
        app.plugins.registerStaticPlugins(notesPluginProfile);
        if (repositoryFactory)
          disposeRepositoryBinding = registerNativeRepository(app, repositoryFactory);
        if (nativeChat)
          app.plugins.registerStaticPlugins([
            {
              plugin: createNativeChatPlugin(nativeChat),
              required: false,
              enabledByDefault: false,
            },
          ]);
        corePluginsRegistered = true;
      }
      await app.vault.load();
      await app.vault.mkpath(DEFAULT_APP_STATE_DIRECTORY);
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "configuration";
      setTask(activeTask, "active");
      await app.configuration.load();
      await removeObsoleteServiceSecrets(app);
      disposeVaultTransferSettings?.();
      if (runtime === "web-pwa") {
        disposeVaultTransferSettings = registerWebVaultTransferSettings(app);
      }
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "plugins";
      setTask(activeTask, "active");
      await app.plugins.loadPlugins({
        communityPlugins: "configured",
        optionalCorePlugins: "configured",
        onProgress: ({ name }) => {
          setTask(activeTask, "active", `Loading ${name}`);
        },
      });
      if (disposed) return;
      setTask(activeTask, "complete");

      activeTask = "layout";
      setTask(activeTask, "active");
      await app.workspace.loadLayout();
      recentVaults = await listProfiles();
      registerDatabaseStatus();
      await app.vaultChanges.start();
      if (disposed) return;
      setTask(activeTask, "complete");
      ready = true;
      onReady();
      startMetadataCache();
      const launch = new URL(window.location.href);
      if (launch.pathname === "/open") {
        const url = launch.searchParams.get("url");
        if (url) await app.urls.dispatch(url);
      }
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

  async function writeWorkspaceLayout(): Promise<void> {
    if (!app.workspace.layoutReady) return;
    const serializedLayout = JSON.stringify(app.workspace.getLayout(), null, 2);
    await session.vaultAdapter.mkdir(DEFAULT_APP_STATE_DIRECTORY, {
      recursive: true,
    });
    await session.vaultAdapter.write(
      appStatePath("workspace.json"),
      serializedLayout,
    );
  }

  export async function persistLayout(): Promise<void> {
    if (disposed) return;
    await writeWorkspaceLayout();
  }

  export function canRecoverLeave(): boolean {
    return !disposed;
  }

  export function dispose(persistLayout: boolean): Promise<void> {
    return leaveWorkspace(persistLayout);
  }

  async function disposeOwnedWorkspace(persistLayout: boolean): Promise<void> {
    if (disposed) return;
    try {
      await app.fileEditingSessions.guard(undefined, async () => {
        await app.workspace.flushLayout();
        if (persistLayout) await writeWorkspaceLayout();
        // Every writer has flushed and remains protected before this fence.
        disposed = true;
        const nativeTasksDetached = app.nativeTasks?.detach();
        prepareNativeChatLeave(app, "detach");
        await nativeTasksDetached;
        ready = false;
        await app.workspace.disposeWorkspaceHost();
        stopMetadataTracking?.();
        stopMetadataTracking = null;
        await app.metadataCache.dispose();
        for (const plugin of [...app.plugins.plugins.values()].reverse()) {
          await plugin.disable().catch(() => undefined);
        }
        disposeCoordinationListener?.();
        disposeDatabaseStatus?.();
        disposeVaultTransferSettings?.();
        disposeCoordinationListener = null;
        disposeDatabaseStatus = null;
        disposeVaultTransferSettings = null;
      });
      // Closing the registry/session inside its queued guard would re-enter it.
      await app.fileEditingSessions.dispose();
      await session.close();
    } finally {
      if (disposed) {
        disposeRepositoryBinding?.();
        dailyDocumentProvider.dispose();
        disposePluginBrowser();
        disposePluginManagementSettings();
        disposePwaRuntimeApplication();
        disposeApplicationCompatibility();
      }
    }
  }

</script>

<section
  class="web-host__workspace"
  data-web-runtime={runtime}
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
    <WorkspaceStartup title="Opening Lapis Notes" {tasks} {failure} />
  {/if}
</section>
