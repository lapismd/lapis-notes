<script lang="ts">
  import { onMount } from "svelte";

  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";

  import type { RegistryGalleryItem } from "./model-adapter";
  import RegistryMediaViewer from "./RegistryMediaViewer.svelte";
  import RegistryVerifiedImage from "./RegistryVerifiedImage.svelte";

  let {
    items,
    pluginName,
  }: {
    items: readonly RegistryGalleryItem[];
    pluginName: string;
  } = $props();

  let track = $state<HTMLDivElement>();
  let viewerOpen = $state(false);
  let selectedIndex = $state(0);
  let inlineIndex = $state(0);
  let atStart = $state(true);
  let atEnd = $state(false);
  let opener = $state<HTMLElement | null>(null);

  onMount(() => {
    const observer = new ResizeObserver(updateTrackState);
    if (!track) return;
    observer.observe(track);
    updateTrackState();
    return () => observer.disconnect();
  });

  function show(index: number, target: HTMLElement): void {
    selectedIndex = index;
    opener = target;
    viewerOpen = true;
  }

  function moveTrack(offset: -1 | 1): void {
    if (!track) return;
    const nextIndex = Math.min(
      Math.max(inlineIndex + offset, 0),
      items.length - 1,
    );
    const target = track.children[nextIndex] as HTMLElement | undefined;
    target?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  function updateTrackState(): void {
    const currentTrack = track;
    if (!currentTrack) return;
    const maximum = Math.max(
      0,
      currentTrack.scrollWidth - currentTrack.clientWidth,
    );
    atStart = currentTrack.scrollLeft <= 1;
    atEnd = currentTrack.scrollLeft >= maximum - 1;
    const children = [...currentTrack.children] as HTMLElement[];
    inlineIndex = children.reduce(
      (closest, child, index) =>
        Math.abs(child.offsetLeft - currentTrack.scrollLeft) <
        Math.abs(children[closest]!.offsetLeft - currentTrack.scrollLeft)
          ? index
          : closest,
      0,
    );
  }
</script>

{#if items.length > 0}
  <section
    class="registry-media-gallery"
    aria-labelledby="registry-media-gallery-title"
  >
    <h2
      id="registry-media-gallery-title"
      class="registry-media-gallery__sr-only"
    >
      {pluginName} screenshots
    </h2>
    <div
      class="registry-media-gallery__frame"
      data-ui-part="registry-media-gallery-frame"
    >
      <div
        bind:this={track}
        class="registry-media-gallery__track"
        class:short={items.length < 3}
        aria-label={`${pluginName} screenshot carousel`}
        onscroll={updateTrackState}
      >
        {#each items as item, index (item.id)}
          <button
            type="button"
            class:active={index >= inlineIndex && index < inlineIndex + 2}
            data-ui-part="registry-media-gallery-item"
            data-state={index >= inlineIndex && index < inlineIndex + 2
              ? "active"
              : "preview"}
            aria-label={`Open screenshot ${index + 1} of ${items.length}: ${item.alt}`}
            onclick={(event) => show(index, event.currentTarget)}
          >
            <RegistryVerifiedImage
              reference={item.images.dark}
              width={item.images.dark.width}
              height={item.images.dark.height}
              alt=""
              loading="lazy"
            />
          </button>
        {/each}
      </div>
      {#if items.length > 1}
        <button
          class="registry-media-gallery__previous"
          type="button"
          aria-label="Previous screenshots"
          disabled={atStart}
          onclick={() => moveTrack(-1)}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </button>
        <button
          class="registry-media-gallery__next"
          type="button"
          aria-label="Next screenshots"
          disabled={atEnd}
          onclick={() => moveTrack(1)}
        >
          <ChevronRightIcon aria-hidden="true" />
        </button>
      {/if}
    </div>
  </section>

  <RegistryMediaViewer
    {items}
    {pluginName}
    {opener}
    initialMode="dark"
    bind:open={viewerOpen}
    bind:selectedIndex
  />
{/if}

<style>
  .registry-media-gallery {
    min-width: 0;
  }
  .registry-media-gallery__frame {
    position: relative;
  }
  .registry-media-gallery__track {
    display: flex;
    gap: 0.5rem;
    padding-inline-end: 12%;
    overflow-x: auto;
    scrollbar-width: none;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
  }
  .registry-media-gallery__track.short {
    padding-inline-end: 0;
  }
  .registry-media-gallery__track::-webkit-scrollbar {
    display: none;
  }
  .registry-media-gallery__track > button {
    position: relative;
    flex: 0 0 calc(44% - 0.25rem);
    overflow: hidden;
    border: 0;
    border-radius: 0.65rem;
    padding: 0;
    background: #09090b;
    cursor: zoom-in;
    opacity: 0.28;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    transition: opacity 200ms ease;
  }
  .registry-media-gallery__track.short > button {
    flex-basis: calc(50% - 0.25rem);
  }
  .registry-media-gallery__track > button.active,
  .registry-media-gallery__track > button:hover,
  .registry-media-gallery__track > button:focus-visible {
    opacity: 1;
  }
  .registry-media-gallery__track > button:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }
  .registry-media-gallery__track :global(img) {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 2;
    object-fit: cover;
  }
  .registry-media-gallery__frame > button {
    position: absolute;
    z-index: 2;
    top: 50%;
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    transform: translateY(-50%);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0;
    color: var(--foreground);
    background: color-mix(in srgb, var(--background) 88%, transparent);
    box-shadow: 0 0.2rem 1rem rgb(0 0 0 / 18%);
    cursor: pointer;
    backdrop-filter: blur(8px);
  }
  .registry-media-gallery__frame > button:disabled {
    opacity: 0;
    pointer-events: none;
  }
  .registry-media-gallery__frame > button :global(svg) {
    width: 1rem;
    height: 1rem;
  }
  .registry-media-gallery__previous {
    left: 0.6rem;
  }
  .registry-media-gallery__next {
    right: 0.6rem;
  }
  .registry-media-gallery__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 45rem) {
    .registry-media-gallery__track {
      padding-inline-end: 0;
    }
    .registry-media-gallery__track > button {
      flex-basis: 100%;
    }
    .registry-media-gallery__frame > button {
      display: none;
    }
  }
  @container plugin-browser (max-width: 45rem) {
    .registry-media-gallery__track {
      padding-inline-end: 0;
    }
    .registry-media-gallery__track > button {
      flex-basis: 100%;
    }
    .registry-media-gallery__frame > button {
      display: none;
    }
  }
  @media (hover: none), (pointer: coarse) {
    .registry-media-gallery__frame > button {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .registry-media-gallery__track {
      scroll-behavior: auto;
    }
  }
</style>
