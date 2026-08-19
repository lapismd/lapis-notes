<script lang="ts">
  import type { AgentResultViewProps } from "@lapis-notes/api";
  import type { App } from "@lapis-notes/api";
  import {
    fileNameFromPath,
    notesSearchHitsFromOutput,
    openNotesSearchHit,
    type NotesSearchHit,
    type NotesSearchSnippet,
  } from "./search-tool-result";
  import "./search-tool-result.css";

  let {
    app,
    output,
  }: AgentResultViewProps<App> = $props();

  const hits = $derived(notesSearchHitsFromOutput(output));

  async function openHit(
    hit: NotesSearchHit,
    snippet?: NotesSearchSnippet,
  ): Promise<void> {
    await openNotesSearchHit(app, hit, snippet);
  }
</script>

<div data-ui-component="search-tool-result">
  {#if hits.length === 0}
    <p data-ui-part="empty">No matching notes.</p>
  {:else}
    {#each hits as hit (hit.path)}
      <div data-ui-part="hit">
        <button
          type="button"
          data-ui-part="file"
          aria-label={`Open ${fileNameFromPath(hit.path)}`}
          onclick={() => void openHit(hit)}
        >
          <span data-ui-part="file-label">{fileNameFromPath(hit.path)}</span>
          <span data-ui-part="file-path">{hit.path}</span>
        </button>
        {#each hit.snippets as snippet, index (`${hit.path}:${snippet.offset}:${index}`)}
          <button
            type="button"
            data-ui-part="snippet"
            onclick={() => void openHit(hit, snippet)}
          >
            <span data-ui-part="snippet-text">{snippet.text}</span>
          </button>
        {/each}
      </div>
    {/each}
  {/if}
</div>
