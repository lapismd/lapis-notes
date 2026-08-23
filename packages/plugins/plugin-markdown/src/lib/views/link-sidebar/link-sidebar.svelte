<script lang="ts">
  import {
    Menu as UIMenu,
    TextFileView,
    WorkspaceLeaf,
    useTextHighlight,
    type App,
    type EditorPosition,
    type TFile,
  } from "@lapis-notes/api";
  import * as Sidebar from "@lapis-notes/ui/sidebar-custom";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ArrowUpNarrowWide from "@lucide/svelte/icons/arrow-up-narrow-wide";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronsDownUp from "@lucide/svelte/icons/chevrons-down-up";
  import GalleryVertical from "@lucide/svelte/icons/gallery-vertical";
  import Search from "@lucide/svelte/icons/search";
  import { onMount, untrack } from "svelte";
  import {
    subscribeFileScopedPanelRefresh,
  } from "../file-scoped-panel-refresh";
  import { resolvePanelTargetFile } from "../panel-target-file";
  import MarkdownSidebarPanel from "../sidebar-panel/markdown-sidebar-panel.svelte";
  import LinkHoverPreview from "./link-hover-preview.svelte";
  import {
    buildLinkSidebarData,
    formatLinkSidebarSortLabel,
    LINK_SIDEBAR_SORT_OPTIONS,
    type LinkSidebarData,
    type LinkSidebarGroup,
    type LinkSidebarMention,
    type LinkSidebarMode,
    type LinkSidebarSortMode,
  } from "./link-sidebar-data";

  let { app, mode }: { app: App; mode: LinkSidebarMode } = $props();

  const emptyData: LinkSidebarData = { linkedGroups: [], unlinkedGroups: [] };
  let data = $state<LinkSidebarData>(emptyData);
  let followRevision = $state(0);
  const activeFile = $derived.by(() => {
    followRevision;
    return resolvePanelTargetFile(app);
  });
  let loading = $state(false);
  let loadError = $state<string | null>(null);
  let editingPreviews = $state<Record<string, boolean>>({});
  let refreshPending = false;
  let loadVersion = 0;
  let searchOpen = $state(false);
  let query = $state("");
  let collapseResults = $state(false);
  let showMoreContext = $state(false);
  let sortMode = $state<LinkSidebarSortMode>("filename-asc");
  let sectionOpen = $state<Record<string, boolean>>({
    linked: true,
    unlinked: true,
  });
  let resultOpenState = $state<Record<string, boolean>>({});

  const title = $derived(mode === "backlinks" ? "Backlinks" : "Outgoing links");
  const linkedTitle = $derived(
    mode === "backlinks" ? "Linked mentions" : "Links",
  );
  const testId = $derived(
    mode === "backlinks" ? "backlinks-panel" : "outgoing-links-panel",
  );

  function loadData(file: TFile | null, currentSortMode = sortMode): void {
    if (!file) {
      data = emptyData;
      resultOpenState = {};
      loading = false;
      loadError = null;
      return;
    }
    const version = ++loadVersion;
    loading = true;
    loadError = null;
    void buildLinkSidebarData(app, file, mode, currentSortMode)
      .then((next) => {
        if (version !== loadVersion) return;
        data = next;
        const keys = new Set(allGroupKeys(next));
        const currentOpenState = untrack(() => resultOpenState);
        resultOpenState = Object.fromEntries(
          Object.entries(currentOpenState).filter(([key]) => keys.has(key)),
        );
      })
      .catch((error) => {
        if (version !== loadVersion) return;
        app.logger.warn(`Unable to build ${title} data`, error);
        data = emptyData;
        loadError = error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        if (version === loadVersion) loading = false;
      });
  }

  onMount(() =>
    subscribeFileScopedPanelRefresh(
      app,
      () => {
        followRevision += 1;
      },
      { includeAnyMetadataPath: true },
    ),
  );

  $effect(() => {
    followRevision;
    const file = activeFile;
    const currentSortMode = sortMode;
    untrack(() => {
      if (Object.values(editingPreviews).some(Boolean)) {
        refreshPending = true;
        return;
      }
      refreshPending = false;
      loadData(file, currentSortMode);
    });
  });

  function setPreviewEditing(id: string, editing: boolean): void {
    if (editingPreviews[id] === editing) return;
    const next = { ...editingPreviews };
    if (editing) next[id] = true;
    else delete next[id];
    editingPreviews = next;

    if (!Object.values(next).some(Boolean) && refreshPending) {
      refreshPending = false;
      loadData(activeFile);
    }
  }

  function totalMentions(groups: LinkSidebarGroup[]) {
    return groups.reduce((total, group) => total + group.mentions.length, 0);
  }

  function matches(group: LinkSidebarGroup): boolean {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return true;
    return [
      group.file.name,
      group.file.path,
      ...group.mentions.flatMap((mention) => [
        mention.linkText,
        mention.context,
        mention.expandedContext,
      ]),
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalized);
  }

  const filteredData = $derived<LinkSidebarData>({
    linkedGroups: data.linkedGroups.filter(matches),
    unlinkedGroups: data.unlinkedGroups.filter(matches),
  });

  const sections = $derived([
    {
      key: "linked",
      title: linkedTitle,
      groups: filteredData.linkedGroups,
      empty:
        mode === "backlinks"
          ? "No linked mentions found."
          : "No outgoing links found.",
    },
    {
      key: "unlinked",
      title: "Unlinked mentions",
      groups: filteredData.unlinkedGroups,
      empty: "No unlinked mentions found.",
    },
  ]);

  function groupKey(section: string, group: LinkSidebarGroup) {
    return `${section}:${group.file.path}`;
  }

  function groupOpen(section: string, group: LinkSidebarGroup) {
    return resultOpenState[groupKey(section, group)] ?? !collapseResults;
  }

  function setGroupOpen(
    section: string,
    group: LinkSidebarGroup,
    open: boolean,
  ) {
    resultOpenState = { ...resultOpenState, [groupKey(section, group)]: open };
  }

  function allGroupKeys(next = filteredData): string[] {
    return [
      ...next.linkedGroups.map((group) => groupKey("linked", group)),
      ...next.unlinkedGroups.map((group) => groupKey("unlinked", group)),
    ];
  }

  function toggleCollapseResults() {
    collapseResults = !collapseResults;
    resultOpenState = Object.fromEntries(
      allGroupKeys().map((key) => [key, !collapseResults]),
    );
  }

  function createSortMenu(event: MouseEvent) {
    const menu = new UIMenu();
    LINK_SIDEBAR_SORT_OPTIONS.forEach((option, index) => {
      menu.addItem((item) =>
        item
          .setTitle(option.label)
          .setChecked(sortMode === option.value)
          .onClick(() => {
            sortMode = option.value;
          }),
      );
      if (index === 1 || index === 3) menu.addSeparator();
    });
    menu.showAtMouseEvent(event);
  }

  function mainLeafForResult(): WorkspaceLeaf {
    return (
      app.workspace.rootSplit.iterateAllTabs((tabs) => {
        const child = tabs.children[tabs.selectedIndex] ?? tabs.children[0];
        return child instanceof WorkspaceLeaf
          ? child
          : child?.getSelectedLeaf();
      }) ?? app.workspace.getLeaf("tab")
    );
  }

  function fileForMention(mention: LinkSidebarMention): TFile | null {
    return app.vault.getFileByPath(mention.file.path);
  }

  function setCursorLater(leaf: WorkspaceLeaf, pos: EditorPosition) {
    setTimeout(() => {
      if (leaf.view instanceof TextFileView) leaf.view.editor.setCursor(pos);
    }, 100);
  }

  function openMention(event: MouseEvent, mention: LinkSidebarMention) {
    event.preventDefault();
    const file = fileForMention(mention);
    if (!file) return;
    const leaf = mainLeafForResult();
    void leaf.openFile(file).then(() => {
      app.workspace.setActiveLeaf(leaf, { focus: true });
      if (mode === "backlinks") {
        setCursorLater(leaf, { line: mention.line, ch: mention.ch });
      }
    });
  }
