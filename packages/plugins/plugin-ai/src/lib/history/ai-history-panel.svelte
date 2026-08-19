<script lang="ts">
  import { useTextHighlight, type App } from "@lapis-notes/api";
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import ArchiveIcon from "@lucide/svelte/icons/archive";
  import ArchiveRestoreIcon from "@lucide/svelte/icons/archive-restore";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import FolderClosedIcon from "@lucide/svelte/icons/folder-closed";
  import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
  import MessageSquareIcon from "@lucide/svelte/icons/message-square";
  import MoreHorizontalIcon from "@lucide/svelte/icons/ellipsis";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import TrashIcon from "@lucide/svelte/icons/trash-2";
  import { onMount, tick } from "svelte";
  import { formatChatTimestamp } from "../chat/chat-time";
  import type { ConversationRepository } from "../conversations/conversation-repository";
  import type { ConversationListEntry } from "../conversations/transcript-store";
  import type { ConversationLocation } from "../conversations/types";
  import {
    FILE_EXPLORER_SELECTION_CHANGE_EVENT,
    conversationScopeFromVaultPath,
    resolveHistoryCreationScope,
    workspaceEvents,
  } from "../conversations/history-creation-scope";
  import { formatDirectoryContextLabel } from "../conversations/scope-tree";
  import {
    buildConversationHistoryTree,
    conversationHistoryFolderPaths,
    type ConversationHistoryFolder,
  } from "./conversation-history-tree";

  let {
    app,
    repository,
    getScope,
    getActiveConversation,
    onOpenConversation,
    onNewConversation,
    listConversationFolders: _listConversationFolders,
    searchAllConversations,
  }: {
    app: App;
    repository: ConversationRepository;
    getScope: () => string;
    getActiveConversation: () => ConversationLocation | null;
    onOpenConversation: (
      location: ConversationLocation,
    ) => void | Promise<void>;
    onNewConversation: (scopeDir: string) => void | Promise<void>;
    listConversationFolders: () => string[];
    searchAllConversations: (query: string) => Promise<ConversationListEntry[]>;
  } = $props();

  let root = $state<HTMLDivElement>();
  let scopeDir = $state("");
  let selectedScope = $state("");
  let activeConversation = $state<ConversationLocation | null>(null);
  let entries = $state<ConversationListEntry[]>([]);
  let showArchived = $state(false);
  let filtersExpanded = $state(false);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let query = $state("");
  let openScopes = $state<Set<string>>(new Set());
  let selectionInitialized = false;
  let contextLockedByTree = false;
  let refreshVersion = 0;

  const visibleEntries = $derived(
    entries.filter(
      (entry) => showArchived || entry.metadata?.status !== "archived",
    ),
  );
  const folders = $derived(buildConversationHistoryTree(visibleEntries));
  const folderPaths = $derived(conversationHistoryFolderPaths(folders));
  const allFoldersOpen = $derived(
    folderPaths.length > 0 && folderPaths.every((path) => openScopes.has(path)),
  );
  const creationScopeLabel = $derived(
    formatDirectoryContextLabel(selectedScope),
  );
  const expandFoldersLabel = $derived(
    allFoldersOpen
      ? "Collapse all conversation folders"
      : "Expand all conversation folders",
  );
  const newChatLabel = $derived(`New chat in ${creationScopeLabel}`);

  function entryKey(entry: ConversationListEntry): string {
    return `${entry.location.scopeDir}\u0000${entry.location.conversationId}`;
  }

  function sameLocation(
    left: ConversationLocation | null,
    right: ConversationLocation,
  ): boolean {
    return (
      left?.scopeDir === right.scopeDir &&
      left.conversationId === right.conversationId
    );
  }

  function revealScope(path: string): void {
    const next = new Set(openScopes);
    let changed = false;
    const add = (scope: string) => {
      if (next.has(scope)) return;
      next.add(scope);
      changed = true;
    };
    if (!path) add("");
    const segments = path.split("/").filter(Boolean);
    for (let index = 0; index < segments.length; index += 1) {
      add(segments.slice(0, index + 1).join("/"));
    }
    if (changed) openScopes = next;
  }

  function setFolderOpen(path: string, open: boolean): void {
    const next = new Set(openScopes);
    if (open) next.add(path);
    else next.delete(path);
    openScopes = next;
  }

  function selectFolder(path: string): void {
    selectedScope = path;
    contextLockedByTree = true;
  }

  function applyCreationScope(path: string, source: "workspace" | "tree"): void {
    if (selectedScope !== path) selectedScope = path;
    contextLockedByTree = source === "tree";
    revealScope(path);
  }

  function toggleAllFolders(): void {
    openScopes = allFoldersOpen ? new Set() : new Set(folderPaths);
  }

  function matchesFolderLabel(
    entry: ConversationListEntry,
    normalizedQuery: string,
  ): boolean {
    const scope = entry.location.scopeDir.toLocaleLowerCase();
    const title = entry.metadata?.title?.toLocaleLowerCase() ?? "";
    return scope.includes(normalizedQuery) || title.includes(normalizedQuery);
  }

  async function matchLocalConversation(
    entry: ConversationListEntry,
    normalizedQuery: string,
  ): Promise<ConversationListEntry | null> {
    if (matchesFolderLabel(entry, normalizedQuery)) return entry;
    if (entry.unavailableReason) return null;
    try {
      const snapshot = await repository.read(entry.location);
      const searchable = snapshot.transcript.flatMap((item): string[] => {
        if (item.type === "message" || item.type === "thinking.summary") {
          return [item.text];
        }
        if (item.type === "tool") {
          return [item.name, ...(item.input ? [item.input] : [])];
        }
        return [];
      });
      const preview = searchable.find((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
      return preview ? { ...entry, preview } : null;
    } catch {
      return null;
    }
  }

  function mergeLocalEntries(
    indexedEntries: ConversationListEntry[],
    localEntries: ConversationListEntry[],
  ): ConversationListEntry[] {
    const merged = new Map(
      indexedEntries.map((entry) => [entryKey(entry), entry]),
    );
    for (const entry of localEntries) {
      const indexed = merged.get(entryKey(entry));
      merged.set(entryKey(entry), {
        ...indexed,
        ...entry,
        ...(indexed?.preview ? { preview: indexed.preview } : {}),
      });
    }
    return [...merged.values()];
  }

  async function loadEntries(): Promise<ConversationListEntry[]> {
    const localEntries = await repository.listAll();
    const trimmed = query.trim();
    if (!trimmed) {
      try {
        return mergeLocalEntries(
          await searchAllConversations(""),
          localEntries,
        );
      } catch {
        return localEntries;
      }
    }

    const normalizedQuery = trimmed.toLocaleLowerCase();
    const localMatches = (
      await Promise.all(
        localEntries.map((entry) =>
          matchLocalConversation(entry, normalizedQuery),
        ),
      )
    ).filter((entry): entry is ConversationListEntry => Boolean(entry));
    let matches: ConversationListEntry[];
    let allEntries: ConversationListEntry[];
    try {
      [matches, allEntries] = await Promise.all([
        searchAllConversations(trimmed),
        searchAllConversations(""),
      ]);
    } catch {
      return localMatches;
    }
    const merged = new Map(matches.map((entry) => [entryKey(entry), entry]));
    for (const entry of allEntries) {
      if (
        matchesFolderLabel(entry, normalizedQuery) &&
        !merged.has(entryKey(entry))
      ) {
        merged.set(entryKey(entry), entry);
      }
    }
    return mergeLocalEntries([...merged.values()], localMatches);
  }

  async function refresh(followActiveScope = false): Promise<void> {
    const version = ++refreshVersion;
    const nextScope = getScope();
    if (scopeDir !== nextScope) scopeDir = nextScope;
    const nextActiveConversation = getActiveConversation();
    if (
      activeConversation?.scopeDir !== nextActiveConversation?.scopeDir ||
      activeConversation?.conversationId !==
        nextActiveConversation?.conversationId
    ) {
      activeConversation = nextActiveConversation;
    }
    if (followActiveScope || !selectionInitialized) {
      if (!contextLockedByTree) {
        applyCreationScope(
          resolveHistoryCreationScope(app, nextScope),
          "workspace",
        );
      } else {
        revealScope(selectedScope);
      }
      selectionInitialized = true;
    }
    if (!loading) loading = true;
    if (error !== null) error = null;
    try {
      const next = await loadEntries();
      if (version === refreshVersion) entries = next;
    } catch (cause) {
      if (version === refreshVersion) {
        error = cause instanceof Error ? cause.message : String(cause);
      }
    } finally {
      if (version === refreshVersion) loading = false;
    }
  }

  async function setArchived(
    entry: ConversationListEntry,
    archived: boolean,
  ): Promise<void> {
    await repository.archive(entry.location, archived);
    await refresh();
  }

  async function remove(entry: ConversationListEntry): Promise<void> {
    await repository.delete(entry.location);
    await refresh();
  }

  function updateQuery(value: string): void {
    query = value;
    void refresh();
  }

  $effect(() => {
    scopeDir;
    entries;
    void tick().then(() => {
      root
        ?.querySelector<HTMLElement>('[data-active-folder="true"]')
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  });

  onMount(() => {
    const refreshFromWorkspace = () => {
      queueMicrotask(() => void refresh(true));
    };
    const refreshFromVault = () => void refresh();
    const applyExplorerSelection = (path: unknown) => {
      if (typeof path !== "string") return;
      applyCreationScope(conversationScopeFromVaultPath(app, path), "workspace");
    };
    const events = workspaceEvents(app);
    const activeLeaf = app.workspace.on(
      "active-leaf-change",
      refreshFromWorkspace,
    );
    const explorerSelection = events.on(
      FILE_EXPLORER_SELECTION_CHANGE_EVENT,
      applyExplorerSelection,
    );
    const created = app.vault.on("create", refreshFromVault);
    const deleted = app.vault.on("delete", refreshFromVault);
    const modified = app.vault.on("modify", refreshFromVault);
    const renamed = app.vault.on("rename", refreshFromVault);
    void refresh(true);
    return () => {
      app.workspace.offref(activeLeaf);
      events.offref(explorerSelection);
      app.vault.offref(created);
      app.vault.offref(deleted);
      app.vault.offref(modified);
      app.vault.offref(renamed);
    };
  });
</script>

<Tooltip.Provider delayDuration={0}>
<div
  bind:this={root}
  class="ai-history"
  data-ui-component="ai-conversation-history"
  data-testid="ai-conversation-history"
  data-current-scope={scopeDir || "vault-root"}
  data-creation-scope={selectedScope || "vault-root"}
>
  <div class="ai-history__chrome" data-ui-part="chrome">
    <SearchFilterBar
      value={query}
      inputMode="plain"
      ariaLabel="Search conversations"
      placeholder="Search conversations…"
      showFilterToggle
      bind:filtersExpanded
      expandFiltersLabel="Show conversation options"
      collapseFiltersLabel="Hide conversation options"
      onValueChange={updateQuery}
      onClearSearch={() => updateQuery("")}
    >
      {#snippet filters()}
        <label class="ai-history__archive-filter">
          <Switch
            size="sm"
            aria-label="Show archived conversations"
            bind:checked={showArchived}
          />
          <span>Show archived</span>
        </label>
      {/snippet}
      {#snippet actions()}
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props }: { props: Record<string, unknown> })}
              <Button
                {...props}
                size="icon-sm"
                variant="ghost"
                aria-label={expandFoldersLabel}
                disabled={folderPaths.length === 0}
                onclick={toggleAllFolders}
              >
                <ChevronsUpDownIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">{expandFoldersLabel}</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props }: { props: Record<string, unknown> })}
              <Button
                {...props}
                size="icon-sm"
                variant="ghost"
                aria-label={newChatLabel}
                onclick={() => void onNewConversation(selectedScope)}
              >
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">{newChatLabel}</Tooltip.Content>
        </Tooltip.Root>
      {/snippet}
    </SearchFilterBar>
    <p
      class="ai-history__creation-scope"
      data-testid="ai-history-creation-scope"
      aria-hidden="true"
    >
      {creationScopeLabel}
    </p>
  </div>

  <ScrollArea class="ai-history__scroll">
    <div class="ai-history__body">
      {#if error}
        <p class="ai-history__state" role="alert">{error}</p>
      {:else if loading && entries.length === 0}
        <p class="ai-history__state">Loading conversations…</p>
      {:else if folders.length === 0}
        <p class="ai-history__state">
          {query.trim()
            ? "No conversations match your search."
            : showArchived
              ? "No conversations yet."
              : "No active conversations yet."}
        </p>
      {:else}
        <Sidebar.Menu
          class="ai-history__tree"
          role="tree"
          aria-label="Conversation history"
        >
          {#each folders as folder (folder.path || "vault-root")}
            {@render FolderNode({ folder })}
          {/each}
        </Sidebar.Menu>
      {/if}
    </div>
  </ScrollArea>
</div>
</Tooltip.Provider>

{#snippet FolderNode({
  folder,
  level = 1,
  nested = false,
}: {
  folder: ConversationHistoryFolder;
  level?: number;
  nested?: boolean;
})}
  {@const Item = nested ? Sidebar.MenuSubItem : Sidebar.MenuItem}
  {@const open = query.trim() ? true : openScopes.has(folder.path)}
  <Item role="none" class="ai-history__folder-item">
    <Collapsible.Root
      {open}
      onOpenChange={(value) => setFolderOpen(folder.path, value)}
    >
      <Collapsible.Trigger
        class="ai-history__folder-row"
        role="treeitem"
        aria-level={level}
        aria-selected={folder.path === selectedScope}
        aria-expanded={open}
        aria-label={`${folder.path || "Vault root"}, ${folder.conversationCount} conversation${folder.conversationCount === 1 ? "" : "s"}`}
        data-active-folder={folder.path === selectedScope}
        onclick={() => selectFolder(folder.path)}
      >
        <ChevronRightIcon
          class="ai-history__disclosure"
          data-open={open}
          aria-hidden="true"
        />
        {#if open}
          <FolderOpenIcon class="ai-history__folder-icon" aria-hidden="true" />
        {:else}
          <FolderClosedIcon
            class="ai-history__folder-icon"
            aria-hidden="true"
          />
        {/if}
        <span
          class="ai-history__folder-label"
          use:useTextHighlight={{ query, value: folder.name }}
          >{folder.name}</span
        >
        <Sidebar.MenuBadge class="ai-history__count">
          {folder.conversationCount}
        </Sidebar.MenuBadge>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Sidebar.MenuSub role="group" class="ai-history__subtree">
          {#each folder.children as child (child.path)}
            {@render FolderNode({
              folder: child,
              level: level + 1,
              nested: true,
            })}
          {/each}
          {#each folder.conversations as entry (entryKey(entry))}
            {@render ConversationRow({ entry, level: level + 1 })}
          {/each}
        </Sidebar.MenuSub>
      </Collapsible.Content>
    </Collapsible.Root>
  </Item>
{/snippet}

{#snippet ConversationRow({
  entry,
  level,
}: {
  entry: ConversationListEntry;
  level: number;
})}
  {@const title = entry.metadata?.title ?? "Untitled conversation"}
  {@const current = sameLocation(activeConversation, entry.location)}
  <Sidebar.MenuSubItem role="none" class="ai-history__conversation-item">
    <div
      class="ai-history__conversation-row"
      role="treeitem"
      aria-level={level}
      aria-selected={current}
      data-active={current}
    >
      <button
        class="ai-history__open"
        type="button"
        disabled={Boolean(entry.unavailableReason)}
        aria-label={title}
        onclick={() => void onOpenConversation(entry.location)}
      >
        <MessageSquareIcon class="ai-history__chat-icon" aria-hidden="true" />
        <span class="ai-history__conversation-copy">
          <span
            class="ai-history__conversation-title"
            use:useTextHighlight={{ query, value: title }}>{title}</span
          >
          {#if entry.preview}
            <span
              class="ai-history__preview"
              use:useTextHighlight={{ query, value: entry.preview }}
              >{entry.preview}</span
            >
          {:else}
            <span class="ai-history__timestamp">
              {entry.unavailableReason ??
                (entry.metadata
                  ? formatChatTimestamp(entry.metadata.updatedAt)
                  : "Unavailable")}
            </span>
          {/if}
        </span>
        {#if entry.metadata?.status === "archived"}
          <Badge variant="outline" class="ai-history__archived">Archived</Badge>
        {/if}
      </button>
      {#if entry.metadata}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props }: { props: Record<string, unknown> })}
              <Button
                {...props}
                size="icon-xs"
                variant="ghost"
                class="ai-history__conversation-actions"
                aria-label={`Conversation actions for ${title}`}
              >
                <MoreHorizontalIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Group>
              <DropdownMenu.Item
                onclick={() =>
                  void setArchived(
                    entry,
                    entry.metadata?.status !== "archived",
                  )}
              >
                {#if entry.metadata.status === "archived"}
                  <ArchiveRestoreIcon
                    data-icon="inline-start"
                    aria-hidden="true"
                  />
                  Restore
                {:else}
                  <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
                  Archive
                {/if}
              </DropdownMenu.Item>
              <DropdownMenu.Item onclick={() => void remove(entry)}>
                <TrashIcon data-icon="inline-start" aria-hidden="true" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>
  </Sidebar.MenuSubItem>
{/snippet}

<style>
  .ai-history {
    --ai-history-surface: var(
      --ui-workspace-view-background,
      var(--ui-workspace-background, var(--background))
    );
    --ai-history-foreground: var(
      --ui-workspace-view-foreground,
      var(--ui-workspace-foreground, var(--foreground))
    );

    display: flex;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    color: var(--ai-history-foreground);
    background: var(--ai-history-surface);
    font-family: var(--ui-workspace-explorer-font-family, inherit);
    font-size: var(--ui-workspace-explorer-font-size, 0.8125rem);
    --ai-history-count-end-pad: 0.5rem;
    --ai-history-count-width: 2rem;
  }

  .ai-history__chrome {
    position: relative;
    z-index: 10;
    flex: 0 0 auto;
    background: var(--ai-history-surface);
    --cv-search-filter-background: var(--ai-history-surface);
    --cv-search-filter-justify: center;
    --cv-search-filter-content-justify: center;
  }

  .ai-history__chrome :global(.cv-search-filter-bar) {
    padding: 0.5rem;
  }

  .ai-history__chrome :global(.cv-search-filter-bar__filters) {
    flex-basis: 100%;
  }

  .ai-history__chrome
    :global(.cv-search-filter-bar__actions [data-ui-component="button"]:hover),
  .ai-history__chrome
    :global(
      .cv-search-filter-bar__actions [data-ui-component="button"]:focus-visible
    ),
  .ai-history__chrome :global(.cv-search-filter-bar__filter-toggle:hover),
  .ai-history__chrome
    :global(.cv-search-filter-bar__filter-toggle:focus-visible) {
    background: color-mix(
      in srgb,
      var(--ai-history-foreground) 14%,
      var(--ai-history-surface)
    );
    color: var(--ai-history-foreground);
  }

  .ai-history__creation-scope {
    margin: 0;
    padding: 0 0.5rem 0.4rem;
    color: color-mix(
      in srgb,
      var(--ai-history-foreground) 68%,
      var(--ai-history-surface)
    );
    font-size: 0.75rem;
    line-height: 1.25rem;
    text-align: center;
    pointer-events: none;
  }

  .ai-history__archive-filter {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    font-size: 0.75rem;
    cursor: pointer;
  }

  :global(.ai-history__scroll) {
    min-height: 0;
    height: 100%;
    flex: 1 1 auto;
    --ui-scroll-area-foreground: var(
      --ui-workspace-border-strong,
      var(--sidebar-border)
    );
  }

  .ai-history__body {
    box-sizing: border-box;
    min-height: 100%;
    padding: var(--ui-workspace-explorer-content-padding, 0.5rem);
    padding-block-end: 2.5rem;
  }

  :global(.ai-history__tree),
  :global(.ai-history__folder-item),
  :global(.ai-history__folder-item [data-ui-part="collapsible"]),
  :global(.ai-history__conversation-item) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
  }

  :global(.ai-history__tree) {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
    flex-direction: column;
    gap: var(--ui-workspace-explorer-row-gap, 0.125rem);
  }

  :global(
    [data-ui-component="sidebar"][data-ui-part="sidebar-menu-sub"].ai-history__subtree
  ) {
    box-sizing: border-box;
    width: calc(100% - var(--ui-workspace-explorer-indent, 0.75rem));
    max-width: 100%;
    margin-inline: 0;
    margin-inline-start: var(--ui-workspace-explorer-indent, 0.75rem);
    padding-inline-start: var(--ui-workspace-explorer-guide-gap, 0.25rem);
    padding-inline-end: 0;
    border-inline-start: var(--ui-workspace-explorer-guide-width, 1px) solid
      var(--ui-workspace-explorer-guide-color, var(--border));
    translate: none;
  }

  :global(.ai-history__folder-row),
  .ai-history__conversation-row {
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
    padding: 0.125rem 0.375rem;
    color: inherit;
    background: transparent;
    font: inherit;
    font-size: inherit;
    line-height: 1.25;
    text-align: start;
  }

  :global(.ai-history__folder-row) {
    padding-inline-end: calc(
      var(--ai-history-count-width) + var(--ai-history-count-end-pad)
    );
    cursor: pointer;
  }

  :global(.ai-history__folder-row:hover),
  :global(.ai-history__folder-row:focus-visible),
  .ai-history__conversation-row:hover,
  .ai-history__conversation-row:focus-within {
    background: var(
      --ui-workspace-explorer-row-hover-background,
      var(--sidebar-accent)
    );
    outline: none;
  }

  :global(.ai-history__folder-row[data-active-folder="true"]),
  .ai-history__conversation-row[data-active="true"] {
    background: var(
      --ui-workspace-explorer-row-active-background,
      var(--accent)
    );
    font-weight: var(--ui-workspace-explorer-row-active-weight, 600);
  }

  :global(.ai-history__disclosure),
  :global(.ai-history__folder-icon),
  :global(.ai-history__chat-icon) {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
  }

  :global(.ai-history__disclosure) {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform 120ms ease;
  }

  :global(.ai-history__disclosure[data-open="true"]) {
    transform: rotate(90deg);
  }

  :global(.ai-history__folder-icon),
  :global(.ai-history__chat-icon) {
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
  }

  .ai-history__folder-label,
  .ai-history__conversation-title,
  .ai-history__preview,
  .ai-history__timestamp {
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-history__folder-label {
    flex: 1 1 auto;
  }

  :global(
    [data-ui-component="sidebar"][data-ui-part="sidebar-menu-badge"].ai-history__count
  ) {
    position: absolute;
    top: 50%;
    right: var(--ai-history-count-end-pad);
    z-index: 1;
    display: inline-flex;
    width: var(--ai-history-count-width);
    min-width: var(--ai-history-count-width);
    flex: 0 0 auto;
    align-items: center;
    justify-content: flex-end;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  .ai-history__open {
    display: flex;
    min-width: 0;
    flex: 1 1 auto;
    align-items: center;
    gap: 0.375rem;
    border: 0;
    padding: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  .ai-history__open:focus-visible {
    outline: none;
  }

  .ai-history__conversation-copy {
    display: flex;
    min-width: 0;
    flex: 1 1 auto;
    flex-direction: column;
  }

  .ai-history__conversation-title {
    font-size: 0.75rem;
  }

  .ai-history__preview,
  .ai-history__timestamp {
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    font-size: 0.6875rem;
    font-weight: 400;
  }

  :global(.ai-history__archived) {
    flex: 0 0 auto;
    font-size: 0.625rem;
  }

  :global(.ai-history__conversation-actions) {
    flex: 0 0 auto;
    opacity: 0;
  }

  .ai-history__conversation-row:hover
    :global(.ai-history__conversation-actions),
  .ai-history__conversation-row:focus-within
    :global(.ai-history__conversation-actions) {
    opacity: 1;
  }

  .ai-history__state {
    margin: 0;
    padding: 0.5rem 0.75rem;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    font-size: 0.8125rem;
  }

  :global(.ai-history .suggestion-highlight) {
    border-radius: 0.125rem;
    color: var(--ui-search-highlight-foreground, inherit);
    background: var(
      --ui-search-highlight-background,
      color-mix(in srgb, var(--primary) 22%, transparent)
    );
  }

  @media (pointer: coarse) {
    :global(.ai-history__conversation-actions) {
      opacity: 1;
    }
  }
</style>
