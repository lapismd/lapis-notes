<script lang="ts">
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import {
    fetchVerifiedPluginImage,
    type PluginGalleryItem,
  } from "@lapis-notes/api";

  let { items }: { items: PluginGalleryItem[] } = $props();

  interface VerifiedGalleryItem {
    item: PluginGalleryItem;
    objectUrl: string;
  }

  let verifiedItems = $state<VerifiedGalleryItem[]>([]);
  let selectedIndex = $state(0);
  let selected = $derived(verifiedItems[selectedIndex] ?? null);

  $effect(() => {
    const references = items;
    verifiedItems = [];
    selectedIndex = 0;
    let cancelled = false;
    const ownedUrls: string[] = [];
    void Promise.allSettled(
      references.map(async (item) => ({
        item,
        blob: await fetchVerifiedPluginImage(item),
      })),
    ).then((results) => {
      if (cancelled || typeof URL.createObjectURL !== "function") return;
      const next: VerifiedGalleryItem[] = [];
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const objectUrl = URL.createObjectURL(result.value.blob);
        ownedUrls.push(objectUrl);
        next.push({ item: result.value.item, objectUrl });
      }
      verifiedItems = next;
    });
    return () => {
      cancelled = true;
      for (const objectUrl of ownedUrls) URL.revokeObjectURL(objectUrl);
    };
  });

  function select(index: number): void {
    if (!verifiedItems.length) return;
    selectedIndex = (index + verifiedItems.length) % verifiedItems.length;
  }
</script>

{#if selected}
  <section
    class="lapis-plugin-detail-gallery"
    aria-labelledby="lapis-plugin-detail-gallery-heading"
    data-plugin-gallery
  >
    <header>
      <div>
        <p>Plugin preview</p>
        <h3 id="lapis-plugin-detail-gallery-heading">See it in Lapis</h3>
      </div>
      <span aria-live="polite" data-gallery-position>
        {selectedIndex + 1} / {verifiedItems.length}
      </span>
    </header>
    <figure>
      <img
        src={selected.objectUrl}
        width={selected.item.width}
        height={selected.item.height}
        alt={selected.item.alt}
        data-gallery-image
      />
      <figcaption>{selected.item.caption ?? selected.item.alt}</figcaption>
    </figure>
    <div class="lapis-plugin-detail-gallery__controls">
      <button
        type="button"
        aria-label="Show previous plugin image"
        disabled={verifiedItems.length === 1}
        onclick={() => select(selectedIndex - 1)}
      ><ChevronLeft aria-hidden="true" /></button>
      <div role="group" aria-label="Choose plugin preview">
        {#each verifiedItems as candidate, index (candidate.item.id)}
          <button
            type="button"
            aria-label={`Show image ${index + 1}: ${candidate.item.alt}`}
            aria-pressed={index === selectedIndex}
            onclick={() => select(index)}
          >
            <img
              src={candidate.objectUrl}
              width={candidate.item.width}
              height={candidate.item.height}
              alt=""
            />
            <span>{candidate.item.surface}</span>
          </button>
        {/each}
      </div>
      <button
        type="button"
        aria-label="Show next plugin image"
        disabled={verifiedItems.length === 1}
        onclick={() => select(selectedIndex + 1)}
      ><ChevronRight aria-hidden="true" /></button>
    </div>
  </section>
{/if}
