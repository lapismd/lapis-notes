<script lang="ts">
  import {
    App,
    type NativeDesktopVaultAdapter,
    type VaultProfile,
    type VaultSession,
  } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { onMount, untrack } from "svelte";
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
  }: {
    adapter: NativeDesktopVaultAdapter;
    profile: VaultProfile;
    session: VaultSession;
    appInfo: DesktopAppInfo;
    bridge: ElectronDesktopBridge;
    onReady(app: App): void;
    onFailure(error: unknown): void;
  } = $props();

  const app = untrack(
    () =>
      new App({
        version: appInfo.version,
        configPath: ".obsidian",
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

  onMount(() => {
    void initialize();
    return () => {
      void dispose(false);
    };
  });

  async function initialize(): Promise<void> {
    try {
      unregisterLanguageService =
        await registerElectronMarkdownLanguageServiceProvider(
          app,
          (command, payload) => bridge.invoke(command, payload),
        );
      await app.vault.load();
      await app.workspace.loadLayout();
      ready = true;
      onReady(app);
    } catch (error) {
      onFailure(error);
    }
  }

  export async function dispose(persistLayout: boolean): Promise<void> {
    if (disposed) return;
    disposed = true;

    if (persistLayout && app.workspace.layoutReady) {
      await session.vaultAdapter.mkdir(".obsidian", { recursive: true });
      await session.vaultAdapter.write(
        ".obsidian/workspace.json",
        JSON.stringify(app.workspace.getLayout(), null, 2),
      );
    }

    ready = false;
    await app.workspace.disposeWorkspaceHost();
    unregisterLanguageService?.();
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
    />
  {:else}
    <div class="desktop-host__landing" aria-live="polite">
      <div class="desktop-host__mark" aria-hidden="true">L</div>
      <h1>Lapis Notes</h1>
      <p>Opening vault…</p>
    </div>
  {/if}
</section>
