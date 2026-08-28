<script lang="ts">
  import { Component, MarkdownRenderer, type App } from "@lapis-notes/api";
  import { onDestroy } from "svelte";

  class PluginReadmeLifecycle extends Component {}

  let {
    app,
    markdown,
    sourcePath,
  }: { app: App; markdown: string; sourcePath: string } = $props();

  let host = $state<HTMLElement | null>(null);
  let renderRevision = 0;
  let lifecycle: Component | null = null;

  $effect(() => {
    const target = host;
    const value = markdown;
    const path = sourcePath;
    if (!target) return;
    const revision = ++renderRevision;
    lifecycle?.unload();
    lifecycle = new PluginReadmeLifecycle();
    lifecycle.load();
    target.replaceChildren();
    void MarkdownRenderer.render(app, value, target, path, lifecycle).catch(
      (error) => {
        if (revision !== renderRevision) return;
        target.textContent =
          error instanceof Error ? error.message : String(error);
      },
    );
  });

  onDestroy(() => {
    renderRevision += 1;
    lifecycle?.unload();
    lifecycle = null;
  });
</script>

<div
  bind:this={host}
  class="lapis-plugin-readme"
  data-ui-component="lapis-plugin-readme"
></div>
