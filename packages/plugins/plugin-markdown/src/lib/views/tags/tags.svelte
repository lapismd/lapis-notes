<script lang="ts">
  import { Menu as UIMenu, useTextHighlight, type App } from "@lapis-notes/api";
  import { fuzzyMatchScore } from "@lapis-notes/ui";
  import * as Sidebar from "@lapis-notes/ui/sidebar-custom";
  import MarkdownSidebarPanel from "$lib/views/sidebar-panel/markdown-sidebar-panel.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import FolderTree from "@lucide/svelte/icons/folder-tree";
  import Search from "@lucide/svelte/icons/search";
  import SortAsc from "@lucide/svelte/icons/sort-asc";
  import Hash from "@lucide/svelte/icons/hash";
  import { onMount } from "svelte";

  type TagSortMode = "frequency:asc" | "frequency:desc" | "tag:asc" | "tag:desc";
  type TagNode = { name: string; tag: string; count: number; children: TagNode[] };

  let { app }: { app: App } = $props();

  const sorters: Record<TagSortMode, (left: TagNode, right: TagNode) => number> = {
    "frequency:asc": (left, right) => left.count - right.count || left.name.localeCompare(right.name),
    "frequency:desc": (left, right) => right.count - left.count || left.name.localeCompare(right.name),
    "tag:asc": (left, right) => left.name.localeCompare(right.name),
    "tag:desc": (left, right) => right.name.localeCompare(left.name),
  };

  let values = $state<Record<string, number>>({});
  let loading = $state(false);
  let queryError = $state<string | null>(null);
  let reloadGeneration = 0;
  let opened = $state<Set<string>>(new Set());
  let query = $state("");
  let searchOpen = $state(false);
  let nested = $state(false);
  let sortMode = $state<TagSortMode>("frequency:desc");

  async function reload() {
    const generation = ++reloadGeneration;
    loading = true;
    queryError = null;
    const nextValues: Record<string, number> = {};
    try {
      const facets = await app.metadataCache.queryFacets({
        kind: "tag",
        limit: 10_000,
      });
      if (generation !== reloadGeneration) return;
      for (const row of facets) {
        if (typeof row.value === "string") nextValues[row.value] = row.count;
      }
      values = nextValues;
    } catch (error) {
      if (generation !== reloadGeneration) return;
      queryError = error instanceof Error ? error.message : String(error);
    } finally {
      if (generation === reloadGeneration) loading = false;
    }
  }

  function flatTags(): TagNode[] {
    return Object.entries(values)
      .map(([tag, count]) => ({
        name: tag,
        tag,
        count,
        score: fuzzyMatchScore(tag, query, []),
        children: [] as TagNode[],
      }))
      .filter((tag) => tag.score > 0)
      .sort((left, right) => sorters[sortMode](left, right))
      .map(({ score: _score, ...tag }) => tag);
  }

  function tagTree(tags: TagNode[]): TagNode[] {
    const nodes = new Map<string, TagNode>();
    for (const tag of tags) {
      const parts = tag.tag.split("/");
      parts.forEach((part, index) => {
        const path = parts.slice(0, index + 1).join("/");
        const node = nodes.get(path) ?? {
          name: part,
          tag: path,
          count: 0,
          children: [],
        };
        if (path === tag.tag) node.count = tag.count;
        nodes.set(path, node);
      });
    }
    const roots: TagNode[] = [];
    for (const [path, node] of nodes) {
      const parts = path.split("/");
      if (parts.length === 1) roots.push(node);
      else {
        const parent = nodes.get(parts.slice(0, -1).join("/"));
        if (parent && !parent.children.some((child) => child.tag === path)) {
          parent.children.push(node);
        }
      }
    }
    const sort = (items: TagNode[]): TagNode[] => {
      items.sort(sorters[sortMode]);
      items.forEach((item) => sort(item.children));
      return items;
    };
    return sort(roots);
  }

  const tags = $derived(nested ? tagTree(flatTags()) : flatTags());

  function expandable(nodes: TagNode[]): string[] {
    return nodes.flatMap((node) =>
      node.children.length ? [node.tag, ...expandable(node.children)] : [],
    );
  }

  function setOpen(tag: string, value: boolean) {
    if (opened.has(tag) === value) return;
    const next = new Set(opened);
    if (value) next.add(tag);
    else next.delete(tag);
    opened = next;
  }

  function toggleCollapse() {
    if (!nested) return;
    opened = opened.size ? new Set() : new Set(expandable(tags));
  }

  function toggleSearch() {
    searchOpen = !searchOpen;
    if (!searchOpen) query = "";
  }

  function createSortMenu(event: MouseEvent) {
    new UIMenu()
      .addItem((item) =>
        item.setTitle("Tag name (A to Z)").setChecked(sortMode === "tag:asc").onClick(() => (sortMode = "tag:asc")),
      )
      .addItem((item) =>
        item.setTitle("Tag name (Z to A)").setChecked(sortMode === "tag:desc").onClick(() => (sortMode = "tag:desc")),
      )
      .addSeparator()
      .addItem((item) =>
        item.setTitle("Frequency (high to low)").setChecked(sortMode === "frequency:desc").onClick(() => (sortMode = "frequency:desc")),
      )
      .addItem((item) =>
        item.setTitle("Frequency (low to high)").setChecked(sortMode === "frequency:asc").onClick(() => (sortMode = "frequency:asc")),
      )
      .showAtMouseEvent(event);
  }

  function openTagSearch(tag: string): void {
    void app.commands
      .executeCommand("search:open-search", `tag:#${tag}`)
      .catch(() => undefined);
  }

  function handleExpandableTagClick(event: MouseEvent, tag: string): void {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("svg.lucide-chevron-right")
    ) {
      return;
    }
    event.preventDefault();
    openTagSearch(tag);
  }

  $effect(() => {
    if (!nested && opened.size) opened = new Set();
  });

  onMount(() => {
    void reload();
    const changed = app.metadataCache.on("index-changed", (change) => {
      if (change.reset || change.domains.includes("metadata")) void reload();
    });
    const loaded = app.metadataCache.on("loaded", () => void reload());
    return () => {
      app.metadataCache.offref(changed);
      app.metadataCache.offref(loaded);
      reloadGeneration += 1;
    };
  });
