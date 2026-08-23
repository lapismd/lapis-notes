<script lang="ts">
  import {
    FileView,
    useTextHighlight,
    type App,
    type WorkspaceLeaf,
  } from "@lapis-notes/api";
  import * as Sidebar from "@lapis-notes/ui/sidebar-custom";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import GalleryVertical from "@lucide/svelte/icons/gallery-vertical";
  import Search from "@lucide/svelte/icons/search";
  import { onMount, tick } from "svelte";
  import {
    readSortedHeadings,
    subscribeFileScopedPanelRefresh,
  } from "../file-scoped-panel-refresh";
  import { resolvePanelTargetFile } from "../panel-target-file";
  import MarkdownSidebarPanel from "../sidebar-panel/markdown-sidebar-panel.svelte";
  import {
    buildOutlineTree,
    expandableOutlineIds,
    filterOutlineTree,
    type OutlineNode,
  } from "./outline-tree";

  let { app }: { app: App } = $props();

  let query = $state("");
  let searchOpen = $state(false);
  let openedOverride = $state<Set<string> | null>(null);
  let openedPath = $state<string | null>(null);
  let selectedLine = $state<number | null>(null);
  let contentElement = $state<HTMLElement | null>(null);
  let followRevision = $state(0);
  let headings = $state<import("@lapis-notes/api").HeadingCache[]>([]);
  let headingsGeneration = 0;

  const activeFile = $derived.by(() => {
    followRevision;
    return resolvePanelTargetFile(app);
  });
  const autoScroll = $derived(
    Boolean(
      app.configuration
        .getConfiguration()
        .get("outline.autoScrollToCurrentSection", false),
    ),
  );
  const tree = $derived(buildOutlineTree(headings));
  const filteredTree = $derived(filterOutlineTree(tree, query));
  const defaultOpened = $derived(
    new Set(expandableOutlineIds(headings.length ? tree : [])),
  );
  const opened = $derived(openedOverride ?? defaultOpened);

  async function refreshHeadings(): Promise<void> {
    const generation = ++headingsGeneration;
    const path = activeFile?.path ?? null;
    const next = await readSortedHeadings(app, path);
    if (generation !== headingsGeneration || path !== (activeFile?.path ?? null)) return;
    headings = next;
  }

  function fileLeaf(): WorkspaceLeaf | null {
    let found: WorkspaceLeaf | null = null;
    app.workspace.iterateRootLeaves((leaf) => {
      if (!found && leaf.view instanceof FileView && leaf.view.file) found = leaf;
    });
    return found;
  }

  function jumpTo(node: OutlineNode) {
    selectedLine = node.heading.position.start.line;
    const leaf = fileLeaf();
    const editor =
      leaf?.view && "editor" in leaf.view
        ? (leaf.view as {
            editor?: {
              setCursor?: (position: { line: number; ch: number }) => void;
            };
          }).editor
        : null;
    editor?.setCursor?.({
      line: node.heading.position.start.line,
      ch: node.heading.position.start.col,
    });
    const headingElement = leaf?.containerEl.querySelector<HTMLElement>(
      `[data-line="${node.heading.position.start.line + 1}"]`,
    );
    headingElement?.scrollIntoView({ behavior: "instant", block: "start" });
  }

  function setOpen(id: string, value: boolean) {
    const next = new Set(opened);
    if (value) next.add(id);
    else next.delete(id);
    openedOverride = next;
  }

  function toggleCollapse() {
    openedOverride = opened.size
      ? new Set()
      : new Set(expandableOutlineIds(filteredTree));
  }

  function toggleSearch() {
    searchOpen = !searchOpen;
    if (!searchOpen) query = "";
  }

  function toggleAutoScroll() {
    void app.configuration
      .getConfiguration("outline")
      .update("autoScrollToCurrentSection", !autoScroll);
  }

  $effect(() => {
    const currentPath = activeFile?.path ?? null;
    if (openedPath === currentPath) return;
    openedPath = currentPath;
    openedOverride = null;
    selectedLine = null;
  });

  $effect(() => {
    const leaf = fileLeaf();
    if (!leaf || typeof IntersectionObserver === "undefined") return;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    void tick().then(() => {
      if (cancelled) return;
      const scrollRoot = leaf.containerEl.closest(
        "[data-scroll-area-viewport]",
      );
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.find((entry) => entry.isIntersecting);
          const line = Number((visible?.target as HTMLElement | undefined)?.dataset.line);
          if (!Number.isFinite(line)) return;
          selectedLine = line - 1;
          if (autoScroll) {
            contentElement
              ?.querySelector(`[data-outline-line="${line - 1}"]`)
              ?.scrollIntoView({ block: "nearest" });
          }
        },
        { root: scrollRoot, rootMargin: "0px 0px -80% 0px", threshold: 0.1 },
      );
      leaf.containerEl
        .querySelectorAll<HTMLElement>("h1[data-line],h2[data-line],h3[data-line],h4[data-line],h5[data-line],h6[data-line],[data-line].cm-header")
        .forEach((element) => observer?.observe(element));
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  });

  onMount(() =>
    subscribeFileScopedPanelRefresh(app, () => {
      followRevision += 1;
      return refreshHeadings();
    }),
  );
</script>

