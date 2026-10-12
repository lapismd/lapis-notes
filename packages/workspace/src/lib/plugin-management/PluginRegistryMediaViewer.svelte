<script lang="ts">
  import { tick } from "svelte";
  import type { RegistryMediaV2 } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as ToggleGroup from "@lapismd/design-core/shadcn/toggle-group";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import X from "@lucide/svelte/icons/x";
  import PluginRegistryImage from "./PluginRegistryImage.svelte";

  type Mode = "full" | "light" | "dark";
  let {
    items,
    pluginName,
    open = $bindable(false),
    selectedIndex = $bindable(0),
    initialMode = "full",
    opener = null,
  }: {
    items: readonly RegistryMediaV2[];
    pluginName: string;
    open?: boolean;
    selectedIndex?: number;
    initialMode?: Mode;
    opener?: HTMLElement | null;
  } = $props();
  let mode = $state<Mode>("full");
  let imageFrame = $state<HTMLDivElement>();
  let wasOpen = false;
  const lastIndex = $derived(Math.max(0, items.length - 1));
  $effect(() => {
    if (open && !wasOpen) mode = initialMode;
    if (!open && wasOpen) {
      const target = opener;
      void tick().then(() => target?.isConnected && target.focus());
    }
    wasOpen = open;
  });
  function move(index: number) {
    selectedIndex = Math.min(Math.max(index, 0), lastIndex);
    imageFrame?.focus();
  }
  function onkeydown(event: KeyboardEvent) {
    if (
      (event.target as HTMLElement).closest(
        '[data-ui-component="toggle-group"]',
      )
    )
      return;
    const next = {
      ArrowLeft: selectedIndex - 1,
      ArrowRight: selectedIndex + 1,
      Home: 0,
      End: lastIndex,
    }[event.key];
    if (next !== undefined) {
      event.preventDefault();
      move(next);
    }
  }
</script>

<Dialog.Root bind:open>
  {#if open}
    <Dialog.Content
      class="registry-media-viewer"
      showCloseButton={false}
      {onkeydown}
      style="--ui-dialog-width: min(72rem, calc(100vw - 2rem)); --ui-dialog-max-width: 72rem; width: min(72rem, calc(100vw - 2rem)); max-width: 72rem; max-height: calc(100dvh - 2rem);"
    >
      <Dialog.Title class="sr-only">{pluginName} media viewer</Dialog.Title>
      <div class="registry-media-viewer__toolbar">
        <ToggleGroup.Root
          type="single"
          variant="outline"
          size="sm"
          value={mode}
          onValueChange={(value) => {
            if (value) mode = value as Mode;
          }}
          aria-label="Image theme"
        >
          <ToggleGroup.Item value="light">Light</ToggleGroup.Item>
          <ToggleGroup.Item value="dark">Dark</ToggleGroup.Item>
          <ToggleGroup.Item value="full">Split</ToggleGroup.Item>
        </ToggleGroup.Root>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close media viewer"
          onclick={() => (open = false)}><X /></Button
        >
      </div>
      <div
        class="registry-media-viewer__image"
        bind:this={imageFrame}
        role="listbox"
        aria-label={`${pluginName} media`}
        tabindex="0"
      >
        {#if items[selectedIndex]}
          <div role="option" aria-selected="true">
            <PluginRegistryImage
              media={items[selectedIndex]!}
              variant={mode}
              presentation="viewer"
            />
          </div>
        {/if}
      </div>
      <div class="registry-media-viewer__footer">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous image"
          disabled={selectedIndex === 0}
          onclick={() => move(selectedIndex - 1)}><ChevronLeft /></Button
        >
        <p aria-live="polite">
          {selectedIndex + 1} of {items.length}: {items[selectedIndex]?.alt}
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next image"
          disabled={selectedIndex === lastIndex}
          onclick={() => move(selectedIndex + 1)}><ChevronRight /></Button
        >
      </div>
    </Dialog.Content>
  {/if}
</Dialog.Root>

<style>
  .registry-media-viewer__toolbar,
  .registry-media-viewer__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .registry-media-viewer__image {
    min-width: 0;
    min-height: 0;
    display: grid;
    place-items: center;
  }
  .registry-media-viewer__footer p {
    margin: 0;
    text-align: center;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
  }
</style>