</script>

<MarkdownSidebarPanel
  title="Tags"
  testId="tags-panel"
  component="tags"
  showTitle={false}
  searchPlaceholder="Search tags"
  searchToggleable
  bind:searchOpen
  bind:query
>
  {#snippet toolbar()}
    <Button variant="ghost" size="sm" aria-label="Change tag sort order" onclick={createSortMenu}>
      <SortAsc />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      aria-label="Show nested tags"
      aria-pressed={nested}
      data-active={nested}
      onclick={() => (nested = !nested)}
    >
      <FolderTree />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      aria-label={opened.size ? "Collapse all tags" : "Expand all tags"}
      disabled={!nested}
      onclick={toggleCollapse}
    >
      <ChevronsUpDown />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      aria-label="Search tags"
      aria-pressed={searchOpen}
      data-active={searchOpen}
      onclick={toggleSearch}
    >
      <Search />
    </Button>
  {/snippet}

  <Sidebar.NestedProvider
    id="lapis-tags"
    class="tags-panel__fill"
  >
    <Sidebar.Content class="tags-panel__menu-host">
      <Sidebar.Menu class="tags-panel__menu">
        {#if queryError}
          <p class="markdown-sidebar-panel__empty" role="alert">
            Unable to load tags: {queryError}
          </p>
        {:else if loading && !Object.keys(values).length}
          <p class="markdown-sidebar-panel__empty">Loading tags…</p>
        {:else}
        {#each tags as tag (tag.tag)}
          {@render TagTree({ tag })}
        {:else}
          <p class="markdown-sidebar-panel__empty">No tags in this vault yet.</p>
        {/each}
        {/if}
      </Sidebar.Menu>
    </Sidebar.Content>
  </Sidebar.NestedProvider>
</MarkdownSidebarPanel>

{#snippet TagTree({ tag, child = false }: { tag: TagNode; child?: boolean })}
  {@const Item = child ? Sidebar.MenuSubItem : Sidebar.MenuItem}
  <Item>
    {#if tag.children.length}
      <Collapsible.Root
        open={opened.has(tag.tag)}
        onOpenChange={(value) => setOpen(tag.tag, value)}
      >
        <Collapsible.Trigger
          class="tags-panel__row"
          onclick={(event) => handleExpandableTagClick(event, tag.tag)}
        >
          <ChevronRight data-open={opened.has(tag.tag)} />
          <Hash class="tags-panel__hash-icon" aria-hidden="true" />
          <span
            class="tags-panel__label"
            use:useTextHighlight={{
              query,
              value: tag.name,
            }}
          >
            {tag.name}
          </span>
          <span class="tags-panel__count">{tag.count}</span>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Sidebar.MenuSub class="tags-panel__sub">
            {#each tag.children as nestedTag (nestedTag.tag)}
              {@render TagTree({ tag: nestedTag, child: true })}
            {/each}
          </Sidebar.MenuSub>
        </Collapsible.Content>
      </Collapsible.Root>
    {:else}
      <Sidebar.MenuButton
        class="tags-panel__row"
        onclick={() => openTagSearch(tag.tag)}
      >
        <span class="tags-panel__disclosure-spacer" aria-hidden="true"></span>
        <Hash class="tags-panel__hash-icon" aria-hidden="true" />
        <span
          class="tags-panel__label"
          use:useTextHighlight={{
            query,
            value: tag.name,
          }}
        >
          {tag.name}
        </span>
        <span class="tags-panel__count">{tag.count}</span>
      </Sidebar.MenuButton>
    {/if}
  </Item>
{/snippet}

<style>
  :global(.tags-panel__fill),
  :global(.tags-panel__menu),
  :global(.tags-panel__fill [data-ui-part="sidebar-menu-item"]),
  :global(.tags-panel__fill [data-ui-part="collapsible"]) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
  }

  :global(
    .tags-panel__fill
      [data-ui-component="sidebar-custom"][data-ui-part="sidebar-content"].tags-panel__menu-host
  ) {
    width: 100%;
    min-width: 0;
    overflow: visible;
    background: transparent;
  }

  :global(
    [data-ui-component="sidebar-custom"][data-ui-part="sidebar-menu-sub"].tags-panel__sub
  ) {
    box-sizing: border-box;
    width: calc(100% - 1rem);
    margin-inline: 0;
    margin-inline-start: 1rem;
    padding-inline: calc(0.25rem - 1px) 0;
    translate: none;
  }

  :global(.tags-panel__fill [data-ui-part].tags-panel__row) {
    position: relative;
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: var(--ui-workspace-explorer-row-height, 1.75rem);
    align-items: center;
    gap: 0.25rem;
    border: 2px solid transparent;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0.125rem
      calc(
        var(--markdown-sidebar-count-width) +
          var(--markdown-sidebar-count-end-pad)
      )
      0.125rem 0.375rem;
    color: inherit;
    background: transparent;
    font: inherit;
    font-size: 0.75rem;
    line-height: 1rem;
    text-align: start;
    cursor: pointer;
  }

  :global(
    .tags-panel__fill
      .tags-panel__sub
      [data-ui-part].tags-panel__row
      > :not(.tags-panel__count)
  ) {
    translate: -1rem 0;
  }

  :global(.tags-panel__fill [data-ui-part].tags-panel__row:hover),
  :global(.tags-panel__fill [data-ui-part].tags-panel__row:focus-visible) {
    background: var(--ui-workspace-explorer-row-hover-background, var(--sidebar-accent));
    outline: none;
  }

  :global(.tags-panel__fill [data-ui-part].tags-panel__row svg) {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
  }

  .tags-panel__disclosure-spacer {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
  }

  :global(
    .tags-panel__fill
      [data-ui-part].tags-panel__row
      svg.tags-panel__hash-icon
  ) {
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
  }

  :global(.tags-panel__fill [data-ui-part].tags-panel__row svg) {
    transition: transform 120ms ease;
  }

  :global(
    .tags-panel__fill [data-ui-part].tags-panel__row svg[data-open="true"]
  ) {
    transform: rotate(90deg);
  }

  .tags-panel__label {
    overflow: hidden;
    min-width: 0;
    flex: 1 1 auto;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tags-panel__count {
    position: absolute;
    top: 50%;
    right: var(--markdown-sidebar-count-end-pad);
    display: inline-flex;
    width: var(--markdown-sidebar-count-width);
    min-width: var(--markdown-sidebar-count-width);
    align-items: center;
    justify-content: flex-end;
    transform: translateY(-50%);
    pointer-events: none;
    font-variant-numeric: tabular-nums;
    opacity: 0.75;
  }
</style>
