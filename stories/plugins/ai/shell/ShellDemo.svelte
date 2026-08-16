<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import {
    bootAiWorkspaceDemo,
    type AiWorkspaceScenario,
  } from "./create-shell-demo";
  import type { WorkspaceRequestedDisplayMode } from "@lapismd/design-core/workspace/core";
  import "@lapis-notes/ai/styles.css";

  let app = $state<App | null>(null);
  let status = $state("booting");
  let error = $state("");
  let root = $state<HTMLDivElement>();
  let {
    scenario = "default",
    displayMode = "desktop",
  }: {
    scenario?: AiWorkspaceScenario;
    displayMode?: WorkspaceRequestedDisplayMode;
  } = $props();

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
    let releaseModelCatalog: (() => void) | undefined;
    const modelCatalogGate =
      scenario === "initializing"
        ? new Promise<void>((resolve) => {
            releaseModelCatalog = resolve;
          })
        : undefined;
    const ownedRoot = root as HTMLDivElement & {
      __releaseAiInitialization?: () => void;
    };
    if (releaseModelCatalog) {
      ownedRoot.__releaseAiInitialization = releaseModelCatalog;
    }
    const runtimePromise = bootAiWorkspaceDemo({ scenario, modelCatalogGate });
    void runtimePromise
      .then((runtime) => {
        if (cancelled) return;
        app = runtime.app;
        status = "ready";
      })
      .catch((reason) => {
        if (cancelled) return;
        status = "failed";
        error = reason instanceof Error ? reason.message : String(reason);
      });
    return () => {
      cancelled = true;
      releaseModelCatalog?.();
      delete ownedRoot.__releaseAiInitialization;
      void runtimePromise
        .then((runtime) => runtime.dispose())
        .catch(() => undefined);
    };
  });
</script>

<div
  bind:this={root}
  class="ai-workspace-demo"
  data-testid="ai-workspace-demo"
  data-status={status}
>
  <output class="ai-workspace-demo__status" data-testid="ai-workspace-status">
    {status}
  </output>
  {#if error}
    <div role="alert">{error}</div>
  {:else if app}
    <WorkspaceShell {app} {displayMode} workspaceLabel="Lapis Notes" />
  {/if}
</div>

<style>
  :global(
      body.sb-main-fullscreen:has(#storybook-root .ai-workspace-demo)
        #storybook-root
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

  :global(html:has(#storybook-root .ai-workspace-demo)),
  :global(body:has(#storybook-root .ai-workspace-demo)) {
    overflow: hidden;
  }

  .ai-workspace-demo {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    max-height: 100%;
    min-height: 100vh;
    overflow: hidden;
  }

  .ai-workspace-demo > :global([data-ui-component="lapis-workspace-shell"]) {
    flex: 1 1 0;
    height: 100%;
    min-height: 0;
    max-height: 100%;
  }

  :global(.workspace-shell-docs-canvas) .ai-workspace-demo {
    height: 700px;
    max-height: 700px;
    min-height: 700px;
  }

  .ai-workspace-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
