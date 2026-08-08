<script lang="ts">
  import type { TFile } from "@lapis-notes/api";

  let {
    file = null,
  }: {
    file?: TFile | null;
  } = $props();
</script>

<div class="media" data-ui-component="media-view" data-testid="media-view">
  {#if file}
    <p class="media__path">{file.path}</p>
    <img src={file.path} alt={file.baseName} />
  {:else}
    <p class="media__empty">No media file selected.</p>
  {/if}
</div>

<style>
  .media {
    display: grid;
    place-content: start center;
    gap: 0.75rem;
    padding: 1rem;
    height: 100%;
  }
  .media img {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
  }
  .media__path,
  .media__empty {
    margin: 0;
    opacity: 0.8;
  }
</style>
