<script lang="ts">
  import type { Snippet } from "svelte";
  import { Search } from "@lapis-notes/ui/search";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";

  /**
   * Canonical workspace leaf chrome for markdown / Tags side panels (LN-MD-018).
   *
   * Surface paint consumes design-core's resolved Workspace view tokens, so
   * moving a leaf immediately adopts the destination surface without panel-
   * owned placement selectors or runtime workspace-parent inspection.
   *
   * Why not nest shadcn `Sidebar.Root` / `Sidebar.Provider` here?
   * - Leaf views own the fill; Explorer fills the sidebar hole with panel tokens.
   * - Sticky toolbar + ui Search live inside one ScrollArea viewport.
   * - Menu-style panels wrap NestedProvider in children only.
   */
  let {
    title,
    testId,
    component = "markdown-sidebar-panel",
    class: className = undefined as string | undefined,
    meta = undefined as string | undefined,
    searchPlaceholder = undefined as string | undefined,
    query = $bindable(""),
    showTitle = true,
    searchToggleable = false,
    searchOpen = $bindable(!searchToggleable),
    toolbar = undefined as Snippet | undefined,
    children,
  }: {
    title: string;
    testId: string;
    component?: string;
    class?: string;
    meta?: string;
    searchPlaceholder?: string;
    query?: string;
    /** When false, omit the in-panel group label (leaf title only). */
    showTitle?: boolean;
    /** When true, search is shown only while `searchOpen` is true. */
    searchToggleable?: boolean;
    searchOpen?: boolean;
    toolbar?: Snippet;
    children: Snippet;
  } = $props();

  const showSearch = $derived(
    Boolean(searchPlaceholder) && (!searchToggleable || searchOpen),
  );
  const showChrome = $derived(Boolean(toolbar) || showSearch);
</script>

<div
  class={["markdown-sidebar-panel", className].filter(Boolean).join(" ")}
  data-ui-component={component}
  data-ui-part="root"
  data-testid={testId}
  data-show-title={showTitle ? "true" : "false"}
  data-search-open={showSearch ? "true" : "false"}
