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
  import { onMount, tick } from "svelte";
  import DesktopVaultLauncher, {
    type LauncherStatus,
  } from "./DesktopVaultLauncher.svelte";
  import DesktopWorkspaceSession from "./DesktopWorkspaceSession.svelte";
  import type { ElectronDesktopBridge } from "./main";

  type HostStatus = "loading" | "landing" | "opening" | "ready" | "error";
  export type DesktopAppInfo = {
    name: string;
    version: string;
    buildTime: string | null;
    copyright: string;
  };
  type PreparedSession = {
    adapter: NativeDesktopVaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    appInfo: DesktopAppInfo;
  };
  type SessionComponent = {
    dispose(persistLayout: boolean): Promise<void>;
  };

  let { bridge }: { bridge: ElectronDesktopBridge } = $props();
  let status = $state<HostStatus>("loading");
  let prepared = $state<PreparedSession | null>(null);
  let activeApp = $state<App | null>(null);
  let sessionComponent = $state<SessionComponent | null>(null);
  let errorMessage = $state("");
  let switchQueue = Promise.resolve();
  let resolvePrepared: ((app: App) => void) | null = null;
  let rejectPrepared: ((error: Error) => void) | null = null;
  const pendingAppUrls: string[] = [];

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
    };
  });

  function serialize(task: () => Promise<void>): Promise<void> {
    switchQueue = switchQueue.then(task, task);
    return switchQueue;
  }

  async function restoreVault(): Promise<void> {
    const profile = await getCurrentVaultProfile();
    if (profile?.kind === "desktop-folder") {
      try {
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
  }

  function showLauncher(): Promise<void> {
    return serialize(async () => {
      errorMessage = "";
      if (prepared || activeApp || sessionComponent) {
        await disposeActiveSession(true);
      }
      status = "landing";
    });
  }

  function chooseVault(): Promise<void> {
    return serialize(async () => {
      status = "opening";
      errorMessage = "";
      try {
        const selection = await pickNativeDesktopVault();
        if (!selection) {
          status = "landing";
          return;
        }
        await openVault(selection.adapter, selection.profile);
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
        status = "error";
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
          status = "landing";
          return;
        }
        await openVault(selection.adapter, selection.profile);
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
        status = "error";
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
        await openVault(adapter, activatedProfile);
      } catch (error) {
        await clearCurrentVaultProfile();
        errorMessage = error instanceof Error ? error.message : String(error);
        status = "error";
      }
    });
  }

  async function openVault(
    adapter: NativeDesktopVaultAdapter,
    profile: VaultProfile,
  ): Promise<void> {
    status = "opening";
    await disposeActiveSession(true);
    const session = await createVaultSession(adapter, {
      runtime: "electron-desktop",
      profile,
    });
    try {
      await session.appDatabase?.open();
      const appInfo = await bridge
        .invoke<DesktopAppInfo>("desktop_app_info_get")
        .catch(() => ({
          name: "Lapis Notes",
          version: "2026.31.5",
          buildTime: null,
          copyright: "Copyright © Lapis Notes contributors.",
        }));
      const ready = new Promise<App>((resolve, reject) => {
        resolvePrepared = resolve;
        rejectPrepared = reject;
      });
      prepared = { adapter, profile, session, appInfo };
      await tick();
      const app = await ready;
      activeApp = app;
      status = "ready";
      for (const url of pendingAppUrls.splice(0)) {
        await app.urls.dispatch(url);
      }
    } catch (error) {
      await disposeActiveSession(false);
      throw error;
    } finally {
      resolvePrepared = null;
      rejectPrepared = null;
    }
  }

  function handleSessionReady(app: App): void {
    resolvePrepared?.(app);
  }

  function handleSessionFailure(error: unknown): void {
    rejectPrepared?.(error instanceof Error ? error : new Error(String(error)));
  }

  async function disposeActiveSession(persistLayout: boolean): Promise<void> {
    const current = sessionComponent;
    const pendingSession = prepared?.session;
    if (current) {
      await current.dispose(persistLayout);
    } else if (pendingSession) {
      await pendingSession.close();
    }
    bridge.closeAllWatches?.();
    sessionComponent = null;
    prepared = null;
    activeApp = null;
    await tick();
  }
</script>

<main class="desktop-host" data-desktop-host-state={status}>
  {#if prepared}
    <DesktopWorkspaceSession
      bind:this={sessionComponent}
      {...prepared}
      {bridge}
      onReady={handleSessionReady}
      onFailure={handleSessionFailure}
    />
  {:else}
    <DesktopVaultLauncher
      status={status as LauncherStatus}
      {errorMessage}
      onCreate={createVault}
      onOpen={chooseVault}
      onOpenRecent={openRecentVault}
    />
  {/if}
</main>
