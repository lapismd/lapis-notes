<script lang="ts">
  import { Menu, type App } from "@lapis-notes/api";
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import BookmarkPlusIcon from "@lucide/svelte/icons/bookmark-plus";
  import ChevronsDownUpIcon from "@lucide/svelte/icons/chevrons-down-up";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import FolderPlusIcon from "@lucide/svelte/icons/folder-plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { SvelteSet } from "svelte/reactivity";
  import { activateBookmark } from "./activate-bookmark";
  import { filterBookmarkItems } from "./bookmarks-filter";
  import {
    bookmarkIcon,
    bookmarkLabel,
    type BookmarkItem,
  } from "./bookmarks-schema";
  import type { BookmarksStore } from "./bookmarks-store";

  let {
    app,
    store,
    onBookmarkActive,
    onNewGroup,
  }: {
    app: App;
    store: BookmarksStore;
    onBookmarkActive: () => void;
    onNewGroup: (parentCtime: number | null) => Promise<{ ctime: number }>;
  } = $props();

  let revision = $state(0);
  let query = $state("");
  let showFilter = $state(false);
  let selectedCtime = $state<number | null>(null);
  let renamingCtime = $state<number | null>(null);
  let renameValue = $state("");
  let draggingCtime = $state<number | null>(null);
  let dropTarget = $state<string | null>(null);
  const expanded = new SvelteSet<number>();

  $effect(() => {
    return store.subscribe(() => {
      revision += 1;
    });
  });

  const items = $derived.by(() => {
    revision;
    return store.items;
  });
  const visibleItems = $derived(filterBookmarkItems(items, query));
  const filtering = $derived(query.trim().length > 0);
  const groupCtimes = $derived.by(() => collectGroupCtimes(visibleItems));
  const allExpanded = $derived(
    groupCtimes.length > 0 && groupCtimes.every((ctime) => expanded.has(ctime)),
  );

  function collectGroupCtimes(nodes: BookmarkItem[]): number[] {
    const ctimes: number[] = [];
    for (const node of nodes) {
      if (node.type !== "group") continue;
      ctimes.push(node.ctime);
      ctimes.push(...collectGroupCtimes(node.items));
    }
    return ctimes;
  }

  function isExpanded(ctime: number): boolean {
    return filtering || expanded.has(ctime);
  }

  function toggleGroup(ctime: number): void {
    if (expanded.has(ctime)) expanded.delete(ctime);
    else expanded.add(ctime);
  }

  function toggleCollapseAll(): void {
    if (allExpanded) expanded.clear();
    else for (const ctime of groupCtimes) expanded.add(ctime);
  }

  function startRename(item: BookmarkItem): void {
    renamingCtime = item.ctime;
    renameValue = item.title ?? bookmarkLabel(item);
  }

  async function commitRename(): Promise<void> {
    if (renamingCtime === null) return;
    await store.renameItem(renamingCtime, renameValue);
    renamingCtime = null;
  }

  async function activate(item: BookmarkItem): Promise<void> {
    selectedCtime = item.ctime;
    if (item.type === "group") {
      toggleGroup(item.ctime);
      return;
    }
    await activateBookmark(app, item);
  }

  function showMenu(event: MouseEvent, item: BookmarkItem): void {
    event.preventDefault();
    selectedCtime = item.ctime;
    const menu = new Menu();
    if (item.type !== "group") {
      menu.addItem((entry) => {
        entry.setTitle("Open").onClick(() => void activateBookmark(app, item));
      });
    }
    menu.addItem((entry) => {
      entry.setTitle("Rename").onClick(() => startRename(item));
    });
    if (item.type === "group") {
      menu.addItem((entry) => {
        entry.setTitle("New group").onClick(() => onNewGroup(item.ctime));
      });
    }
    menu.addItem((entry) => {
      entry.setTitle("Remove").onClick(() => void store.removeItem(item.ctime));
    });
    menu.showAtMouseEvent(event);
  }

  function onRowKeydown(event: KeyboardEvent, item: BookmarkItem): void {
    if (event.key === "Enter") {
      event.preventDefault();
      void activate(item);
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void store.removeItem(item.ctime);
    }
    if (event.key === "F2") {
      event.preventDefault();
      startRename(item);
    }
  }

  function onDragStart(event: DragEvent, item: BookmarkItem): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData("text/plain", String(item.ctime));
    event.dataTransfer.effectAllowed = "move";
    draggingCtime = item.ctime;
  }

  function dropKey(parentCtime: number | null, index: number): string {
    return `${parentCtime ?? "root"}:${index}`;
  }

  async function dropAt(
    event: DragEvent,
    parentCtime: number | null,
    index: number,
  ): Promise<void> {
    event.preventDefault();
    const ctime = Number(
      event.dataTransfer?.getData("text/plain") || draggingCtime || "",
    );
    draggingCtime = null;
    dropTarget = null;
    if (!Number.isFinite(ctime)) return;
    await store.moveItem(ctime, parentCtime, index);
  }

  function flattenItems(nodes: BookmarkItem[]): BookmarkItem[] {
    return nodes.flatMap((node) =>
      node.type === "group" ? [node, ...flattenItems(node.items)] : [node],
    );
  }
