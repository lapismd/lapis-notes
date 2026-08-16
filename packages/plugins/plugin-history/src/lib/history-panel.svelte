<script lang="ts">
  import "./history-panel.css";
  import { Menu, type App } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import ArchiveRestore from "@lucide/svelte/icons/archive-restore";
  import GitCommitVertical from "@lucide/svelte/icons/git-commit-vertical";
  import GitCompare from "@lucide/svelte/icons/git-compare";
  import GitCompareArrows from "@lucide/svelte/icons/git-compare-arrows";
  import { onMount, untrack } from "svelte";
  import {
    formatHistoryEvent,
    formatHistoryTimestamp,
  } from "./history-format";
  import type {
    HistoryCompareAnchor,
    HistoryCompareViewState,
    HistoryRevision,
    HistoryViewModel,
  } from "./history-plugin";
  import { HistoryCompareViewType } from "./history-view-type";

  type HistoryPanelPlugin = {
    getHistoryViewModel(): Promise<HistoryViewModel>;
    getCompareAnchor(): HistoryCompareAnchor | null;
    toggleCompareAnchor(filePath: string, revisionId: string): void;
    openHistoryCompareView(state: HistoryCompareViewState): Promise<void>;
    restoreRevision(filePath: string, revision: HistoryRevision): Promise<void>;
    onHistoryChanged(listener: () => void): () => void;
  };

  let { app }: { app: App } = $props();

  const plugin = untrack(() => {
    const registered = app.plugins.plugins.get("history") as
      | HistoryPanelPlugin
      | undefined;
    if (!registered) throw new Error("History plugin is not registered");
    return registered;
  });

  let model = $state<HistoryViewModel>({
    filePath: null,
    history: null,
    currentContent: "",
    fileExists: false,
  });
  let anchor = $state<HistoryCompareAnchor | null>(null);
  let openRevisionId = $state<string | null>(null);
  let openCompareMode = $state<HistoryCompareViewState["compareMode"] | null>(
    null,
  );
  let selectedRevisionId = $state<string | null>(null);

  const selectedRevision = $derived(
    model.history?.revisions.find(
      (revision) => revision.revisionId === selectedRevisionId,
    ) ?? null,
  );
  const previousRevision = $derived.by(() => {
    if (!selectedRevision || !model.history) return undefined;
    const index = model.history.revisions.findIndex(
      (entry) => entry.revisionId === selectedRevision.revisionId,
    );
    return index >= 0 ? model.history.revisions[index + 1] : undefined;
  });

  async function refresh(): Promise<void> {
    model = await plugin.getHistoryViewModel();
    anchor = plugin.getCompareAnchor();
    const leaf = app.workspace.getLeavesOfType(HistoryCompareViewType)[0];
    const state = leaf?.view.getState() ?? {};
    openRevisionId =
      typeof state["revisionId"] === "string" ? state["revisionId"] : null;
    const mode = state["compareMode"];
    openCompareMode =
      mode === "current" || mode === "previous" || mode === "selected"
        ? mode
        : null;
    const revisionIds = new Set(
      model.history?.revisions.map((revision) => revision.revisionId) ?? [],
    );
    if (openRevisionId && revisionIds.has(openRevisionId)) {
      selectedRevisionId = openRevisionId;
    } else if (!selectedRevisionId || !revisionIds.has(selectedRevisionId)) {
      selectedRevisionId = model.history?.revisions[0]?.revisionId ?? null;
    }
  }

  function openCompare(
    revision: HistoryRevision,
    compareMode: "current" | "previous" | "selected",
    otherRevisionId?: string,
  ): void {
    if (!model.filePath) return;
    selectedRevisionId = revision.revisionId;
    void plugin.openHistoryCompareView({
      filePath: model.filePath,
      revisionId: revision.revisionId,
      compareMode,
      otherRevisionId,
      sourceLeafId: app.workspace.activeLeaf?.id,
    });
  }

  function showRevisionMenu(event: MouseEvent, revision: HistoryRevision): void {
    event.preventDefault();
    const previous = model.history?.revisions[
      model.history.revisions.findIndex(
        (entry) => entry.revisionId === revision.revisionId,
      ) + 1
    ];
    const canCompareSelected = Boolean(
      anchor &&
        anchor.filePath === model.filePath &&
        anchor.revisionId !== revision.revisionId,
    );
    new Menu()
      .addItem((item) =>
        item.setTitle("Compare with current").onClick(() => {
          openCompare(revision, "current");
        }),
      )
      .addItem((item) =>
        item
          .setTitle("Compare with previous")
          .setDisabled(!previous)
          .onClick(() => {
            if (previous) openCompare(revision, "previous");
          }),
      )
      .addSeparator()
      .addItem((item) =>
        item.setTitle("Select for compare").onClick(() => {
          if (!model.filePath) return;
          plugin.toggleCompareAnchor(model.filePath, revision.revisionId);
        }),
      )
      .addItem((item) =>
        item
          .setTitle("Compare with selected")
          .setDisabled(!canCompareSelected)
          .onClick(() => {
            if (!anchor) return;
            openCompare(revision, "selected", anchor.revisionId);
          }),
      )
      .addSeparator()
      .addItem((item) =>
        item.setTitle("Restore this revision").onClick(() => {
          if (!model.filePath) return;
          void plugin.restoreRevision(model.filePath, revision);
        }),
      )
      .showAtMouseEvent(event);
  }

  onMount(() => {
    const unsubscribe = plugin.onHistoryChanged(() => void refresh());
    const leafChange = app.workspace.on("active-leaf-change", () => {
      void refresh();
    });
    const layoutChange = app.workspace.on("layout-change", () => {
      void refresh();
    });
    void refresh();
    return () => {
      unsubscribe();
      app.workspace.offref(leafChange);
      app.workspace.offref(layoutChange);
    };
  });
