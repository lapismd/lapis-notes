<script lang="ts">
  import { useTextHighlight } from "@lapis-notes/api";
  const surfaces = ["workspace", "sidebar"];
  const states = ["normal", "hover", "active"];
</script>

<div class="highlight-demo">
  {#each surfaces as surface}
    <section class={surface} aria-label={`${surface} highlight examples`}>
      {#each states as state}
        <p class={state}>
          <span use:useTextHighlight={{ query: "daily", value: "Daily notes" }}
          ></span>
        </p>
      {/each}
    </section>
  {/each}
</div>

<style>
  section {
    padding: 1rem;
    color: var(--foreground);
    font-size: 13px;
  }
  .workspace {
    background: var(--ui-workspace-background, var(--background));
  }
  .sidebar {
    background: var(--ui-workspace-panel-background, var(--sidebar));
  }
  p {
    padding: 0.5rem;
  }
  .hover {
    background: var(
      --ui-workspace-explorer-row-hover-background,
      var(--sidebar-accent)
    );
  }
  .active {
    background: var(
      --ui-workspace-explorer-row-active-background,
      var(--accent)
    );
  }
  .highlight-demo :global(.suggestion-highlight) {
    color: var(--ui-search-highlight-foreground);
    background: var(--ui-search-highlight-background);
  }
</style>
