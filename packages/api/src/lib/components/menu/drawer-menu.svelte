<script lang="ts">
  import * as Drawer from "@lapis-notes/ui/drawer";
  import Icon from "$lib/components/icon/icon.svelte";
  import {
    isMenuItem,
    type Menu as AppMenu,
    type MenuItem,
  } from "../../menu.svelte";

  let {
    menu,
  }: {
    menu: AppMenu;
  } = $props();

  const title = $derived(menu.title || "Menu");
</script>

<Drawer.Root bind:open={() => menu.open, (value) => menu.setOpen(value)}>
  <Drawer.Content
    class="max-h-[85svh] gap-0 p-0"
    data-mobile-menu-drawer
    aria-label={title}
  >
    <Drawer.Header class="sr-only">
      <Drawer.Title>{title}</Drawer.Title>
      <Drawer.Description>Choose a menu action.</Drawer.Description>
    </Drawer.Header>
    <div
      class="overflow-y-auto px-2 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]"
    >
      {@render DrawerMenuContent({ menu })}
    </div>
  </Drawer.Content>
</Drawer.Root>

{#snippet DrawerMenuContent({ menu }: { menu: AppMenu })}
  {@const itemsBySection = menu.filter ? menu.filteredItems : menu.renderedItems}
  {#each Object.entries(itemsBySection ?? {}) as [section, items]}
    <div class="py-1" data-mobile-menu-section={section}>
      {#each items as item}
        {#if item === "separator"}
          <div class="border-border my-1 border-t" aria-hidden="true"></div>
        {:else if isMenuItem(item)}
          {@render DrawerMenuItem({ item })}
        {:else}
          <div class="text-muted-foreground px-3 pt-3 pb-1 pl-11 text-xs font-medium">
            {item.title}
          </div>
          <div>
            {@render DrawerMenuContent({ menu: item })}
          </div>
        {/if}
      {/each}
    </div>
  {/each}
{/snippet}

{#snippet DrawerMenuItem({ item }: { item: MenuItem })}
  <button
    type="button"
    class="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
    disabled={item.disabled || item.isLabel}
    onclick={(evt) => item.click(evt)}
  >
    <Icon
      class="text-muted-foreground size-5 shrink-0"
      name={item.icon || (item.checked ? "check" : "custom:blank")}
    />
    <span class="min-w-0 flex-1 truncate">{item.title}</span>
  </button>
{/snippet}