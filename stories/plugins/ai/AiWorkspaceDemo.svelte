<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { bootAiWorkspaceDemo } from "./create-ai-workspace-demo";
  import "@lapis-notes/ai/styles.css";

  let app = $state<App | null>(null);
  let status = $state("booting");
  let error = $state("");
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
    const runtimePromise = bootAiWorkspaceDemo();
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
  <output
    class="ai-workspace-demo__status"
    data-testid="ai-workspace-status"
  >
    {status}
  </output>
  {#if error}
    <div role="alert">{error}</div>
  {:else if app}
    <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
  {/if}
</div>

<style>
  :global(body.sb-main-fullscreen:has(#storybook-root .ai-workspace-demo) #storybook-root) {
    box-sizing: border-box;
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    min-height: 0;
    overflow: hidden;
    padding: 0 !important;
  }

  :global(body:has(#storybook-root .ai-workspace-demo)) {
    overflow: hidden;
  }

  .ai-workspace-demo {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    min-height: 36rem;
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
