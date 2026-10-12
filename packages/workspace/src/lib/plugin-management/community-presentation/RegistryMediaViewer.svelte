<script lang="ts">
  import { tick } from "svelte";

  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as ButtonGroup from "@lapismd/design-core/shadcn/button-group";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";

  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import XIcon from "@lucide/svelte/icons/x";

  import type { RegistryMediaItem } from "./model-adapter";
  import RegistryVerifiedImage from "./RegistryVerifiedImage.svelte";
  import "./RegistryMediaViewer.css";

  type MediaMode = "preview" | "full" | "light" | "dark";
  type SelectableMediaMode = Exclude<MediaMode, "preview">;

  let {
    items,
    pluginName,
    open = $bindable(false),
    selectedIndex = $bindable(0),
    initialMode = "full",
    opener = null,
  }: {
    items: readonly RegistryMediaItem[];
    pluginName: string;
    open?: boolean;
    selectedIndex?: number;
    initialMode?: MediaMode;
    opener?: HTMLElement | null;
  } = $props();

  let dialog = $state<HTMLElement | null>(null);
  let track = $state<HTMLDivElement>();
  let mode = $state<MediaMode>("full");
  let wasOpen = false;
  let scrollTarget: number | null = null;
  const lastIndex = $derived(Math.max(0, items.length - 1));
  const mediaModes = [
    ["full", "Split"],
    ["light", "Light"],
    ["dark", "Dark"],
  ] as const;

  $effect(() => {
    if (open && !wasOpen) {
      selectedIndex = Math.min(Math.max(selectedIndex, 0), lastIndex);
      mode = initialMode;
      scrollTarget = selectedIndex;
      void tick().then(() => {
        scrollToSelected("auto");
      });
    } else if (!open && wasOpen) {
      const returnTarget = opener;
      requestAnimationFrame(() => returnTarget?.focus());
    }
    wasOpen = open;
  });

  function imageFor(item: RegistryMediaItem) {
    return item.images[mode];
  }

  function setMode(nextMode: MediaMode): void {
    mode = nextMode;
  }

  function moveTo(index: number): void {
    selectedIndex = Math.min(Math.max(index, 0), lastIndex);
    scrollToSelected("smooth");
  }

  function scrollToSelected(behavior: ScrollBehavior): void {
    scrollTarget = selectedIndex;
    track?.scrollTo({
      left: selectedIndex * (track?.clientWidth ?? 0),
      behavior,
    });
  }

  function updateSelectedFromScroll(): void {
    if (!track?.clientWidth) return;
    if (scrollTarget !== null) {
      if (Math.abs(track.scrollLeft - scrollTarget * track.clientWidth) > 1)
        return;
      scrollTarget = null;
    }
    selectedIndex = Math.min(
      Math.max(Math.round(track.scrollLeft / track.clientWidth), 0),
      lastIndex,
    );
  }

  function handleKeydown(event: KeyboardEvent): void {
    const modeButton = (event.target as HTMLElement).closest(
      "button[data-media-mode]",
    );
    if (
      modeButton &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      const modes: SelectableMediaMode[] = ["full", "light", "dark"];
      const offset = event.key === "ArrowLeft" ? -1 : 1;
      const focusedMode = modeButton.getAttribute(
        "data-media-mode",
      ) as SelectableMediaMode;
      const next =
        (modes.indexOf(focusedMode) + offset + modes.length) % modes.length;
      setMode(modes[next]!);
      const buttons =
        dialog?.querySelectorAll<HTMLButtonElement>("[data-media-mode]");
      buttons?.[next]?.focus();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTo(selectedIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTo(selectedIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveTo(lastIndex);
    }
  }
</script>

<Dialog.Root bind:open>
  {#if open}
    <Dialog.Content
      bind:ref={dialog}
      class="community-registry-media-viewer"
      showCloseButton={false}
      data-media-mode={mode}
      onkeydown={handleKeydown}
    >
      <Dialog.Title class="sr-only">
        {pluginName} media viewer
      </Dialog.Title>
      <ButtonGroup.Root
        role="radiogroup"
        class="community-registry-media-viewer__modes"
        aria-label="Image theme"
      >
        {#each mediaModes as [value, label]}
          <Button
            type="button"
            variant={mode === value ? "secondary" : "ghost"}
            size="sm"
            role="radio"
            aria-checked={mode === value}
            data-media-mode={value}
            onclick={() => setMode(value)}
          >
            {label}
          </Button>
        {/each}
      </ButtonGroup.Root>
      <Button
        class="community-registry-media-viewer__close"
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Close media viewer"
        onclick={() => {
          open = false;
        }}
      >
        <XIcon aria-hidden="true" />
      </Button>

      <div
        bind:this={track}
        class="community-registry-media-viewer__track"
        role="listbox"
        aria-label={`${pluginName} media`}
        tabindex="0"
        onscroll={updateSelectedFromScroll}
        onwheel={() => (scrollTarget = null)}
        onpointerdown={() => (scrollTarget = null)}
        onkeydown={(event) => {
          event.stopPropagation();
          handleKeydown(event);
        }}
      >
        {#each items as item, index}
          {@const image = imageFor(item)}
          <div
            class="community-registry-media-viewer__slide"
            role="option"
            aria-selected={index === selectedIndex}
          >
            <RegistryVerifiedImage
              reference={image}
              alt={item.alt}
              width={image.width}
              height={image.height}
              loading={index === selectedIndex ? "eager" : "lazy"}
            />
          </div>
        {/each}
      </div>

      {#if items.length > 1}
        <Button
          class="community-registry-media-viewer__previous"
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous image"
          disabled={selectedIndex === 0}
          onclick={() => moveTo(selectedIndex - 1)}
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <Button
          class="community-registry-media-viewer__next"
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next image"
          disabled={selectedIndex === lastIndex}
          onclick={() => moveTo(selectedIndex + 1)}
        >
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      {/if}

      <p class="community-registry-media-viewer__status" aria-live="polite">
        {selectedIndex + 1} of {items.length}: {items[selectedIndex]?.alt}
      </p>
    </Dialog.Content>
  {/if}
</Dialog.Root>
