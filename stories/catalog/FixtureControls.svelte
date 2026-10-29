<script lang="ts">
  import type { Snippet } from "svelte";
  let { children, label = "Fixture controls", placement = "overlay" }: {
    children: Snippet; label?: string; placement?: "overlay" | "inline";
  } = $props();
</script>

<aside class="fixture-controls" class:overlay={placement === "overlay"} aria-label={label} data-fixture-controls>
  <span class="fixture-controls-label">{label}</span>
  {@render children()}
</aside>

<style>
  .fixture-controls {
    box-sizing: border-box;
    padding: 0.75rem;
    border: 1px dotted var(--border, currentColor);
    border-radius: 0.375rem;
    color: var(--foreground);
    background: var(--background);
    font: 0.75rem/1.5 var(--font-sans, sans-serif);
  }
  .fixture-controls-label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
  .overlay { position: fixed; z-index: 100; right: 1rem; bottom: 1rem; max-width: min(28rem, calc(100vw - 2rem)); max-height: calc(100vh - 2rem); overflow: auto; }
</style>
