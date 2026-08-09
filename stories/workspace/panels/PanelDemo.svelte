<script lang="ts">
  import { onMount } from "svelte";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    bootPanelDemo,
    type PanelDemoKind,
    type PanelDemoLayout,
  } from "./create-panel-demo";
  import type { App } from "@lapis-notes/api";
  import "../lapis-editor-demo/lapis-editor-demo.css";
  import "@lapismd/mira/themes/obsidian.css";
  import "@lapismd/mira-editor/styles.css";

  let {
    kind,
    layout = "comparison",
  }: {
    kind: PanelDemoKind;
    layout?: PanelDemoLayout;
  } = $props();

  let app = $state<App | null>(null);
  let status = $state("booting");
  let dispose: (() => Promise<void>) | null = null;

  onMount(() => {
    let cancelled = false;
    void bootPanelDemo(kind, layout).then((runtime) => {
      if (cancelled) {
        void runtime.dispose();
        return;
      }
      app = runtime.app;
      dispose = runtime.dispose;
      status = "ready";
    });
    return () => {
      cancelled = true;
      void dispose?.();
    };
  });
</script>

<div
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
  .panel-demo {
    position: relative;
    height: 100%;
    min-height: 36rem;
  }
  :global(.panel-demo-docs-canvas) .panel-demo {
    height: 22rem;
    min-height: 22rem;
  }
  .panel-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