>
  <ScrollArea class="markdown-sidebar-panel__scroll">
    {#if showChrome}
      <div class="markdown-sidebar-panel__chrome" data-ui-part="chrome">
        {#if toolbar}
          <div class="markdown-sidebar-panel__toolbar" data-ui-part="toolbar">
            {@render toolbar()}
          </div>
        {/if}
        {#if showSearch}
          <div class="markdown-sidebar-panel__search" data-ui-part="search">
            <Search
              className="markdown-sidebar-panel__search-control"
              bind:value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>
        {/if}
      </div>
    {/if}

    <div class="markdown-sidebar-panel__body" data-ui-part="body">
      {#if showTitle}
        <h2
          class="markdown-sidebar-panel__group-label"
          data-ui-part="group-label"
        >
          {title}
        </h2>
      {/if}
      {#if meta}
        <p class="markdown-sidebar-panel__meta" data-ui-part="meta">{meta}</p>
      {/if}
      <div class="markdown-sidebar-panel__content" data-ui-part="content">
        {@render children()}
      </div>
    </div>
  </ScrollArea>
</div>

<style>
  .markdown-sidebar-panel {
    --header-height: 40px;
    --markdown-sidebar-chrome-pad-x: 0.25rem;
    --markdown-sidebar-search-row-pad-x: 0.5rem;
    /* Matches ui Search --ui-search-padding-inline. */
    --markdown-sidebar-search-icon-inset: 0.75rem;
    --markdown-sidebar-expand-size: 1rem;
    --markdown-sidebar-icon-gap: 0.25rem;
    --markdown-sidebar-search-icon-offset: calc(
      var(--markdown-sidebar-chrome-pad-x) +
        var(--markdown-sidebar-search-row-pad-x) +
        var(--markdown-sidebar-search-icon-inset)
    );
    --markdown-sidebar-end-pad: calc(
      var(--markdown-sidebar-chrome-pad-x) +
        var(--markdown-sidebar-search-row-pad-x)
    );
    --markdown-sidebar-count-end-pad: 0.5rem;
    --markdown-sidebar-count-width: 2rem;

    --markdown-sidebar-surface: var(
      --ui-workspace-view-background,
      var(--ui-workspace-background, var(--background))
    );
    --markdown-sidebar-surface-foreground: var(
      --ui-workspace-view-foreground,
      var(--ui-workspace-foreground, var(--foreground))
    );

    position: relative;
    display: flex;
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    color: var(--markdown-sidebar-surface-foreground);
    background: var(--markdown-sidebar-surface);
    font-family: var(--ui-workspace-explorer-font-family, inherit);
    font-size: var(--ui-workspace-explorer-font-size, 0.8125rem);
    border: none;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__scroll) {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
    --ui-scroll-area-foreground: var(
      --ui-workspace-border-strong,
      var(--sidebar-border)
    );
  }

  /* Sticky toolbar + search inside the ScrollArea viewport. */
  .markdown-sidebar-panel__chrome {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    box-sizing: border-box;
    padding: 0.25rem var(--markdown-sidebar-chrome-pad-x) 0;
    background: var(--markdown-sidebar-surface);
  }

  .markdown-sidebar-panel__toolbar {
    display: flex;
    flex: 0 0 auto;
    height: var(--header-height);
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  /*
    Ghost Button hover uses --muted (= Lapis sidebar #f6f6f6). Prefer panel
    action tokens for visible hover on this surface.
  */
  .markdown-sidebar-panel__toolbar :global(button[data-ui-component="button"]),
  .markdown-sidebar-panel :global(.markdown-sidebar-panel__icon-btn) {
    color: inherit;
    background: transparent;
  }

  .markdown-sidebar-panel__toolbar
    :global(button[data-ui-component="button"]:hover),
  .markdown-sidebar-panel__toolbar
    :global(button[data-ui-component="button"]:focus-visible),
  .markdown-sidebar-panel :global(.markdown-sidebar-panel__icon-btn:hover),
  .markdown-sidebar-panel
    :global(.markdown-sidebar-panel__icon-btn:focus-visible) {
    color: var(
      --ui-workspace-panel-action-hover-foreground,
      var(--sidebar-accent-foreground, inherit)
    );
    background: var(
      --ui-workspace-panel-action-hover-background,
      var(--sidebar-accent, #e3e3e3)
    );
    outline: none;
  }

  .markdown-sidebar-panel__toolbar :global(button[data-active="true"]),
  .markdown-sidebar-panel__toolbar :global(button[data-active="true"]:hover),
  .markdown-sidebar-panel
    :global(.markdown-sidebar-panel__icon-btn[data-active="true"]),
  .markdown-sidebar-panel
    :global(.markdown-sidebar-panel__icon-btn[data-active="true"]:hover) {
    color: var(--text-accent, var(--primary));
    background: color-mix(
      in srgb,
      var(--interactive-accent, var(--primary)) 12%,
      transparent
    );
  }

  .markdown-sidebar-panel__search {
    display: flex;
    box-sizing: border-box;
    height: var(--header-height);
    flex: 0 0 auto;
    align-items: center;
    padding: 0.25rem var(--markdown-sidebar-search-row-pad-x);
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__search-control) {
    width: 100%;
    color: var(--foreground, inherit);
    background: #fff;
  }

  .markdown-sidebar-panel__body {
    box-sizing: border-box;
    min-height: 0;
    padding-top: 0.25rem;
  }

  .markdown-sidebar-panel__group-label {
    margin: 0;
    padding: 0.5rem var(--markdown-sidebar-end-pad) 0.25rem 0.25rem;
    /* Use panel foreground (not muted): small uppercase labels fail axe 4.5:1
       on Lapis sidebar surfaces with muted tokens. */
    color: var(--ui-workspace-panel-foreground, var(--sidebar-foreground));
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .markdown-sidebar-panel__meta {
    margin: 0;
    padding: 0 var(--markdown-sidebar-end-pad) 0.35rem 0.25rem;
    color: var(--ui-workspace-panel-foreground, var(--sidebar-foreground));
    font-size: 0.8125rem;
    opacity: 0.8;
    overflow-wrap: anywhere;
  }

  .markdown-sidebar-panel__content {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    flex-direction: column;
    padding: 0 var(--markdown-sidebar-end-pad) 5rem 0.25rem;
  }

  /* List chrome shared by panel consumers (Explorer row geometry). */
  .markdown-sidebar-panel :global(.markdown-sidebar-panel__list) {
    display: flex;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    flex-direction: column;
    gap: var(--ui-workspace-explorer-row-gap, 0.125rem);
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__item) {
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__row) {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: var(--ui-workspace-explorer-row-height, 1.75rem);
    align-items: center;
    justify-content: space-between;
    gap: 0.375rem;
    border: 2px solid transparent;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0.125rem var(--markdown-sidebar-count-end-pad) 0.125rem 0.375rem;
    color: inherit;
    background: transparent;
    font: inherit;
    font-size: inherit;
    line-height: 1.25;
    text-align: start;
    cursor: default;
  }

  .markdown-sidebar-panel :global(button.markdown-sidebar-panel__row) {
    cursor: pointer;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__row:hover),
  .markdown-sidebar-panel :global(.markdown-sidebar-panel__row:focus-visible) {
    background: var(
      --ui-workspace-explorer-row-hover-background,
      var(--sidebar-accent)
    );
    outline: none;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__row-label) {
    overflow: hidden;
    min-width: 0;
    flex: 1 1 auto;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__row-meta) {
    flex: 0 0 auto;
    min-width: var(--markdown-sidebar-count-width);
    color: var(--ui-workspace-panel-foreground, var(--sidebar-foreground));
    font-variant-numeric: tabular-nums;
    text-align: end;
    opacity: 0.8;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__property-key) {
    flex: 0 1 30%;
    min-width: 0;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__property-value) {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
    opacity: 0.9;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__empty) {
    margin: 0;
    padding: 0.5rem 0.75rem;
    color: var(--ui-workspace-panel-foreground, var(--sidebar-foreground));
    font-size: 0.8125rem;
    opacity: 0.8;
  }

  .markdown-sidebar-panel :global([data-outline-level]) {
    padding-inline-start: calc(
      (var(--outline-level, 0) * var(--ui-workspace-explorer-indent, 0.75rem))
    );
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__icon-btn) {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    cursor: pointer;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__type-icon) {
    display: inline-flex;
    flex: 0 0 auto;
    width: 1rem;
    height: 1rem;
    align-items: center;
    justify-content: center;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__type-icon svg) {
    width: 1rem;
    height: 1rem;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__expand) {
    display: inline-flex;
    flex: 0 0 auto;
    width: var(--markdown-sidebar-expand-size);
    height: var(--markdown-sidebar-expand-size);
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .markdown-sidebar-panel :global(.markdown-sidebar-panel__rename-input) {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    padding: 0.125rem 0.25rem;
    border: none;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    color: inherit;
    background: transparent;
    font: inherit;
    outline: 1px solid var(--interactive-accent, var(--primary));
  }

  .markdown-sidebar-panel
    :global(.markdown-sidebar-panel__row[data-renaming="true"]) {
    border-color: var(--interactive-accent, var(--primary));
  }
</style>
