<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { App, MemoryAppDatabase } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import type { WorkspaceRequestedDisplayMode } from "@lapismd/design-core/workspace/core";
  import { StoryMemoryDataAdapter } from "./StoryMemoryDataAdapter";
  import "./workspace-shell-story.css";

  let {
    displayMode = "desktop",
    workspaceLabel = "Lapis Notes",
  }: {
    displayMode?: WorkspaceRequestedDisplayMode;
    workspaceLabel?: string;
  } = $props();

  const initialLayout = {
    main: {
      id: "main",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        {
          id: "main-tabs",
          type: "tabs",
          stacked: false,
          currentTab: 0,
          children: [
            {
              id: "start",
              type: "leaf",
              state: {
                type: "empty",
                state: {},
                icon: "ghost",
                title: "Start",
              },
            },
          ],
        },
      ],
    },
    left: {
      id: "left",
      type: "split",
      direction: "vertical",
      sizes: [],
      children: [],
      width: "0px",
    },
    right: {
      id: "right",
      type: "split",
      direction: "vertical",
      sizes: [],
      children: [],
      width: "0px",
    },
    floating: [],
    active: "start",
  } as const;

  const workspacePath = ".obsidian/workspace.json";
  const initialJson = JSON.stringify(initialLayout, null, 2);
  const adapter = new StoryMemoryDataAdapter({
    [`/${workspacePath}`]: initialJson,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian",
    adapter,
    appDatabase: new MemoryAppDatabase(
      `workspace-story-${untrack(() => displayMode)}`,
    ),
    markdownRenderer: async () => {},
  });

  globalThis.app = app;

  let ready = $state(false);
  let bootStatus = $state("booting");
  let persistedLayout = $state(initialJson);
  let writeCount = $state(0);

  adapter.onWrite = (path, data, count) => {
    if (path !== workspacePath) return;
    persistedLayout = data;
    writeCount = count;
  };

  onMount(() => {
    let disposed = false;
    void (async () => {
      await app.vault.load();
      await app.workspace.loadLayout();
      if (disposed) return;
      persistedLayout = await adapter.read(workspacePath);
      bootStatus = "ready";
      ready = true;
    })();
    return () => {
      disposed = true;
    };
  });
</script>

<div
  class:workspace-shell-story-mobile={displayMode === "mobile"}
  class="workspace-shell-story-frame"
  data-testid="workspace-shell-frame"
>
  {#if ready}
    <WorkspaceShell {app} {displayMode} {workspaceLabel} />
  {:else}
    <div class="workspace-shell-story-boot">Loading workspace…</div>
  {/if}

  <div class="workspace-shell-story-observer" aria-live="polite">
    <span data-testid="workspace-shell-status">{bootStatus}</span>
    <span data-testid="workspace-write-count">{writeCount}</span>
    <output data-testid="workspace-persisted-layout">{persistedLayout}</output>
  </div>
</div>
