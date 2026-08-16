<script lang="ts">
  import "./history-compare-panel.css";
  import { type App } from "@lapis-notes/api";
  import {
    FileChangeStats,
    FileDiff,
    MergeEditor,
    buildUnifiedDiffRows,
    isBinaryFilePath,
    type FileDiffViewMode,
    type MergeResolvedChange,
  } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import ArchiveRestore from "@lucide/svelte/icons/archive-restore";
  import Check from "@lucide/svelte/icons/check";
  import Columns2 from "@lucide/svelte/icons/columns-2";
  import GitCompare from "@lucide/svelte/icons/git-compare";
  import GitCompareArrows from "@lucide/svelte/icons/git-compare-arrows";
  import Rows2 from "@lucide/svelte/icons/rows-2";
  import WrapText from "@lucide/svelte/icons/wrap-text";
  import { onMount, untrack } from "svelte";
  import type {
    HistoryCompareViewState,
    HistoryComparisonModel,
    HistoryRevision,
  } from "./history-plugin";

  type HistoryComparePanelPlugin = {
    getHistoryComparisonModel(
      state: HistoryCompareViewState,
    ): Promise<HistoryComparisonModel>;
    getCompareAnchor(): { revisionId: string } | null;
    openHistoryCompareView(state: HistoryCompareViewState): Promise<void>;
    closeHistoryCompareView(sourceLeafId?: string): void;
    saveCurrentFileContent(filePath: string, content: string): Promise<void>;
    restoreRevision(filePath: string, revision: HistoryRevision): Promise<void>;
    onHistoryChanged(listener: () => void): () => void;
  };

  let {
    app,
    compareState,
  }: {
    app: App;
    compareState: HistoryCompareViewState;
  } = $props();

  const plugin = untrack(() => {
    const registered = app.plugins.plugins.get("history") as
      | HistoryComparePanelPlugin
      | undefined;
    if (!registered) throw new Error("History plugin is not registered");
    return registered;
  });

  let model = $state<HistoryComparisonModel | null>(null);
  let error = $state<string | null>(null);
  let viewMode = $state<FileDiffViewMode>("unified");
  let wrap = $state(false);
  let pendingContent = $state<string | null>(null);

  const viewModeLabel = $derived(
    viewMode === "split" ? "Split diff" : "Unified diff",
  );
  const binary = $derived(isBinaryFilePath(compareState.filePath));
  const stats = $derived.by(() => {
    if (!model) return { additions: 0, deletions: 0 };
    const rows = buildUnifiedDiffRows(
      model.compareBaseText,
      model.compareNewText,
    );
    return {
      additions: rows.filter((row) => row.variant === "added").length,
      deletions: rows.filter((row) => row.variant === "removed").length,
    };
  });

  async function refresh(): Promise<void> {
    try {
      model = await plugin.getHistoryComparisonModel(compareState);
      error = null;
      pendingContent = null;
    } catch (cause) {
      model = null;
      error = cause instanceof Error ? cause.message : String(cause);
    }
  }

  function close(): void {
    plugin.closeHistoryCompareView(compareState.sourceLeafId);
  }

  function openMode(compareMode: HistoryCompareViewState["compareMode"]): void {
    if (!model) return;
    void plugin.openHistoryCompareView({
      ...compareState,
      revisionId: model.selectedRevision.revisionId,
      compareMode,
      otherRevisionId:
        compareMode === "selected"
          ? (plugin.getCompareAnchor()?.revisionId ??
            compareState.otherRevisionId)
          : undefined,
    });
  }

  async function applyMerged(): Promise<void> {
    if (!model || pendingContent == null) return;
    await plugin.saveCurrentFileContent(model.filePath, pendingContent);
    pendingContent = null;
    await refresh();
  }

  async function restoreSelected(): Promise<void> {
    if (!model) return;
    await plugin.restoreRevision(model.filePath, model.selectedRevision);
    await refresh();
  }

  function onResolvedChange(next: MergeResolvedChange): void {
    pendingContent = next.content;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    close();
  }

  onMount(() => {
    const unsubscribe = plugin.onHistoryChanged(() => void refresh());
    document.addEventListener("keydown", onKeydown);
    void refresh();
    return () => {
      unsubscribe();
      document.removeEventListener("keydown", onKeydown);
    };
  });