</script>

{#snippet Tree(nodes: BookmarkItem[], parentCtime: number | null, depth: number)}
  <ul class="bookmarks-panel__list" role="group">
    {#each nodes as item, index (item.ctime)}
      <li
        class="bookmarks-panel__item"
        class:bookmarks-panel__item--drop={dropTarget ===
          dropKey(parentCtime, index)}
        data-bookmark-type={item.type}
        data-drop={dropTarget === dropKey(parentCtime, index)
          ? "true"
          : undefined}
        ondragenter={(event) => {
          event.preventDefault();
          dropTarget = dropKey(parentCtime, index);
        }}
        ondragover={(event) => {
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
          dropTarget = dropKey(parentCtime, index);
        }}
        ondrop={(event) =>
          void dropAt(
            event,
            item.type === "group" ? item.ctime : parentCtime,
            item.type === "group" ? item.items.length : index,
          )}
      >
        <div
          class="bookmarks-panel__row"
          class:bookmarks-panel__row--selected={selectedCtime === item.ctime}
          data-path={String(item.ctime)}
          data-bookmark-icon={bookmarkIcon(item) ?? "group"}
          role="treeitem"
          tabindex="0"
          aria-expanded={item.type === "group"
            ? isExpanded(item.ctime)
            : undefined}
          aria-selected={selectedCtime === item.ctime}
          style={`--bookmarks-depth: ${depth}`}
          draggable="true"
          ondragstart={(event) => onDragStart(event, item)}
          ondragend={() => {
            draggingCtime = null;
            dropTarget = null;
          }}
          onclick={() => void activate(item)}
          ondblclick={() => startRename(item)}
          onkeydown={(event) => onRowKeydown(event, item)}
          oncontextmenu={(event) => showMenu(event, item)}
        >
          {#if item.type === "group"}
            <button
              class="bookmarks-panel__disclosure"
              type="button"
              aria-label={isExpanded(item.ctime) ? "Collapse" : "Expand"}
              onclick={(event) => {
                event.stopPropagation();
                toggleGroup(item.ctime);
              }}
            >
              <ChevronRightIcon
                class="bookmarks-panel__chevron"
                data-open={isExpanded(item.ctime) ? "true" : undefined}
              />
            </button>
          {:else}
            <span class="bookmarks-panel__disclosure-spacer"></span>
          {/if}
          {#if bookmarkIcon(item)}
            <WorkspaceIcon name={bookmarkIcon(item)!} />
          {/if}
          {#if renamingCtime === item.ctime}
            <Input
              class="bookmarks-panel__rename"
              bind:value={renameValue}
              onblur={() => void commitRename()}
              onkeydown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void commitRename();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  renamingCtime = null;
                }
              }}
            />
          {:else}
            <span class="bookmarks-panel__label">{bookmarkLabel(item)}</span>
          {/if}
        </div>
        {#if item.type === "group" && isExpanded(item.ctime)}
          {@render Tree(item.items, item.ctime, depth + 1)}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

<div
  class="bookmarks-panel"
  data-testid="bookmarks-panel"
  data-ui-component="bookmarks-panel"
>
  <div class="bookmarks-panel__toolbar">
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon"
            aria-label="Bookmark the active tab"
            onclick={onBookmarkActive}
          >
            <BookmarkPlusIcon />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>Bookmark the active tab</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon"
            aria-label="New group"
            onclick={() => {
              const selected = flattenItems(items).find(
                (item) => item.ctime === selectedCtime,
              );
              void (async () => {
                const created = await onNewGroup(
                  selected?.type === "group" ? selected.ctime : null,
                );
                const item = flattenItems(store.items).find(
                  (candidate) => candidate.ctime === created.ctime,
                );
                if (item) startRename(item);
              })();
            }}
          >
            <FolderPlusIcon />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>New group</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon"
            aria-label="Collapse all"
            aria-pressed={allExpanded}
            onclick={toggleCollapseAll}
          >
            {#if allExpanded}
              <ChevronsDownUpIcon />
            {:else}
              <ChevronsUpDownIcon />
            {/if}
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>Collapse all/Expand all</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon"
            aria-label="Show search filter"
            aria-pressed={showFilter}
            onclick={() => {
              showFilter = !showFilter;
              if (!showFilter) query = "";
            }}
          >
            <SearchIcon />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>Show search filter</Tooltip.Content>
    </Tooltip.Root>
  </div>
  {#if showFilter}
    <SearchFilterBar
      inputMode="plain"
      placeholder="Search..."
      ariaLabel="Search bookmarks"
      value={query}
      onValueChange={(value) => {
        query = value;
      }}
    />
  {/if}
  <ScrollArea class="bookmarks-panel__scroll">
    <div
      class="bookmarks-panel__tree"
      role="tree"
      aria-label="Bookmarks"
      data-drop={dropTarget === dropKey(null, items.length) ? "true" : undefined}
      ondragenter={(event) => {
        event.preventDefault();
        dropTarget = dropKey(null, items.length);
      }}
      ondragover={(event) => {
        event.preventDefault();
        dropTarget = dropKey(null, items.length);
      }}
      ondrop={(event) => void dropAt(event, null, store.items.length)}
    >
      {@render Tree(visibleItems, null, 0)}
    </div>
  </ScrollArea>
</div>

<style>
  .bookmarks-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    background: transparent;
    color: var(--ui-workspace-view-foreground);
    font-size: 0.75rem;
  }

  .bookmarks-panel__toolbar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    padding: 0.25rem;
  }

  .bookmarks-panel__scroll {
    flex: 1;
    min-height: 0;
  }

  .bookmarks-panel__tree {
    min-height: 100%;
    padding-bottom: 1rem;
  }

  .bookmarks-panel__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .bookmarks-panel__item--drop > .bookmarks-panel__row {
    box-shadow: inset 0 2px 0 var(--ui-workspace-view-foreground);
  }

  .bookmarks-panel__row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 1.5rem;
    padding-inline-start: calc(0.35rem + (var(--bookmarks-depth) * 0.85rem));
    padding-inline-end: 0.35rem;
    border-radius: 0.25rem;
    cursor: default;
  }

  .bookmarks-panel__row:hover,
  .bookmarks-panel__row--selected {
    background: color-mix(
      in srgb,
      var(--ui-workspace-view-foreground) 8%,
      transparent
    );
  }

  .bookmarks-panel__disclosure,
  .bookmarks-panel__disclosure-spacer {
    display: inline-flex;
    width: 1rem;
    height: 1rem;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
  }

  .bookmarks-panel__chevron {
    width: 0.85rem;
    height: 0.85rem;
    transition: transform 120ms ease;
  }

  .bookmarks-panel__chevron[data-open="true"] {
    transform: rotate(90deg);
  }

  .bookmarks-panel__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bookmarks-panel__rename {
    flex: 1;
    min-width: 0;
  }

  .bookmarks-panel__item .bookmarks-panel__list {
    margin-inline-start: calc(0.85rem + 0.35rem);
    padding-inline-start: 0.55rem;
    border-inline-start: 1px solid
      color-mix(in srgb, var(--ui-workspace-view-foreground) 16%, transparent);
  }
</style>
