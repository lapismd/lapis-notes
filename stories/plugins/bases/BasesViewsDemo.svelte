<script lang="ts">
  import { onMount } from "svelte";
  import type { App } from "@lapis-notes/api";
  import {
    BasesViewSurface,
    type BasesDocument,
  } from "@lapis-notes/bases";
  import { bootBasesViewsDemo } from "./create-bases-views-demo";
  import {
    createBasesViewsDocument,
    createBasesStoryRegistrations,
    type BasesViewScenario,
  } from "./bases-views-fixture";

  let { scenario }: { scenario: BasesViewScenario } = $props();

  let app = $state<App | null>(null);
  let document = $state<BasesDocument | null>(null);
  let status = $state("booting");
  let error = $state("");
  let root = $state<HTMLDivElement>();
  const registrations = createBasesStoryRegistrations();

  $effect(() => {
    if (!root || !app) return;
    const ownedRoot = root as HTMLDivElement & {
      __lapisApp?: App;
      __basesDocument?: BasesDocument;
    };
    ownedRoot.__lapisApp = app;
    if (document) ownedRoot.__basesDocument = document;
    return () => {
      if (ownedRoot.__lapisApp === app) delete ownedRoot.__lapisApp;
      if (ownedRoot.__basesDocument === document) {
        delete ownedRoot.__basesDocument;
      }
    };
  });

  onMount(() => {
    let cancelled = false;
    const runtimePromise = bootBasesViewsDemo();
    void runtimePromise
      .then((runtime) => {
        if (cancelled) return;
        app = runtime.app;
        document = createBasesViewsDocument(scenario);
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
  class="bases-views-demo"
  data-testid="bases-views-demo"
  data-scenario={scenario}
  data-status={status}
>
  <output class="bases-views-demo__status" data-testid="bases-views-status">
    {status}
  </output>
  {#if error}
    <div role="alert">{error}</div>
  {:else if app && document}
    <BasesViewSurface {app} {document} {registrations} />
  {/if}
</div>

<style>
  .bases-views-demo {
    position: relative;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 38rem;
    overflow: hidden;
    color: var(--ui-workspace-foreground);
    background: var(--ui-workspace-background);
  }

  :global(.bases-views-docs-canvas) .bases-views-demo {
    height: 700px;
    min-height: 700px;
  }

  .bases-views-demo__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
