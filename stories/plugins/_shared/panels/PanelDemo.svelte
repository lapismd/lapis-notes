<script lang="ts">
  import { onMount } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    bootPanelDemo,
    type PanelDemoKind,
    type PanelDemoLayout,
  } from "./create-panel-demo";
  import type { App } from "@lapis-notes/api";
  import "../../../workspace/lapis-editor-demo/lapis-editor-demo.css";
  import "@lapismd/mira/themes/obsidian.css";
  import "@lapismd/mira-editor/styles.css";

  let {
    kind,
    layout = "middle-top-tabs",
  }: {
    kind: PanelDemoKind;
    layout?: PanelDemoLayout;
  } = $props();

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
    const runtimePromise = bootPanelDemo(kind, layout);
    void runtimePromise.then((runtime) => {
      if (cancelled) {
        return;
      }
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
  class="panel-demo"
  data-testid="panel-demo"
  data-panel-kind={kind}
  data-panel-layout={layout}
  data-status={status}
>
  <div class="panel-demo__status" data-testid="panel-demo-status">{status}</div>
  {#if app}
    <WorkspaceShell {app} />
  {/if}
</div>

<style>
  :global(
      body.sb-main-fullscreen:has(#storybook-root .panel-demo) #storybook-root
    ) {
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    min-height: 0;
    overflow: hidden;
    padding: 0 !important;
  }

  :global(html:has(#storybook-root .panel-demo)),
  :global(body:has(#storybook-root .panel-demo)) {
    overflow: hidden;
  }

  .panel-demo {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .panel-demo > :global([data-ui-component="lapis-workspace-shell"]) {
    flex: 1 1 0;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  :global(.panel-demo-docs-canvas) .panel-demo {
    height: 700px;
    max-height: 700px;
    min-height: 700px;
  }
  .panel-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
