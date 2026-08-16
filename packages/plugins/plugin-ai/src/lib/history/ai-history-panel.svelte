<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import ArchiveIcon from "@lucide/svelte/icons/archive";
  import ArchiveRestoreIcon from "@lucide/svelte/icons/archive-restore";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import TrashIcon from "@lucide/svelte/icons/trash-2";
  import { onMount } from "svelte";
  import type { ConversationRepository } from "../conversations/conversation-repository";
  import type { ConversationListEntry } from "../conversations/transcript-store";
  import type { ConversationLocation } from "../conversations/types";
  import { formatChatTimestamp } from "../chat/chat-time";

  let {
    app,
    repository,
    getScope,
    onOpenConversation,
    onNewConversation,
    searchAllConversations,
  }: {
    app: App;
    repository: ConversationRepository;
    getScope: () => string;
    onOpenConversation: (location: ConversationLocation) => void | Promise<void>;
    onNewConversation: (scopeDir: string) => void | Promise<void>;
    searchAllConversations: (query: string) => Promise<ConversationListEntry[]>;
  } = $props();

  let scopeDir = $state("");
  let entries = $state<ConversationListEntry[]>([]);
  let showArchived = $state(false);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let mode = $state<"folder" | "all">("folder");
  let query = $state("");
  let refreshVersion = 0;

  const visibleEntries = $derived(
    entries.filter(
      (entry) => showArchived || entry.metadata?.status !== "archived",
    ),
  );

  async function refresh(): Promise<void> {
    const version = ++refreshVersion;
    const nextScope = getScope();
    scopeDir = nextScope;
    loading = true;
    error = null;
    try {
      const next =
        mode === "all"
          ? await searchAllConversations(query)
          : await repository.list(nextScope);
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

  onMount(() => {
    const refreshFromWorkspace = () => void refresh();
    const activeLeaf = app.workspace.on("active-leaf-change", refreshFromWorkspace);
    const layout = app.workspace.on("layout-change", refreshFromWorkspace);
    const created = app.vault.on("create", refreshFromWorkspace);
    const deleted = app.vault.on("delete", refreshFromWorkspace);
    const modified = app.vault.on("modify", refreshFromWorkspace);
    const renamed = app.vault.on("rename", refreshFromWorkspace);
    void refresh();
    return () => {
      app.workspace.offref(activeLeaf);
      app.workspace.offref(layout);
      app.vault.offref(created);
      app.vault.offref(deleted);
      app.vault.offref(modified);
      app.vault.offref(renamed);
    };
  });
</script>

<div
  class="ai-history"
  data-ui-component="ai-conversation-history"
  data-testid="ai-conversation-history"
>
  <header class="ai-history__header">
    <div class="ai-history__scope">
      <strong>{scopeDir || "Vault root"}</strong>
      <span>Conversations in this folder</span>
    </div>
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label="New chat in this folder"
      onclick={() => void onNewConversation(scopeDir)}
    >
      <PlusIcon aria-hidden="true" />
    </Button>
  </header>
  <div class="ai-history__filters">
    <Button
      size="sm"
      variant={mode === "folder" ? "secondary" : "ghost"}
      aria-pressed={mode === "folder"}
      onclick={() => {
        mode = "folder";
        void refresh();
      }}
    >This folder</Button>
    <Button
      size="sm"
      variant={mode === "all" ? "secondary" : "ghost"}
      aria-pressed={mode === "all"}
      onclick={() => {
        mode = "all";
        void refresh();
      }}
    >All conversations</Button>
    <Button
      size="sm"
      variant="ghost"
      aria-pressed={showArchived}
      onclick={() => (showArchived = !showArchived)}
    >
      {showArchived ? "Hide archived" : "Show archived"}
    </Button>
  </div>
  {#if mode === "all"}
    <div class="ai-history__search">
      <input
        type="search"
        aria-label="Search all conversations"
        placeholder="Search conversations"
        bind:value={query}
        oninput={() => void refresh()}
      />
    </div>
  {/if}
  <ScrollArea class="ai-history__scroll">
    {#if error}
      <p class="ai-history__state" role="alert">{error}</p>
    {:else if loading && entries.length === 0}
      <p class="ai-history__state">Loading conversations…</p>
    {:else if visibleEntries.length === 0}
      <p class="ai-history__state">No conversations in this folder.</p>
    {:else}
      <ul class="ai-history__list">
        {#each visibleEntries as entry (`${entry.location.scopeDir}:${entry.location.conversationId}`)}
          <li class="ai-history__item">
            <button
              class="ai-history__open"
              type="button"
              disabled={Boolean(entry.unavailableReason)}
              onclick={() => void onOpenConversation(entry.location)}
            >
              <span>{entry.metadata?.title ?? "Untitled conversation"}</span>
              <small>
                {entry.unavailableReason ??
                  (entry.metadata
                    ? formatChatTimestamp(entry.metadata.updatedAt)
                    : "Unavailable")}
              </small>
            </button>
            {#if entry.metadata}
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={entry.metadata.status === "archived"
                  ? "Restore conversation"
                  : "Archive conversation"}
                onclick={() =>
                  void setArchived(
                    entry,
                    entry.metadata?.status !== "archived",
                  )}
              >
                {#if entry.metadata.status === "archived"}
                  <ArchiveRestoreIcon aria-hidden="true" />
                {:else}
                  <ArchiveIcon aria-hidden="true" />
                {/if}
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Delete conversation"
                onclick={() => void remove(entry)}
              >
                <TrashIcon aria-hidden="true" />
              </Button>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </ScrollArea>
</div>

<style>
  .ai-history {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    color: var(--ui-workspace-view-foreground, var(--foreground));
    background: var(--ui-workspace-view-background, var(--background));
  }

  .ai-history__header,
  .ai-history__filters,
  .ai-history__search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .ai-history__header {
    justify-content: space-between;
  }

  .ai-history__filters {
    flex-wrap: wrap;
  }

  .ai-history__search input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--input, var(--border));
    border-radius: var(--radius-sm);
    color: inherit;
    background: var(--background);
  }

  .ai-history__scope {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  .ai-history__scope strong,
  .ai-history__scope span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-history__scope span,
  .ai-history__open small {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  :global(.ai-history__scroll) {
    min-height: 0;
    flex: 1 1 auto;
  }

  .ai-history__list {
    display: flex;
    margin: 0;
    padding: 0.375rem;
    list-style: none;
    flex-direction: column;
    gap: 0.125rem;
  }

  .ai-history__item {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    border-radius: var(--radius-sm);
  }

  .ai-history__item:hover {
    background: var(--accent);
  }

  .ai-history__open {
    display: flex;
    min-width: 0;
    flex: 1 1 auto;
    padding: 0.5rem;
    border: 0;
    color: inherit;
    background: transparent;
    text-align: start;
    cursor: pointer;
    flex-direction: column;
  }

  .ai-history__open span,
  .ai-history__open small {
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-history__open:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }

  .ai-history__open:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .ai-history__state {
    margin: 0;
    padding: 1rem;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
</style>
