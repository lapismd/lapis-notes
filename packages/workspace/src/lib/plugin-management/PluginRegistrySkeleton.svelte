<script lang="ts">
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";

  let {
    layout = "list",
    label = "Loading plugins",
  }: {
    layout?: "landing" | "directory" | "detail" | "list";
    label?: string;
  } = $props();
</script>

<div
  class="registry-skeleton"
  data-ui-component="plugin-registry-skeleton"
  data-layout={layout}
  aria-busy="true"
>
  <span class="sr-only" role="status">{label}</span>
  <div class="registry-skeleton__layout" aria-hidden="true">
    <header class="registry-skeleton__header">
      {#if layout === "detail"}
        <Skeleton class="registry-skeleton__avatar" />
      {/if}
      <div class="registry-skeleton__copy">
        <Skeleton class="registry-skeleton__title" />
        <Skeleton class="registry-skeleton__line" />
        <Skeleton class="registry-skeleton__short" />
      </div>
      {#if layout === "detail" || layout === "directory"}
        <Skeleton class="registry-skeleton__action" />
      {/if}
    </header>
    {#if layout === "detail"}
      <Skeleton class="registry-skeleton__banner" data-ui-part="banner" />
      <div class="registry-skeleton__detail">
        <div class="registry-skeleton__copy" data-ui-part="overview">
          <Skeleton class="registry-skeleton__title" />
          {#each Array(5) as _}<Skeleton class="registry-skeleton__line" />{/each}
        </div>
        <aside class="registry-skeleton__copy" data-ui-part="metadata">
          <Skeleton class="registry-skeleton__short" />
          {#each Array(5) as _}<Skeleton class="registry-skeleton__line" />{/each}
        </aside>
      </div>
    {:else}
      <div class="registry-skeleton__cards" data-ui-part="cards">
        {#each Array(layout === "landing" ? 3 : layout === "directory" ? 6 : 4) as _}
          <div class="registry-skeleton__card">
            <Skeleton class="registry-skeleton__avatar" />
            <div class="registry-skeleton__copy">
              <Skeleton class="registry-skeleton__short" />
              <Skeleton class="registry-skeleton__line" />
              <Skeleton class="registry-skeleton__line" />
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .registry-skeleton {
    container-type: inline-size;
    width: 100%;
    min-width: 0;
    padding: 1.5rem;
    color: var(--ui-workspace-foreground, var(--foreground));
    --ui-skeleton-background: color-mix(in srgb, var(--ui-workspace-foreground, var(--foreground)) 9%, var(--ui-workspace-view-background, var(--background)));
  }
  .registry-skeleton__layout,
  .registry-skeleton__copy,
  .registry-skeleton__cards,
  .registry-skeleton__detail {
    display: grid;
    min-width: 0;
    gap: 1rem;
  }
  .registry-skeleton__layout { gap: 2rem; }
  .registry-skeleton__header,
  .registry-skeleton__card {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 1rem;
  }
  .registry-skeleton__card {
    border: 1px solid var(--ui-workspace-border, var(--border));
    border-radius: var(--radius);
    padding: 1rem;
  }
  .registry-skeleton__copy { flex: 1; }
  .registry-skeleton :global(.registry-skeleton__avatar) {
    width: 3.5rem;
    height: 3.5rem;
    flex-shrink: 0;
  }
  .registry-skeleton :global(.registry-skeleton__title) { width: min(75%, 20rem); height: 2rem; }
  .registry-skeleton :global(.registry-skeleton__line) { height: 0.875rem; width: 100%; }
  .registry-skeleton :global(.registry-skeleton__short) { height: 0.875rem; width: 60%; }
  .registry-skeleton :global(.registry-skeleton__action) { height: 2.25rem; width: 6rem; }
  .registry-skeleton :global(.registry-skeleton__banner) { width: 100%; aspect-ratio: 3 / 1; }
  @container (min-width: 44rem) {
    [data-layout="landing"] .registry-skeleton__cards,
    [data-layout="directory"] .registry-skeleton__cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .registry-skeleton__detail { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 2rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .registry-skeleton :global([data-ui-component="skeleton"]) { animation: none; }
  }
</style>