</script>

<MarkdownSidebarPanel
  {title}
  {testId}
  component={mode === "backlinks" ? "backlinks" : "outgoing-links"}
  showTitle={false}
  searchPlaceholder="Search link results"
  searchToggleable
  bind:searchOpen
  bind:query
>
  {#snippet toolbar()}
    <Button
      variant="ghost"
      size="sm"
      aria-label="Collapse results"
      aria-pressed={collapseResults}
      data-active={collapseResults}
      onclick={toggleCollapseResults}
    >
      <ChevronsDownUp />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      aria-label="Show more context"
      aria-pressed={showMoreContext}
      data-active={showMoreContext}
      onclick={() => (showMoreContext = !showMoreContext)}
    >
      <GalleryVertical />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      aria-label="Change sort order"
      data-tooltip={formatLinkSidebarSortLabel(sortMode)}
      onclick={createSortMenu}
    >
      <ArrowUpNarrowWide />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      aria-label="Search link results"
      aria-pressed={searchOpen}
      data-active={searchOpen}
      onclick={() => {
        searchOpen = !searchOpen;
        if (!searchOpen) query = "";
      }}
    >
      <Search />
    </Button>
  {/snippet}

  <Sidebar.NestedProvider
    id={`markdown-${mode}`}
    class="markdown-link-sidebar__fill"
  >
    <Sidebar.Content class="markdown-link-sidebar__content">
      {#if !activeFile}
        <p class="markdown-sidebar-panel__empty">
          Open a Markdown note to see {title.toLocaleLowerCase()}.
        </p>
      {:else if loadError}
        <p class="markdown-sidebar-panel__empty" role="alert">
          Unable to load {title.toLocaleLowerCase()}: {loadError}
        </p>
        <button
          type="button"
          class="markdown-link-sidebar__retry"
          onclick={() => loadData(activeFile)}
        >Retry</button>
      {:else}
        {#each sections as section (section.key)}
          <section
            class="markdown-link-sidebar__section"
            data-section={section.key}
          >
            <button
              type="button"
              class="markdown-link-sidebar__section-header"
              aria-expanded={sectionOpen[section.key]}
              onclick={() =>
                (sectionOpen = {
                  ...sectionOpen,
                  [section.key]: !sectionOpen[section.key],
                })}
            >
              <span>{section.title}</span>
              <span class="markdown-link-sidebar__count">
                {totalMentions(section.groups)}
              </span>
            </button>
            {#if sectionOpen[section.key]}
              {#if loading && section.key === "unlinked" && !section.groups.length}
                <p class="markdown-sidebar-panel__empty">Loading…</p>
              {:else if !section.groups.length}
                <p class="markdown-sidebar-panel__empty">{section.empty}</p>
              {:else}
                <Sidebar.Menu>
                  {#each section.groups as group (group.file.path)}
                    {@const open = groupOpen(section.key, group)}
                    <Sidebar.MenuItem>
                      <button
                        type="button"
                        class="markdown-link-sidebar__group-button"
                        aria-expanded={open}
                        onclick={() => setGroupOpen(section.key, group, !open)}
                      >
                        <ChevronRight data-open={open} />
                        <span
                          class="markdown-link-sidebar__group-title"
                          use:useTextHighlight={{
                            query,
                            value: group.file.basename,
                          }}>{group.file.basename}</span
                        >
                        <span class="markdown-link-sidebar__count">
                          {group.mentions.length}
                        </span>
                      </button>
                      {#if open}
                        <div class="markdown-link-sidebar__mentions">
                          {#each group.mentions as mention (mention.id)}
                            {@const previewFile = fileForMention(mention)}
                            {#if previewFile}
                              <LinkHoverPreview
                                {app}
                                file={previewFile}
                                editingId={mention.id}
                                oneditingchange={setPreviewEditing}
                                sourcePath={activeFile.path}
                                label={`Open ${group.file.basename}: ${mention.context}`}
                                onclick={(event) => openMention(event, mention)}
                              >
                                <span
                                  class="markdown-link-sidebar__mention-context"
                                >
                                  {showMoreContext
                                    ? mention.expandedContext
                                    : mention.context}
                                </span>
                              </LinkHoverPreview>
                            {/if}
                          {/each}
                        </div>
                      {/if}
                    </Sidebar.MenuItem>
                  {/each}
                </Sidebar.Menu>
              {/if}
            {/if}
          </section>
        {/each}
      {/if}
    </Sidebar.Content>
  </Sidebar.NestedProvider>
</MarkdownSidebarPanel>

<style>
  :global(
    [data-ui-component="sidebar-custom"][data-ui-part="sidebar-content"].markdown-link-sidebar__content
  ) {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    flex-direction: column;
    gap: 0.35rem;
    overflow: visible;
    background: transparent;
  }

  :global(.markdown-link-sidebar__fill),
  :global(.markdown-link-sidebar__fill [data-ui-part="sidebar-menu"]),
  :global(.markdown-link-sidebar__fill [data-ui-part="sidebar-menu-item"]) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
  }

  .markdown-link-sidebar__section {
    min-width: 0;
  }

  .markdown-link-sidebar__section-header,
  .markdown-link-sidebar__group-button,
  :global(.markdown-link-sidebar__mention) {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    align-items: center;
    border: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  .markdown-link-sidebar__section-header {
    justify-content: space-between;
    min-height: 1.75rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .markdown-link-sidebar__group-button {
    gap: 0.25rem;
    min-height: 1.75rem;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0.125rem 0.5rem 0.125rem 0.25rem;
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .markdown-link-sidebar__group-button:hover,
  .markdown-link-sidebar__group-button:focus-visible,
  :global(.markdown-link-sidebar__mention:hover),
  :global(.markdown-link-sidebar__mention:focus-visible) {
    background: var(
      --ui-workspace-explorer-row-hover-background,
      var(--sidebar-accent)
    );
    outline: none;
  }

  .markdown-link-sidebar__group-button :global(svg) {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
    transition: transform 120ms ease;
  }

  .markdown-link-sidebar__group-button :global(svg[data-open="true"]) {
    transform: rotate(90deg);
  }

  .markdown-link-sidebar__group-title {
    overflow: hidden;
    min-width: 0;
    flex: 1 1 auto;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .markdown-link-sidebar__count {
    flex: 0 0 auto;
    min-width: 1.5rem;
    font-variant-numeric: tabular-nums;
    text-align: end;
    opacity: 0.75;
  }

  .markdown-link-sidebar__mentions {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    margin-inline-start: 1.25rem;
    padding-bottom: 0.25rem;
  }

  :global(.markdown-link-sidebar__mention) {
    min-height: 1.75rem;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .markdown-link-sidebar__mention-context {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    white-space: pre-line;
  }

  .markdown-link-sidebar__retry {
    align-self: center;
    border: 1px solid currentColor;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    margin: 0.5rem;
    padding: 0.25rem 0.625rem;
  }
</style>
