<script lang="ts">
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { cn } from "../../utils";
  import Icon from "$lib/components/icon/icon.svelte";
  import DrawerMenu from "./drawer-menu.svelte";
  import { createMobileMenuQuery } from "./mobile-menu-query.svelte";
  import {
    isMenuItem,
    type Menu as AppMenu,
    type MenuItem,
  } from "../../menu.svelte";
  import "./menu.css";

  let {
    menu,
    anchor = null,
    class: className,
  }: {
    menu: AppMenu;
    class?: string;
    anchor?: HTMLElement | null;
  } = $props();

  const mobileMenu = createMobileMenuQuery();
</script>

{#if mobileMenu.matches}
  <DrawerMenu {menu} />
{:else}
  <DropdownMenu.Content class={cn(className)} customAnchor={anchor}>
    {@render DropdownMenuContent({ menu })}
  </DropdownMenu.Content>
{/if}

{#snippet DropdownMenuContent({ menu }: { menu: AppMenu })}
  {#each Object.entries(menu?.filteredItems ?? {}) as [id, items]}
    <DropdownMenu.Group>
      {#each items as item}
        {#if item === "separator"}
          <DropdownMenu.Separator />
        {:else if isMenuItem(item)}
          {@render DropdownItem({ item })}
        {:else}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>
              <div data-ui-component="menu" data-ui-part="item-row">
                <Icon class="menu-item-icon-sm" name="custom:blank" />
                {item.title}
              </div>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent
              data-ui-component="menu"
              data-ui-part="sub-content"
            >
              {@render DropdownMenuContent({ menu: item })}
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        {/if}
      {/each}
    </DropdownMenu.Group>
  {/each}
{/snippet}

{#snippet DropdownItem({ item }: { item: MenuItem })}
  {#if item.checked !== null}
    <DropdownMenu.CheckboxItem
      checked={item.checked}
      disabled={item.disabled}
      onclick={(evt) => item.click(evt)}
    >
      <div data-ui-component="menu" data-ui-part="item-row">
        {#if item.icon}
          <Icon class="menu-item-icon-sm" name={item.icon} />
        {/if}
        {item.title}
      </div>
    </DropdownMenu.CheckboxItem>
  {:else}
    <DropdownMenu.Item
      disabled={item.disabled}
      onclick={(evt) => item.click(evt)}
    >
      <div data-ui-component="menu" data-ui-part="item-row">
        <Icon class="menu-item-icon-sm" name={item.icon || "custom:blank"} />
        {item.title}
      </div>
    </DropdownMenu.Item>
  {/if}
{/snippet}
