<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { bootCvFileViewDemo } from "./create-cv-file-view-demo";
  import "../lapis-editor-demo/lapis-editor-demo.css";
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
    const runtimePromise = bootCvFileViewDemo();
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
  class="cv-file-view-demo"
  data-testid="cv-file-view-demo"
  data-status={status}
>
  <div class="cv-file-view-demo__status" data-testid="cv-file-view-status">
    {status}
  </div>
  {#if app}
    <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
  {/if}
</div>

<style>
  .cv-file-view-demo {
    position: relative;
    height: 100%;
    min-height: 36rem;
  }

  :global(.workspace-shell-docs-canvas) .cv-file-view-demo {
    height: 700px;
    min-height: 700px;
  }

  .cv-file-view-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }
</style>
