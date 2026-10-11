<script lang="ts">
  import type { PluginCatalogDetail, RegistryMediaV2 } from "@lapis-notes/api";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import PluginRegistryImage from "./PluginRegistryImage.svelte";
  let { detail }: { detail: PluginCatalogDetail } = $props();
  let variant = $state<"full" | "light" | "dark">("full");
  let opened = $state(false);
  let selected = $state<RegistryMediaV2 | null>(null);
  const items = $derived(
    [
      detail.appearance?.logo,
      detail.media?.banner,
      detail.media?.overview,
      ...(detail.gallery ?? []),
    ].filter((item): item is NonNullable<typeof item> => Boolean(item)),
  );
</script>

{#if items.length}
  <div class="registry-media" aria-label="Plugin media">
    <div role="group" aria-label="Image presentation">
      {#each ["light", "dark", "full"] as choice}
        <Button.Root
          size="sm"
          variant={variant === choice ? "secondary" : "ghost"}
          aria-pressed={variant === choice}
          onclick={() => (variant = choice as typeof variant)}
          >{choice === "full"
            ? "Split"
            : choice === "light"
              ? "Light"
              : "Dark"}</Button.Root
        >
      {/each}
    </div>
    {#each items as item, index (index)}
      <Button.Root
        variant="ghost"
        aria-label={`Open image: ${item.alt}`}
        onclick={() => {
          selected = item;
          opened = true;
        }}><PluginRegistryImage media={item} {variant} /></Button.Root
      >
    {/each}
  </div>
  <Dialog.Root bind:open={opened}>
    <Dialog.Content>
      <Dialog.Header
        ><Dialog.Title>Plugin image</Dialog.Title><Dialog.Description
          >{selected?.alt ?? "Plugin preview"}</Dialog.Description
        ></Dialog.Header
      >
      {#if selected}<PluginRegistryImage media={selected} {variant} />{/if}
    </Dialog.Content>
  </Dialog.Root>
{/if}

<style>
  .registry-media {
    display: grid;
    gap: var(--ui-space-3, 0.75rem);
  }
</style>
