<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { bootCvPluginShellDemo } from "./create-cv-plugin-shell-demo";
  import "@lapismd/mira/themes/obsidian.css";
  import "@lapismd/mira-editor/styles.css";

  let app = $state<App | null>(null);
  let status = $state("booting");
  let root = $state<HTMLDivElement>();

  $effect(() => {
    if (!root || !app) return;
    const ownedRoot = root as HTMLDivElement & { __lapisApp?: App };
    ownedRoot.__lapisApp = app;
    return () => {
      if (ownedRoot.__lapisApp === app) delete ownedRoot.__lapisApp;
    };
  });

  onMount(() => {
    let cancelled = false;
    const runtimePromise = bootCvPluginShellDemo();
    void runtimePromise.then((runtime) => {
      if (cancelled) return;
      app = runtime.app;
      status = "ready";
    });
    return () => {
      cancelled = true;
      void runtimePromise.then((runtime) => runtime.dispose());
    };
  });
</script>

<div
  bind:this={root}
  class="cv-plugin-shell-demo"
  data-testid="cv-plugin-shell-demo"
  data-status={status}
>
  <div class="cv-plugin-shell-demo__status" data-testid="cv-plugin-shell-status">
    {status}
  </div>
  {#if app}
    <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
  {/if}
</div>

<style>
  :global(#storybook-root:has(.cv-plugin-shell-demo)) {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    max-height: 100%;
    min-height: 0;
    overflow: hidden;
    padding: 0 !important;
  }

  :global(body:has(#storybook-root .cv-plugin-shell-demo)) {
    overflow: hidden;
  }

  .cv-plugin-shell-demo {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    min-height: 36rem;
    overflow: hidden;
  }

  .cv-plugin-shell-demo > :global(.ui-minimal-app-shell) {
    flex: 1 1 0;
    height: 100%;
    min-height: 0;
    max-height: 100%;
  }

  :global(.workspace-shell-docs-canvas) .cv-plugin-shell-demo {
    height: 700px;
    min-height: 700px;
  }

  .cv-plugin-shell-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }
</style>
