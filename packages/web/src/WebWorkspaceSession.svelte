<script lang="ts">
  import {
    listVaultProfiles,
    saveBootstrapAppearanceMode,
    type BootstrapAppearanceMode,
    type App,
    requestBrowserStoragePersistence,
    type VaultAdapter,
  } from "@lapis-notes/api";
  import { createConfiguredNotesLocalPluginDistribution } from "@lapis-notes/app-profile";
  import {
    NotesWorkspaceSession,
    type NotesWorkspaceSessionProps,
    type NotesWorkspaceSessionHandle,
  } from "@lapis-notes/app-profile/workspace-session";
  import { onMount, untrack } from "svelte";
  import { createWebPluginAssetServer } from "./plugin-asset-server";
  import { createWebSessionHost } from "./web-session-host";
  import { observeWebHostAppearance } from "@lapis-notes/app-profile/browser-presentation";

  let {
    adapter,
    runtime = "web-pwa",
    listProfiles = listVaultProfiles,
    onPreparePwaUpdate,
    ...options
  }: Omit<NotesWorkspaceSessionProps, "runtime" | "listProfiles" | "host"> & {
    adapter: VaultAdapter;
    runtime?: NotesWorkspaceSessionProps["runtime"];
    listProfiles?: NotesWorkspaceSessionProps["listProfiles"];
    onPreparePwaUpdate?: () => Promise<void>;
  } = $props();
  let component: NotesWorkspaceSessionHandle | undefined = $state();
  let ownedApp: App | undefined = $state();
  const host = untrack(() =>
    createWebSessionHost(
      options.session,
      !!options.nativeChat,
      runtime === "web-pwa",
      onPreparePwaUpdate ?? (() => dispose(true)),
    ),
  );
  const pluginAssetServer = untrack(
    () => options.pluginAssetServer ?? createWebPluginAssetServer({ adapter }),
  );
  const pluginDistributionOptions = untrack(() =>
    createConfiguredNotesLocalPluginDistribution(
      import.meta.env,
      options.pluginDistributionOptions,
    ),
  );

  onMount(() => {
    if (runtime === "web-pwa")
      void requestBrowserStoragePersistence().catch(() => undefined);
  });

  $effect(() => {
    if (runtime !== "web-pwa" || !ownedApp) return;
    const mode = ownedApp.configuration
      .getConfiguration()
      .get<BootstrapAppearanceMode>("appearence.baseColorSchema", "system");
    void saveBootstrapAppearanceMode(mode).catch((error) =>
      console.error("Could not persist the browser startup appearance", error),
    );
    return observeWebHostAppearance(mode);
  });

  export async function persistLayout(): Promise<void> {
    await component?.persistLayout();
  }
  export function canRecoverLeave(): boolean {
    return component?.canRecoverLeave() ?? true;
  }
  export async function dispose(persist: boolean): Promise<void> {
    await component?.dispose(persist);
    if (!component?.canRecoverLeave()) ownedApp = undefined;
  }
</script>

<NotesWorkspaceSession
  bind:this={
    () => component,
    (session) => {
      if (session) component = session;
    }
  }
  {...options}
  {runtime}
  {listProfiles}
  {host}
  {pluginAssetServer}
  {pluginDistributionOptions}
  onReady={async (app) => {
    await options.onReady(app);
    const launch = new URL(window.location.href);
    if (launch.pathname === "/open") {
      const url = launch.searchParams.get("url");
      if (url) await app.urls.dispatch(url);
    }
    ownedApp = app;
  }}
/>
