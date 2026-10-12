<script lang="ts">
  import { onMount } from "svelte";
  import type { PluginCatalogDetail, RegistryMediaV2 } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import PluginRegistryImage from "./PluginRegistryImage.svelte";
  import PluginRegistryMediaViewer from "./PluginRegistryMediaViewer.svelte";

  let {
    detail,
    placement = "overview",
  }: {
    detail: PluginCatalogDetail;
    placement?: "gallery" | "overview" | "banner";
  } = $props();
  const items = $derived(
    placement === "gallery"
      ? (detail.gallery ?? [])
      : [detail.media?.[placement]].filter((item): item is RegistryMediaV2 =>
          Boolean(item),
        ),
  );
  let track = $state<HTMLDivElement>();
  let opened = $state(false);
  let selectedIndex = $state(0);
  let inlineIndex = $state(0);
  let atStart = $state(true);
  let atEnd = $state(false);
  let opener = $state<HTMLElement | null>(null);

  onMount(() => {
    if (!track) return;
    const observer = new ResizeObserver(updateTrackState);
    observer.observe(track);
    updateTrackState();
    return () => observer.disconnect();
  });

  function updateTrackState() {
    if (!track) return;
    atStart = track.scrollLeft <= 1;
    atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    const origin = track.getBoundingClientRect().left;
    const children = Array.from(track.children) as HTMLElement[];
    inlineIndex = children.reduce(
      (closest, child, index) =>
        Math.abs(child.getBoundingClientRect().left - origin) <
        Math.abs(children[closest]!.getBoundingClientRect().left - origin)
          ? index
          : closest,
      0,
    );
  }

  function moveTrack(offset: number) {
    if (!track) return;
    const next = Math.min(Math.max(inlineIndex + offset, 0), items.length - 1);
    const target = track.children[next] as HTMLElement | undefined;
    if (!target) return;
    track.scrollTo({
      left:
        track.scrollLeft +
        target.getBoundingClientRect().left -
        track.getBoundingClientRect().left,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
</script>

{#if items.length}
  <section
    class="registry-media"
    data-media-placement={placement}
    aria-label={placement === "gallery"
      ? `${detail.name} screenshots`
      : `${detail.name} ${placement} image`}
  >
    <div class="registry-media__frame">
      <div
        bind:this={track}
        class="registry-media__track"
        class:gallery={placement === "gallery"}
        role="group"
        aria-label={placement === "gallery"
          ? `${detail.name} screenshot carousel`
          : `${detail.name} ${placement}`}
        onscroll={updateTrackState}
      >
        {#each items as item, index (item)}
          <button
            type="button"
            class="registry-media__item"
            data-state={placement !== "gallery" ||
            (index >= inlineIndex && index < inlineIndex + 2)
              ? "active"
              : "preview"}
            aria-label={`Open image: ${item.alt}`}
            onclick={(event) => {
              selectedIndex = index;
              opener = event.currentTarget;
              opened = true;
            }}
          >
            <PluginRegistryImage
              media={item}
              variant={placement === "overview" ? "preview" : "dark"}
            />
          </button>
        {/each}
      </div>
      {#if placement === "gallery" && items.length > 1}
        <Button
          class="registry-media__previous"
          variant="secondary"
          size="icon"
          aria-label="Previous screenshots"
          disabled={atStart}
          onclick={() => moveTrack(-1)}><ChevronLeft /></Button
        >
        <Button
          class="registry-media__next"
          variant="secondary"
          size="icon"
          aria-label="Next screenshots"
          disabled={atEnd}
          onclick={() => moveTrack(1)}><ChevronRight /></Button
        >
      {/if}
    </div>
  </section>
  <PluginRegistryMediaViewer
    {items}
    pluginName={detail.name}
    {opener}
    initialMode={placement === "gallery" || placement === "banner"
      ? "dark"
      : "full"}
    bind:open={opened}
    bind:selectedIndex
  />
{/if}

<style>
  .registry-media,
  .registry-media__frame {
    min-width: 0;
  }
  .registry-media__frame {
    position: relative;
  }
  .registry-media__track {
    min-width: 0;
  }
  .registry-media__track.gallery {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
  }
  .registry-media__track::-webkit-scrollbar {
    display: none;
  }
  .registry-media__item {
    display: block;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius);
    padding: 0;
    color: var(--foreground);
    background: var(--muted);
    cursor: zoom-in;
  }
  .gallery > .registry-media__item {
    flex: 0 0 calc(44% - 0.25rem);
    aspect-ratio: 3 / 2;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }
  .gallery :global(img) {
    height: 100%;
    object-fit: cover;
  }
  .registry-media__item[data-state="preview"] {
    opacity: 0.35;
  }
  .registry-media__item:hover,
  .registry-media__item:focus-visible {
    opacity: 1;
  }
  .registry-media__item:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }
  .registry-media__frame :global(.registry-media__previous),
  .registry-media__frame :global(.registry-media__next) {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    --ui-button-radius: 999px;
  }
  .registry-media__frame :global(.registry-media__previous) {
    left: 0.5rem;
  }
  .registry-media__frame :global(.registry-media__next) {
    right: 0.5rem;
  }
  .registry-media__frame :global(button:disabled) {
    opacity: 0;
    pointer-events: none;
  }
  @media (max-width: 45rem) {
    .gallery > .registry-media__item {
      flex-basis: 100%;
    }
  }
</style>
