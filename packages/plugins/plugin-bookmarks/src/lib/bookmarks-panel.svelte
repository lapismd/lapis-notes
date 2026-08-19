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
  import { createSubscriber, SvelteSet } from "svelte/reactivity";
  import { activateBookmark } from "./activate-bookmark";
  import { filterBookmarkItems } from "./bookmarks-filter";
  import {
    bookmarkIcon,
    bookmarkLabel,
    cloneBookmarkItems,
    isGroupBookmark,
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

  let query = $state("");
  let showFilter = $state(false);
  let selectedCtime = $state<number | null>(null);
  let renamingCtime = $state<number | null>(null);
  let renameValue = $state("");
  let draggingCtime = $state<number | null>(null);
  let dropTarget = $state<string | null>(null);
  const expanded = new SvelteSet<number>();
  const watchStore = createSubscriber((update) => store.subscribe(update));

  const items = $derived.by(() => {
    watchStore();
    return cloneBookmarkItems(store.items);
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
      if (!isGroupBookmark(node)) continue;
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

  async function createGroup(parentCtime: number | null): Promise<void> {
    if (parentCtime !== null) expanded.add(parentCtime);
    const created = await onNewGroup(parentCtime);
    expanded.add(created.ctime);
    startRename({
      type: "group",
      ctime: created.ctime,
      title: "Untitled group",
      items: [],
    });
  }

  async function removeBookmark(ctime: number): Promise<void> {
    await store.removeItem(ctime);
    if (selectedCtime === ctime) selectedCtime = null;
    if (renamingCtime === ctime) renamingCtime = null;
    expanded.delete(ctime);
  }

  function stopToolbarClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  async function activate(item: BookmarkItem): Promise<void> {
    selectedCtime = item.ctime;
    if (isGroupBookmark(item)) {
      toggleGroup(item.ctime);
      return;
    }
    await activateBookmark(app, item);
  }

  function showMenuAtPointer(menu: Menu, event: MouseEvent): void {
    const doc = event.view?.document ?? app.workspace.getCommandHostDocument();
    const anchor = doc.createElement("div");
    anchor.setAttribute("data-bookmarks-menu-anchor", "");
    Object.assign(anchor.style, {
      position: "fixed",
      left: `${event.clientX}px`,
      top: `${event.clientY}px`,
      width: "1px",
      height: "1px",
      pointerEvents: "none",
    });
    doc.body.appendChild(anchor);
    menu.onHide(() => {
      anchor.remove();
    });
    menu.showAtElement(anchor);
  }

  function showMenu(event: MouseEvent, item: BookmarkItem): void {
    event.preventDefault();
    selectedCtime = item.ctime;
    const menu = new Menu();
    if (!isGroupBookmark(item)) {
      menu.addItem((entry) => {
        entry.setTitle("Open").onClick(() => void activateBookmark(app, item));
      });
    }
    menu.addItem((entry) => {
      entry.setTitle("Rename").onClick(() => startRename(item));
    });
    if (isGroupBookmark(item)) {
      menu.addItem((entry) => {
        entry.setTitle("New group").onClick(() => void createGroup(item.ctime));
      });
    }
    menu.addItem((entry) => {
      entry.setTitle("Remove").onClick(() => void removeBookmark(item.ctime));
    });
    showMenuAtPointer(menu, event);
  }

  function onRowKeydown(event: KeyboardEvent, item: BookmarkItem): void {
    if (event.key === "Enter") {
      event.preventDefault();
      void activate(item);
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void removeBookmark(item.ctime);
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
      isGroupBookmark(node) ? [node, ...flattenItems(node.items)] : [node],
    );
  }

  function toolbarActionClass(className: unknown): string {
    return typeof className === "string" && className
      ? `bookmarks-panel__toolbar-action ${className}`
      : "bookmarks-panel__toolbar-action";
  }
</script>

{#snippet Tree(nodes: BookmarkItem[], parentCtime: number | null)}
  {#each nodes as item, index (item.ctime)}
    <div
      class="bookmarks-panel__item"
      class:bookmarks-panel__item--drop={dropTarget ===
        dropKey(parentCtime, index)}
      data-bookmark-type={item.type}
      data-path={String(item.ctime)}
      data-bookmark-icon={bookmarkIcon(item) ?? "group"}
      role="treeitem"
      tabindex="0"
      aria-label={bookmarkLabel(item)}
      aria-expanded={isGroupBookmark(item)
        ? isExpanded(item.ctime)
        : undefined}
      aria-selected={selectedCtime === item.ctime}
      data-drop={dropTarget === dropKey(parentCtime, index)
        ? "true"
        : undefined}
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
          isGroupBookmark(item) ? item.ctime : parentCtime,
          isGroupBookmark(item) ? item.items.length : index,
        )}
    >
      <div
        class="bookmarks-panel__row"
        class:bookmarks-panel__row--selected={selectedCtime === item.ctime}
      >
          {#if isGroupBookmark(item)}
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
          {/if}
          {#if bookmarkIcon(item)}
            <WorkspaceIcon class="bookmarks-panel__icon" name={bookmarkIcon(item)!} />
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
      {#if isGroupBookmark(item) && isExpanded(item.ctime)}
        <div class="bookmarks-panel__list" role="group">
          {@render Tree(item.items, item.ctime)}
        </div>
      {/if}
    </div>
  {/each}
{/snippet}

<div
  class="bookmarks-panel"
  data-testid="bookmarks-panel"
  data-ui-component="bookmarks-panel"
>
  <Tooltip.Provider delayDuration={0}>
  <div class="bookmarks-panel__toolbar">
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            class={toolbarActionClass(props.class)}
            variant="ghost"
            size="icon"
            aria-label="Bookmark the active tab"
            onclick={(event) => {
              stopToolbarClick(event);
              onBookmarkActive();
            }}
          >
            <BookmarkPlusIcon />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">Bookmark the active tab</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            class={toolbarActionClass(props.class)}
            variant="ghost"
            size="icon"
            aria-label="New group"
            onclick={(event) => {
              stopToolbarClick(event);
              const selected = flattenItems(items).find(
                (item) => item.ctime === selectedCtime,
              );
              void createGroup(
                selected && isGroupBookmark(selected) ? selected.ctime : null,
              );
            }}
          >
            <FolderPlusIcon />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">New group</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            class={toolbarActionClass(props.class)}
            variant="ghost"
            size="icon"
            aria-label="Collapse all"
            aria-pressed={allExpanded}
            onclick={(event) => {
              stopToolbarClick(event);
              toggleCollapseAll();
            }}
          >
            {#if allExpanded}
              <ChevronsDownUpIcon />
            {:else}
              <ChevronsUpDownIcon />
            {/if}
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">Collapse all/Expand all</Tooltip.Content>
    </Tooltip.Root>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            class={toolbarActionClass(props.class)}
            variant="ghost"
            size="icon"
            aria-label="Show search filter"
            aria-pressed={showFilter}
            onclick={(event) => {
              stopToolbarClick(event);
              showFilter = !showFilter;
              if (!showFilter) query = "";
            }}
          >
            <SearchIcon />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom">Show search filter</Tooltip.Content>
    </Tooltip.Root>
  </div>
  </Tooltip.Provider>
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
      tabindex="0"
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
      {@render Tree(visibleItems, null)}
    </div>
  </ScrollArea>
</div>

<style>
  :global {
    [data-ui-component="bookmarks-panel"] .bookmarks-panel__toolbar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
      padding: 0.25rem;
    }

    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action {
      box-sizing: border-box;
      color: var(--ui-workspace-view-foreground);
    }

    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action:hover,
    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action:focus-visible,
    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action[aria-pressed="true"],
    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action[aria-pressed="true"]:hover,
    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action[aria-pressed="true"]:focus-visible {
      border-color: transparent;
      background-color: color-mix(
        in srgb,
        var(--ui-workspace-foreground, currentColor) 14%,
        var(--ui-workspace-panel, var(--ui-workspace-view-background, #fff))
      );
      color: var(
        --ui-workspace-explorer-toolbar-action-hover-foreground,
        var(--ui-workspace-panel-foreground, inherit)
      );
      box-shadow: none;
    }

    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action[aria-pressed="true"],
    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action[aria-pressed="true"]:hover,
    [data-ui-component="bookmarks-panel"]
      .bookmarks-panel__toolbar
      [data-ui-component="button"].bookmarks-panel__toolbar-action[aria-pressed="true"]:focus-visible {
      color: var(--ui-workspace-accent, inherit);
    }

    [data-ui-component="bookmarks-panel"] .bookmarks-panel__tree {
      display: flex;
      box-sizing: border-box;
      min-height: 100%;
      flex-direction: column;
      gap: var(--ui-workspace-explorer-row-gap, 0.125rem);
      padding: var(--ui-workspace-explorer-content-padding, 0.5rem);
      padding-block-end: 2.5rem;
    }
  }

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

  .bookmarks-panel :global(.bookmarks-panel__scroll) {
    flex: 1;
    min-height: 0;
  }

  .bookmarks-panel__item {
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
  }

  .bookmarks-panel__list {
    display: flex;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    flex-direction: column;
    gap: var(--ui-workspace-explorer-row-gap, 0.125rem);
  }

  .bookmarks-panel__item > .bookmarks-panel__list {
    position: relative;
    width: auto;
    max-width: 100%;
    margin-inline-start: var(
      --ui-workspace-explorer-indent,
      calc(
        var(--ui-workspace-explorer-row-border-width, 2px) +
          var(--ui-workspace-explorer-row-padding-inline, 0.375rem) +
          (var(--ui-workspace-icon-size, 1rem) / 2) -
          (var(--ui-workspace-explorer-guide-width, 1px) / 2)
      )
    );
    margin-inline-end: var(
      --ui-workspace-explorer-indent,
      calc(
        var(--ui-workspace-explorer-row-border-width, 2px) +
          var(--ui-workspace-explorer-row-padding-inline, 0.375rem) +
          (var(--ui-workspace-icon-size, 1rem) / 2) -
          (var(--ui-workspace-explorer-guide-width, 1px) / 2)
      )
    );
    padding-inline-start: var(--ui-workspace-explorer-guide-gap, 0.5rem);
    padding-block-start: var(--ui-workspace-explorer-folder-gap, 0.25rem);
    border-inline-start: var(--ui-workspace-explorer-guide-width, 1px) solid
      var(
        --ui-workspace-explorer-guide-color,
        color-mix(in srgb, var(--ui-workspace-view-foreground) 22%, transparent)
      );
  }

  .bookmarks-panel__item--drop > .bookmarks-panel__row {
    box-shadow: inset 0 2px 0 var(--ui-workspace-view-foreground);
  }

  .bookmarks-panel__row {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: var(--ui-workspace-explorer-row-height, 1.75rem);
    align-items: center;
    gap: 0.375rem;
    border: var(--ui-workspace-explorer-row-border-width, 2px) solid transparent;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding-block: 0.125rem;
    padding-inline: var(--ui-workspace-explorer-row-padding-inline, 0.375rem);
    cursor: default;
  }

  .bookmarks-panel__row:hover,
  .bookmarks-panel__row--selected {
    background: var(
      --ui-workspace-explorer-row-hover-background,
      color-mix(in srgb, var(--ui-workspace-view-foreground) 8%, transparent)
    );
  }

  .bookmarks-panel__disclosure {
    display: inline-flex;
    flex: 0 0 auto;
    width: var(--ui-workspace-icon-size, 1rem);
    height: var(--ui-workspace-icon-size, 1rem);
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
  }

  .bookmarks-panel :global(.bookmarks-panel__chevron),
  .bookmarks-panel :global(.bookmarks-panel__icon) {
    flex: 0 0 auto;
    width: var(--ui-workspace-icon-size, 1rem);
    height: var(--ui-workspace-icon-size, 1rem);
  }

  .bookmarks-panel :global(.bookmarks-panel__chevron) {
    transition: transform 120ms ease;
  }

  .bookmarks-panel :global(.bookmarks-panel__chevron[data-open="true"]) {
    transform: rotate(90deg);
  }

  .bookmarks-panel__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bookmarks-panel :global(.bookmarks-panel__rename) {
    flex: 1;
    min-width: 0;
  }
</style>