<MarkdownSidebarPanel
  title="Outline"
  testId="outline-panel"
  component="outline"
  showTitle={false}
  searchPlaceholder="Search headings"
  searchToggleable
  bind:searchOpen
  bind:query
>
  {#snippet toolbar()}
    <Button
      variant="ghost"
      size="sm"
      aria-label="Search headings"
      aria-pressed={searchOpen}
      data-active={searchOpen}
      onclick={toggleSearch}
    >
      <Search />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      aria-label="Auto-scroll to current section"
      aria-pressed={autoScroll}
      data-active={autoScroll}
      onclick={toggleAutoScroll}
    >
      <GalleryVertical />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      aria-label={opened.size ? "Collapse all headings" : "Expand all headings"}
      onclick={toggleCollapse}
    >
      <ChevronsUpDown />
    </Button>
  {/snippet}

  <div bind:this={contentElement} class="markdown-outline__root">
    <Sidebar.NestedProvider
      id="markdown-outline"
      class="markdown-outline__fill"
    >
      <Sidebar.Content class="markdown-outline__menu-host">
        <Sidebar.Menu class="markdown-outline__menu">
          {#each filteredTree as node (node.id)}
            {@render OutlineTree({ node })}
          {:else}
            <p class="markdown-sidebar-panel__empty">No headings found.</p>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Content>
    </Sidebar.NestedProvider>
  </div>
</MarkdownSidebarPanel>

{#snippet OutlineTree({ node, nested = false }: { node: OutlineNode; nested?: boolean })}
  {@const Item = nested ? Sidebar.MenuSubItem : Sidebar.MenuItem}
  <Item>
    {#if node.children.length}
      <Collapsible.Root
        open={opened.has(node.id)}
        onOpenChange={(value) => setOpen(node.id, value)}
      >
        <Collapsible.Trigger
          class="markdown-outline__row"
          data-active={selectedLine === node.heading.position.start.line}
          data-outline-line={node.heading.position.start.line}
          onclick={() => jumpTo(node)}
        >
          <ChevronRight data-open={opened.has(node.id)} />
          <span
            class="markdown-outline__label"
            use:useTextHighlight={{ query, value: node.label }}>{node.label}</span
          >
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Sidebar.MenuSub class="markdown-outline__sub">
            {#each node.children as child (child.id)}
              {@render OutlineTree({ node: child, nested: true })}
            {/each}
          </Sidebar.MenuSub>
        </Collapsible.Content>
      </Collapsible.Root>
    {:else}
      <Sidebar.MenuButton
        class="markdown-outline__row"
        isActive={selectedLine === node.heading.position.start.line}
        data-outline-line={node.heading.position.start.line}
        onclick={() => jumpTo(node)}
      >
        <span
          class="markdown-outline__label"
          use:useTextHighlight={{ query, value: node.label }}>{node.label}</span
        >
      </Sidebar.MenuButton>
    {/if}
  </Item>
{/snippet}

<style>
  .markdown-outline__root,
  :global(.markdown-outline__fill),
  :global(.markdown-outline__menu),
  :global(.markdown-outline__fill [data-ui-part="sidebar-menu-item"]),
  :global(.markdown-outline__fill [data-ui-part="collapsible"]) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
  }

  :global(
    .markdown-outline__fill
      [data-ui-component="sidebar-custom"][data-ui-part="sidebar-content"].markdown-outline__menu-host
  ) {
    width: 100%;
    min-width: 0;
    overflow: visible;
    background: transparent;
  }

  :global(
    [data-ui-component="sidebar-custom"][data-ui-part="sidebar-menu-sub"].markdown-outline__sub
  ) {
    box-sizing: border-box;
    width: calc(100% - 1rem);
    margin-inline: 0;
    margin-inline-start: 1rem;
    padding-inline: calc(0.25rem - 1px) 0;
    translate: none;
  }

  :global(.markdown-outline__fill [data-ui-part].markdown-outline__row) {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: var(--ui-workspace-explorer-row-height, 1.75rem);
    align-items: center;
    gap: 0.25rem;
    border: 2px solid transparent;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0.125rem 0.375rem;
    color: inherit;
    background: transparent;
    font: inherit;
    font-size: 0.75rem;
    line-height: 1rem;
    text-align: start;
    cursor: pointer;
  }

  :global(.markdown-outline__fill [data-ui-part].markdown-outline__row:hover),
  :global(
    .markdown-outline__fill [data-ui-part].markdown-outline__row:focus-visible
  ),
  :global(
    .markdown-outline__fill [data-ui-part].markdown-outline__row[data-active="true"]
  ),
  :global(
    .markdown-outline__fill
      [data-ui-part].markdown-outline__row[data-active="true"]:hover
  ) {
    background: var(
      --ui-workspace-explorer-row-hover-background,
      var(--sidebar-accent)
    );
    outline: none;
  }

  :global(.markdown-outline__fill [data-ui-part].markdown-outline__row svg) {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
  }

  :global(.markdown-outline__fill [data-ui-part].markdown-outline__row svg) {
    transition: transform 120ms ease;
  }

  :global(
    .markdown-outline__fill
      [data-ui-part].markdown-outline__row
      svg[data-open="true"]
  ) {
    transform: rotate(90deg);
  }

  .markdown-outline__label {
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
