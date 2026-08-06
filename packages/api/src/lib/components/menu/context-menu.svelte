<script lang="ts">
  import * as ContextMenu from "@lapismd/design-core/shadcn/context-menu";
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
  <ContextMenu.Content class={cn(className)} customAnchor={anchor}>
    {@render ContextMenuContent({ menu })}
  </ContextMenu.Content>
{/if}

{#snippet ContextMenuContent({ menu }: { menu: AppMenu })}
  {#each Object.entries(menu?.renderedItems ?? {}) as [id, items]}
    {#each items as item}
      <ContextMenu.Group>
        {#if item === "separator"}
          <ContextMenu.Separator />
        {:else if isMenuItem(item)}
          {@render ContextMenuItem({ item })}
        {:else}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>
              <div data-ui-component="menu" data-ui-part="item-row">
                <Icon class="menu-item-icon" name="custom:blank" />
                {item.title}
              </div>
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent
              data-ui-component="menu"
              data-ui-part="sub-content"
            >
              {@render ContextMenuContent({ menu: item })}
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        {/if}
      </ContextMenu.Group>
    {/each}
  {/each}
{/snippet}

{#snippet ContextMenuItem({ item }: { item: MenuItem })}
  {#if item.checked !== null}
    <ContextMenu.CheckboxItem
      checked={item.checked}
      disabled={item.disabled}
      onclick={(evt: MouseEvent) => item.click(evt)}
    >
      <div data-ui-component="menu" data-ui-part="item-row">
        {#if item.icon}
          <Icon class="menu-item-icon" name={item.icon} />
        {/if}
        {item.title}
      </div>
    </ContextMenu.CheckboxItem>
  {:else}
    <ContextMenu.Item
      disabled={item.disabled}
      onclick={(evt: MouseEvent) => item.click(evt)}
    >
      <div data-ui-component="menu" data-ui-part="item-row">
        <Icon class="menu-item-icon" name={item.icon || "custom:blank"} />
        {item.title}
      </div>
    </ContextMenu.Item>
  {/if}
{/snippet}
