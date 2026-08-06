<script lang="ts">
  import * as Popover from "@lapis-notes/ui/popover";
  import * as Command from "@lapis-notes/ui/command";
  import { cn } from "../../utils";
  import Icon from "$lib/components/icon/icon.svelte";
  import DrawerMenu from "./drawer-menu.svelte";
  import { createMobileMenuQuery } from "./mobile-menu-query.svelte";
  import {
    isMenuItem,
    type Menu as AppMenu,
    type MenuItem,
  } from "../../menu.svelte";

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
  const hasItems = $derived(
    Object.keys(menu.filter ? menu.filteredItems : menu.renderedItems).length >
      0,
  );
</script>

{#if hasItems}
  {#if mobileMenu.matches}
    <DrawerMenu {menu} />
  {:else}
    <Popover.Root bind:open={() => menu.open, (value) => menu.setOpen(value)}>
      <Popover.Content
        onInteractOutside={(evt) => {
          if (evt.target !== anchor) {
            menu.setOpen(false);
          }
        }}
        trapFocus={false}
        interactOutsideBehavior="defer-otherwise-close"
        customAnchor={anchor}
        class={cn(
          "bg-popover text-popover-foreground z-50 min-w-[8rem] rounded-md border p-1 focus:outline-none max-w-80",
          className,
        )}
      >
        <Command.Root shouldFilter={false}>
          <Command.List>
            <Command.Group heading={menu.title}>
              {@render CommandContent({ menu })}
            </Command.Group>
          </Command.List>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
  {/if}
{/if}

{#snippet CommandContent({ menu }: { menu: AppMenu })}
  {#each Object.entries(menu?.filteredItems ?? {}) as [id, items]}
    {#each items as item}
      <Command.Group>
        {#if item === "separator"}
          <Command.Separator />
        {:else if isMenuItem(item)}
          {@render CommandItem({ item })}
        {:else}
          <Command.Group heading={item.title}>
            {@render CommandContent({ menu: item })}
          </Command.Group>
        {/if}
      </Command.Group>
    {/each}
  {/each}
{/snippet}

{#snippet CommandItem({ item }: { item: MenuItem })}
  <Command.Item
    onclick={(evt: MouseEvent) => item.click(evt)}
    value={typeof item.title === "string" ? item.title : ""}
  >
    {#if item.icon}
      <Icon class="mr-2 size-5" name={item.icon} />
    {/if}
    {item.title}
  </Command.Item>
{/snippet}
