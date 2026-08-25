<script lang="ts">
  import {
    NativeDesktopVaultAdapter,
    clearCurrentVaultProfile,
    createNativeDesktopVault,
    createVaultSession,
    getCurrentVaultProfile,
    pickNativeDesktopVault,
    saveVaultProfile,
    type App,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import {
    WorkspaceStartup,
    type WorkspaceStartupTask,
  } from "@lapismd/design-core/workspace/startup";
  import { onMount, tick } from "svelte";
  import DesktopVaultLauncher, {
    type LauncherStatus,
  } from "./DesktopVaultLauncher.svelte";
  import DesktopWorkspaceSession from "./DesktopWorkspaceSession.svelte";
  import { DenoDesktopAppDatabaseProvider } from "./deno-app-database";
  import type { DenoDesktopBridge, DesktopAppInfo } from "./main";

  type HostStatus = "loading" | "landing" | "opening" | "ready" | "error";
  type PreparedSession = {
    adapter: NativeDesktopVaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    appInfo: DesktopAppInfo;
  };
  type SessionComponent = {
    dispose(persistLayout: boolean): Promise<void>;
    persistLayout(): Promise<void>;
  };

  const RESTORE_TASKS: WorkspaceStartupTask[] = [
    { id: "vault", label: "Opening vault", status: "active" },
  ];

  let { bridge }: { bridge: DenoDesktopBridge } = $props();
  let status = $state<HostStatus>("loading");
  let prepared = $state<PreparedSession | null>(null);
  let activeApp = $state<App | null>(null);
  let sessionComponent = $state<SessionComponent | null>(null);
  let launcherOpen = $state(false);
  let bootGate = $state(true);
  let errorMessage = $state("");
  let switchQueue = Promise.resolve();
  const pendingAppUrls: string[] = [];

  const showChooser = $derived(
    launcherOpen ||
      (!prepared &&
        (status === "landing" ||
          status === "error" ||
          (status === "opening" && !bootGate))),
  );
  const canReturn = $derived(launcherOpen && prepared !== null);

  onMount(() => {
    const disposeOpenVault = bridge.onOpenVaultPicker?.(() => {
      void showLauncher();
    });
    const disposeOpenAbout = bridge.onOpenAboutDialog?.(() => {
      if (activeApp) {
        void activeApp.commands.executeCommand("app:about").catch(() => {});
      }
    });
    const disposeAppUrl = bridge.onAppUrlOpen?.((url) => {
      if (activeApp?.workspace.layoutReady) {
        void activeApp.urls.dispatch(url);
      } else {
        pendingAppUrls.push(url);
      }
    });
    const disposeBeforeClose = bridge.onBeforeClose?.(() => {
      void serialize(async () => {
        try {
          await disposeActiveSession(true);
        } finally {
          await bridge.shutdownTelemetry().catch(() => {});
          await bridge.invoke("desktop_renderer_close_ready").catch(() => {});
        }
      });
    });
    void restoreVault();
    return () => {
      disposeOpenVault?.();
      disposeOpenAbout?.();
      disposeAppUrl?.();
      disposeBeforeClose?.();
      void disposeActiveSession(false);
      void bridge.shutdownTelemetry();
    };
  });

  function serialize(task: () => Promise<void>): Promise<void> {
    switchQueue = switchQueue.then(task, task);
    return switchQueue;
  }

  async function restoreVault(): Promise<void> {
    try {
      const profile = await getCurrentVaultProfile();
      if (profile?.kind === "desktop-folder") {
        try {
          status = "opening";
          const adapter = await NativeDesktopVaultAdapter.fromProfile(profile);
          await openVault(adapter, profile);
          return;
        } catch {
          await clearCurrentVaultProfile();
        }
      } else if (profile) {
        await clearCurrentVaultProfile();
      }
      status = "landing";
    } finally {
      if (!prepared) bootGate = false;
    }
  }

  function showLauncher(): Promise<void> {
    return serialize(async () => {
      if (sessionComponent) await sessionComponent.persistLayout();
      errorMessage = "";
      launcherOpen = true;
    });
  }

  function hideLauncher(): void {
    launcherOpen = false;
  }

  function chooseVault(): Promise<void> {
    return serialize(async () => {
      status = "opening";
      errorMessage = "";
      try {
        const selection = await pickNativeDesktopVault();
        if (!selection) {
          status = prepared && launcherOpen ? "ready" : "landing";
          return;
        }
        await resumeOrReplace(selection.adapter, selection.profile);
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
        status = prepared && launcherOpen ? "ready" : "error";
      }
    });
  }

  function createVault(): Promise<void> {
    return serialize(async () => {
      status = "opening";
      errorMessage = "";
      try {
        const selection = await createNativeDesktopVault();
        if (!selection) {
          status = prepared && launcherOpen ? "ready" : "landing";
          return;
        }
        await resumeOrReplace(selection.adapter, selection.profile);
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
        status = prepared && launcherOpen ? "ready" : "error";
      }
    });
  }

  function openRecentVault(profile: VaultProfile): Promise<void> {
    return serialize(async () => {
      status = "opening";
      errorMessage = "";
      try {
        const activatedProfile = { ...profile, updatedAt: Date.now() };
        await saveVaultProfile(activatedProfile);
        const adapter =
          await NativeDesktopVaultAdapter.fromProfile(activatedProfile);
        await resumeOrReplace(adapter, activatedProfile);
      } catch (error) {
        await clearCurrentVaultProfile();
        errorMessage = error instanceof Error ? error.message : String(error);
        status = prepared && launcherOpen ? "ready" : "error";
      }
    });
  }

  function isCurrentProfile(profile: VaultProfile): boolean {
    return prepared?.profile.id === profile.id;
  }

  async function resumeOrReplace(
    adapter: NativeDesktopVaultAdapter,
    profile: VaultProfile,
  ): Promise<void> {
    if (isCurrentProfile(profile)) {
      launcherOpen = false;
      status = "ready";
      return;
    }
    const replacing = prepared !== null || sessionComponent !== null;
    launcherOpen = false;
    if (replacing) bootGate = true;
    status = "opening";
    await openVault(adapter, profile);
  }

  async function openVault(
    adapter: NativeDesktopVaultAdapter,
    profile: VaultProfile,
  ): Promise<void> {
    status = "opening";
    await disposeActiveSession(true);
    const session = await createVaultSession(adapter, {
      runtime: "deno-desktop",
      profile,
      appDatabaseProvider: new DenoDesktopAppDatabaseProvider(bridge),
    });
    try {
      const appInfo = await bridge
        .invoke<DesktopAppInfo>("desktop_app_info_get")
        .catch(() => ({
          name: "Lapis Notes",
          version: "2026.31.5",
          buildTime: null,
          copyright: "Copyright © Lapis Notes contributors.",
        }));
      prepared = { adapter, profile, session, appInfo };
      await tick();
    } catch (error) {
      await disposeActiveSession(false);
      throw error;
    }
  }

  function handleSessionReady(app: App): void {
    activeApp = app;
    status = "ready";
    for (const url of pendingAppUrls.splice(0)) {
      void app.urls.dispatch(url);
    }
  }

  async function disposeActiveSession(persistLayout: boolean): Promise<void> {
    const current = sessionComponent;
    const pendingSession = prepared?.session;
    if (current) {
      await current.dispose(persistLayout);
    } else if (pendingSession) {
      await pendingSession.close();
    }
    sessionComponent = null;
    prepared = null;
    activeApp = null;
    await tick();
  }
</script>

<main class="desktop-host" data-desktop-host-state={status}>
  {#if prepared}
    <div class="desktop-host__session" hidden={launcherOpen} inert={launcherOpen}>
      <DesktopWorkspaceSession
        bind:this={sessionComponent}
        {...prepared}
        {bridge}
        onReady={handleSessionReady}
        onOpenRecent={openRecentVault}
        onManageVaults={showLauncher}
      />
    </div>
  {/if}
  {#if showChooser}
    <DesktopVaultLauncher
      status={status as LauncherStatus}
      {errorMessage}
      {canReturn}
      onCreate={createVault}
      onOpen={chooseVault}
      onOpenRecent={openRecentVault}
      onClose={hideLauncher}
    />
  {:else if !prepared}
    <WorkspaceStartup title="Opening Lapis Notes" tasks={RESTORE_TASKS} />
  {/if}
</main>
