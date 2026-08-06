<script lang="ts">
  import * as Drawer from "@lapismd/design-core/shadcn/drawer";
  import Icon from "$lib/components/icon/icon.svelte";
  import {
    isMenuItem,
    type Menu as AppMenu,
    type MenuItem,
  } from "../../menu.svelte";
  import "./menu.css";

  let {
    menu,
  }: {
    menu: AppMenu;
  } = $props();

  const title = $derived(menu.title || "Menu");
</script>

<Drawer.Root bind:open={() => menu.open, (value) => menu.setOpen(value)}>
  <Drawer.Content
    data-ui-component="menu"
    data-ui-part="drawer-content"
    data-mobile-menu-drawer
    aria-label={title}
  >
    <Drawer.Header class="sr-only">
      <Drawer.Title>{title}</Drawer.Title>
      <Drawer.Description>Choose a menu action.</Drawer.Description>
    </Drawer.Header>
    <div data-ui-component="menu" data-ui-part="drawer-body">
      {@render DrawerMenuContent({ menu })}
    </div>
  </Drawer.Content>
</Drawer.Root>

{#snippet DrawerMenuContent({ menu }: { menu: AppMenu })}
  {@const itemsBySection = menu.filter ? menu.filteredItems : menu.renderedItems}
  {#each Object.entries(itemsBySection ?? {}) as [section, items]}
    <div
      data-ui-component="menu"
      data-ui-part="drawer-section"
      data-mobile-menu-section={section}
    >
      {#each items as item}
        {#if item === "separator"}
          <div
            data-ui-component="menu"
            data-ui-part="drawer-separator"
            aria-hidden="true"
          ></div>
        {:else if isMenuItem(item)}
          {@render DrawerMenuItem({ item })}
        {:else}
          <div data-ui-component="menu" data-ui-part="drawer-heading">
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
    data-ui-component="menu"
    data-ui-part="drawer-item"
    disabled={item.disabled || item.isLabel}
    onclick={(evt) => item.click(evt)}
  >
    <Icon
      class="menu-drawer-icon"
      name={item.icon || (item.checked ? "check" : "custom:blank")}
    />
    <span data-ui-component="menu" data-ui-part="drawer-item-label"
      >{item.title}</span
    >
  </button>
{/snippet}
