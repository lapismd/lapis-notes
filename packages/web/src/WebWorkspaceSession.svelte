<script lang="ts">
  import {
    listVaultProfiles,
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

  let {
    adapter,
    runtime = "web-pwa",
    listProfiles = listVaultProfiles,
    ...options
  }: Omit<NotesWorkspaceSessionProps, "runtime" | "listProfiles" | "host"> & {
    adapter: VaultAdapter;
    runtime?: NotesWorkspaceSessionProps["runtime"];
    listProfiles?: NotesWorkspaceSessionProps["listProfiles"];
  } = $props();
  let component: NotesWorkspaceSessionHandle | undefined = $state();
  const host = untrack(() =>
    createWebSessionHost(
      options.session,
      !!options.nativeChat,
      runtime === "web-pwa",
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

  export async function persistLayout(): Promise<void> {
    await component?.persistLayout();
  }
  export function canRecoverLeave(): boolean {
    return component?.canRecoverLeave() ?? true;
  }
  export async function dispose(persist: boolean): Promise<void> {
    await component?.dispose(persist);
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
  }}
/>
