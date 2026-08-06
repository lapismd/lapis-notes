<script lang="ts">
  import { type Menu as AppMenu } from "$lib/menu.svelte";
  import ContextMenuContent from "./context-menu.svelte";
  import DropdownMenuContent from "./dropdown-menu.svelte";
  import PopoverMenu from "./popover-menu.svelte";
  import * as Dropdown from "@lapis-notes/ui/dropdown-menu";
  import * as ContextMenu from "@lapis-notes/ui/context-menu";
  import type { WithChildren } from "bits-ui";

  let {
    menu,
    anchor = null,
    type = "popover",
    class: className,
    children,
  }: WithChildren<{
    menu: AppMenu;
    class?: string;
    type?: "popover" | "dropdown-menu" | "context-menu";
    anchor?: HTMLElement | null;
  }> = $props();
</script>

{#if type === "popover"}
  <PopoverMenu {menu} {anchor} class={className} />
{:else if type === "dropdown-menu"}
  <Dropdown.Root bind:open={() => menu.open, (value) => menu.setOpen(value)}>
    {@render children?.()}
    <DropdownMenuContent {menu} {anchor} class={className} />
  </Dropdown.Root>
{:else if type === "context-menu"}
  <ContextMenu.Root bind:open={() => menu.open, (value) => menu.setOpen(value)}>
    {@render children?.()}
    <ContextMenuContent {menu} {anchor} class={className} />
  </ContextMenu.Root>
{/if}