</script>

<div
  class="history-compare"
  data-ui-component="history-compare-panel"
  data-testid="history-compare-panel"
  data-compare-mode={model?.compareMode ?? compareState.compareMode}
  data-wrap={wrap ? "true" : "false"}
  aria-label="File history comparison"
>
  <div class="history-compare__chrome" data-ui-part="chrome">
    {#if model}
      <div class="history-compare__revision">
        <span>{model.beforeLabel} → {model.afterLabel}</span>
        <FileChangeStats
          additions={stats.additions}
          deletions={stats.deletions}
          showZero
        />
      </div>
    {/if}
    <Tooltip.Provider delayDuration={0}>
      <div class="history-compare__toolbar" data-ui-part="toolbar">
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                class="history-compare__toolbar-action"
                aria-label="Compare with current"
                aria-pressed={model?.compareMode === "current"}
                onclick={() => openMode("current")}
              >
                <GitCompare aria-hidden="true" />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">Compare with current</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                class="history-compare__toolbar-action"
                aria-label="Compare with previous"
                aria-pressed={model?.compareMode === "previous"}
                disabled={!model?.previousRevision}
                onclick={() => openMode("previous")}
              >
                <GitCompareArrows aria-hidden="true" />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">Compare with previous</Tooltip.Content>
        </Tooltip.Root>
        {#if model?.compareMode !== "current"}
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="ghost"
                  size="icon-sm"
                  class="history-compare__toolbar-action"
                  data-testid="history-compare-view-mode"
                  data-view-mode={viewMode}
                  aria-label={viewModeLabel}
                  onclick={() =>
                    (viewMode = viewMode === "split" ? "unified" : "split")}
                >
                  {#if viewMode === "split"}
                    <Columns2 aria-hidden="true" />
                  {:else}
                    <Rows2 aria-hidden="true" />
                  {/if}
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">{viewModeLabel}</Tooltip.Content>
          </Tooltip.Root>
        {/if}
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                class="history-compare__toolbar-action"
                data-testid="history-compare-wrap"
                aria-label="Wrap text"
                aria-pressed={wrap ? "true" : "false"}
                onclick={() => (wrap = !wrap)}
              >
                <WrapText aria-hidden="true" />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">Wrap text</Tooltip.Content>
        </Tooltip.Root>
        {#if model?.compareMode === "current"}
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="ghost"
                  size="icon-sm"
                  class="history-compare__toolbar-action"
                  aria-label="Apply"
                  disabled={pendingContent == null}
                  onclick={() => void applyMerged()}
                >
                  <Check aria-hidden="true" />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">Apply</Tooltip.Content>
          </Tooltip.Root>
        {/if}
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                class="history-compare__toolbar-action"
                aria-label="Restore this revision"
                onclick={() => void restoreSelected()}
              >
                <ArchiveRestore aria-hidden="true" />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">Restore this revision</Tooltip.Content>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  </div>
  <div class="history-compare__body">
    {#if error}
      <p class="history-compare__empty">{error}</p>
    {:else if !model}
      <p class="history-compare__empty">Loading comparison…</p>
    {:else if binary}
      <p class="history-compare__binary">Binary file not shown.</p>
    {:else if model.compareMode === "current"}
      <MergeEditor
        mode="one-way"
        left={model.selectedRevision.content}
        right={model.currentContent}
        leftLabel="Selected revision"
        rightLabel={model.fileExists ? "Current file" : "Latest"}
        path={model.filePath}
        syncHorizontalScroll
        {wrap}
        onResolvedChange={onResolvedChange}
      />
    {:else}
      <FileDiff
        path={model.filePath}
        oldText={model.compareBaseText}
        newText={model.compareNewText}
        {viewMode}
        {wrap}
      />
    {/if}
  </div>
</div>
