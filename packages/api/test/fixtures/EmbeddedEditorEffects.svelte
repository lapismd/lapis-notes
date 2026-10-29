<script lang="ts">
  import type { App } from "$lib/context.svelte";
  import type { Editor } from "$lib/editor.svelte";
  import { applyEmbeddedEditorExtensions } from "$lib/components/editor/embedded-editor-surface";

  let { app, editor }: { app: App; editor: Editor } = $props();
  let mode = $state("source");

  export function changeMode(next: string): void {
    mode = next;
  }

  $effect(() => {
    applyEmbeddedEditorExtensions(app, editor, { viewType: "markdown", mode });
  });
</script>
