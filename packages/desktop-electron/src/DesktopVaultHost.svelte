<script lang="ts">
  import {
    NativeDesktopVaultAdapter,
    clearCurrentVaultProfile,
    createVaultSession,
    getCurrentVaultProfile,
    pickNativeDesktopVault,
    type App,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import { onMount, tick } from "svelte";
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
      void chooseVault();
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

    void restoreOrPickVault();
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

  async function restoreOrPickVault(): Promise<void> {
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
    await chooseVault();
  }

  function chooseVault(): Promise<void> {
    return serialize(async () => {
      const previousStatus = status;
      status = "opening";
      errorMessage = "";
      try {
        const selection = await pickNativeDesktopVault();
        if (!selection) {
          status = activeApp ? previousStatus : "landing";
          return;
        }
        await openVault(selection.adapter, selection.profile);
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
        status = activeApp ? "ready" : "error";
      }
    });
  }

  async function openVault(
    adapter: NativeDesktopVaultAdapter,
    profile: VaultProfile,
  ): Promise<void> {
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
      if (!prepared) await session.close();
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
    if (current) await current.dispose(persistLayout);
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
    <section class="desktop-host__landing" aria-live="polite">
      <div class="desktop-host__mark" aria-hidden="true">L</div>
      <h1>Lapis Notes</h1>
      {#if status === "loading"}
        <p>Restoring your vault…</p>
      {:else if status === "opening"}
        <p>Opening vault…</p>
      {:else}
        <p>Choose a folder to use as your Lapis Notes vault.</p>
        {#if errorMessage}
          <p class="desktop-host__error" role="alert">{errorMessage}</p>
        {/if}
        <button type="button" onclick={() => void chooseVault()}>
          Open Vault…
        </button>
      {/if}
    </section>
  {/if}
</main>