</script>

<div
  class="history-panel"
  data-ui-component="history-panel"
  data-testid="history-panel"
>
  <div class="history-panel__chrome" data-ui-part="chrome">
    <Tooltip.Provider delayDuration={0}>
      <div class="history-panel__toolbar" data-ui-part="toolbar">
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                class="history-panel__toolbar-action"
                aria-label="Compare with current"
                aria-pressed={openCompareMode === "current"}
                disabled={!selectedRevision}
                onclick={() => {
                  if (selectedRevision) openCompare(selectedRevision, "current");
                }}
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
                class="history-panel__toolbar-action"
                aria-label="Compare with previous"
                aria-pressed={openCompareMode === "previous"}
                disabled={!previousRevision}
                onclick={() => {
                  if (selectedRevision && previousRevision) {
                    openCompare(selectedRevision, "previous");
                  }
                }}
              >
                <GitCompareArrows aria-hidden="true" />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">Compare with previous</Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                class="history-panel__toolbar-action"
                aria-label="Restore this revision"
                disabled={!selectedRevision || !model.filePath}
                onclick={() => {
                  if (!model.filePath || !selectedRevision) return;
                  void plugin.restoreRevision(model.filePath, selectedRevision);
                }}
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
  {#if !model.filePath}
    <p class="history-panel__empty">Open a file to see its history.</p>
  {:else if !model.history?.revisions.length}
    <p class="history-panel__empty">No revisions stored for this file yet.</p>
  {:else}
    <ScrollArea class="history-panel__scroll">
      <ol class="history-panel__timeline" aria-label="File history">
        {#each model.history.revisions as revision (revision.revisionId)}
          <li>
            <button
              type="button"
              class="history-panel__row"
              data-revision-id={revision.revisionId}
              data-compare-anchor={anchor?.revisionId === revision.revisionId
                ? "true"
                : undefined}
              aria-current={selectedRevisionId === revision.revisionId
                ? "true"
                : undefined}
              aria-label={`${formatHistoryEvent(revision.eventType)} ${formatHistoryTimestamp(revision.createdAt)}`}
              onclick={() => openCompare(revision, "current")}
              oncontextmenu={(event) => showRevisionMenu(event, revision)}
            >
              <GitCommitVertical
                class="history-panel__marker"
                aria-hidden="true"
              />
              <span class="history-panel__meta">
                <span class="history-panel__event"
                  >{formatHistoryEvent(revision.eventType)}</span
                >
                <time
                  class="history-panel__time"
                  datetime={new Date(revision.createdAt).toISOString()}
                  >{formatHistoryTimestamp(revision.createdAt)}</time
                >
              </span>
              {#if anchor?.revisionId === revision.revisionId}
                <GitCompare
                  class="history-panel__pin"
                  data-testid="history-compare-anchor"
                  aria-hidden="true"
                />
              {/if}
            </button>
          </li>
        {/each}
      </ol>
    </ScrollArea>
  {/if}
</div>
