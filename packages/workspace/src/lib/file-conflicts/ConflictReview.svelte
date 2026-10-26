<script lang="ts">
  import { MergeEditor } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import FileCheckIcon from "@lucide/svelte/icons/file-check";
  import ConflictReviewControls from "./ConflictReviewControls.svelte";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import type {
    ConflictReviewState,
    ConflictSelection,
  } from "./conflict-review-state.svelte";

  let {
    model,
    selection,
  }: { model: ConflictReviewState; selection: ConflictSelection } = $props();
  const conflict = $derived(
    model.entries.find((entry) => entry.path === selection.path),
  );
  let options = $state({
    wrap: false,
    ignoreWhitespace: false,
    ignoreCase: false,
    syncHorizontalScroll: true,
  });
  const disabled = $derived(model.disabled() || model.busy !== null);
</script>

{#if conflict}
  <section
    class="conflict-review"
    aria-label={`File conflict: ${conflict.path}`}
    aria-busy={model.busy === conflict.path}
  >
    <div class="comparison">
      {#key conflict}
        {@const seed = selection.seed(conflict)}
        <MergeEditor
          path={conflict.path}
          left={conflict.local}
          base={seed}
          right={conflict.external ?? ""}
          leftLabel="Your version"
          baseLabel="Merged version"
          rightLabel="Disk version"
          readOnly={disabled || conflict.external === undefined}
          editable
          editableSides={["base"]}
          wrap={options.wrap}
          ignoreWhitespace={options.ignoreWhitespace}
          ignoreCase={options.ignoreCase}
          syncHorizontalScroll={options.syncHorizontalScroll}
          onResolvedChange={({ content }) => {
            selection.result = content;
          }}
        >
          {#snippet headerCenter()}
            <ConflictReviewControls bind:options {disabled} />
          {/snippet}
        </MergeEditor>
      {/key}
    </div>
    <footer>
      <div class="explanation">
        {#if model.error}<p role="alert">{model.error}</p>{/if}
        {#if conflict.external === undefined}
          <p role="status">
            The disk version could not be read: {conflict.readError}
          </p>
        {:else if conflict.external === null}
          <p>The file was deleted from disk.</p>
        {:else}
          <p>
            Edit the centre or accept changes from either side, then save the
            merged version.
          </p>
        {/if}
      </div>
      <div class="actions">
        <Button
          variant="outline"
          disabled={disabled ||
            conflict.external === undefined ||
            selection.result === undefined}
          onclick={() =>
            model.recover(conflict.path, undefined, selection.result)}
        >
          <FileCheckIcon aria-hidden="true" />Save merged version
        </Button>
        <Button
          variant="ghost"
          {disabled}
          onclick={() => model.recover(conflict.path)}
        >
          <RefreshCwIcon aria-hidden="true" />Check disk again
        </Button>
      </div>
    </footer>
  </section>
{/if}

<style>
  .conflict-review {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    color: var(--ui-workspace-view-foreground, var(--foreground));
    background: var(--ui-workspace-view-background, var(--background));
  }
  .comparison {
    --ui-diff-frame-border: 0;
    --ui-diff-frame-radius: 0;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--ui-workspace-border);
    background: var(--ui-workspace-background, var(--background));
  }
  .explanation {
    flex: 1;
    min-width: 12rem;
    font-size: 0.8125rem;
  }
  p {
    margin: 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  [role="alert"] {
    color: var(--destructive);
  }
  :global(.dark) [role="alert"] {
    color: color-mix(in srgb, var(--destructive) 60%, var(--foreground));
  }
</style>
