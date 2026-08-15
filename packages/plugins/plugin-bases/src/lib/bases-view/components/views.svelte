<script lang="ts">
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";

  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import Plus from "@lucide/svelte/icons/plus";
  import ArrowUpDown from "@lucide/svelte/icons/chevrons-up-down";

  import { cn } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Icon } from "@lapis-notes/api/icon";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import type { BasesViewBase } from "../models";
  import type { QueryController } from "../bases.svelte";
  import ViewSettings from "../view-settings.svelte";

  let {
    views = $bindable(),
    value = $bindable(),
    show = $bindable(),
    table,
    controller = table as QueryController,
  }: {
    views: BasesViewBase[];
    value: BasesViewBase;
    controller?: QueryController;
    table?: any;
    show: boolean;
  } = $props();

  let selected: BasesViewBase | null = $state(null);
  let open: boolean = $state(false);

  function addView(evt: MouseEvent) {
    views.push({
      name: "Table",
      type: "table",
      order: ["file.name"],
      sort: [],
      limit: null,
      filter: { and: [] },
    });
  }

  function deleteView() {
    const index = views.findIndex((v) => v == selected);
    if (index !== -1) {
      views.splice(index, 1);
    }
  }

  function duplicateView() {
    if (selected) {
      const value = { ...$state.snapshot(selected) };
      views.push(value);
    }
  }

  function changeDisplayName(evt: FocusEvent) {
    const target = evt.target as HTMLInputElement;
    if (target && selected && target.value) {
      selected.name = target.value;
    }
  }

  function viewIcon(view?: BasesViewBase | null) {
    if (!view) return "table";
    const config = controller.views.get(view.type);
    if (config) {
      return config.icon;
    }
    return "table";
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <Button {...props} variant="outline" size="sm" class="bases-style-h-8-ed8a5d bases-style-border-dashed-a29b7a">
        <Icon name={viewIcon(selected)} />
        {value.name}
        <ArrowUpDown />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="bases-style-w-270px-448793 bases-style-min-w-220px-cbc208 bases-style-p-0-8a539c" align="start">
    {#if selected}
      <Command.Root>
        <div class="bases-style-p-2-7660b4">
          <div class="bases-style-flex-60fbb7 bases-style-justify-between-8ef226">
            <Button
              variant="ghost"
              size="sm"
              class="bases-style-flex-60fbb7 grow bases-style-justify-start-4b5cc1"
              onclick={(evt) => {
                selected = null;
              }}
            >
              <ChevronLeft /> Edit {selected.name}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Button {...props} size="sm" variant="ghost"
                    aria-label={`View actions for ${selected!.name}`}
                    ><Ellipsis /></Button
                  >
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onclick={() => deleteView()}
                  >Delete view</DropdownMenu.Item
                >
                <DropdownMenu.Separator />
                <DropdownMenu.Item onclick={() => duplicateView()}
                  >Duplicate view</DropdownMenu.Item
                >
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
          <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e">
            <Input
              id="column_name"
              aria-label="View name"
              onblur={(evt) => changeDisplayName(evt)}
              value={selected.name}
              class={cn("bases-style-col-span-2-40efc0 bases-style-h-8-ed8a5d")}
            />
          </div>
          <ViewSettings {controller} bind:view={selected} />
        </div>
      </Command.Root>
    {:else}
      <Command.Root>
        <Command.Input placeholder="Find or create" aria-controls="bases-view-selector-list" />
        <Command.List id="bases-view-selector-list" class="bases-style-p-1-eb6a3c">
          <Command.Empty>No views found.</Command.Empty>
          {#each views as view}
            <Command.Item
              class={cn("bases-style-mb-1-652817")}
              onSelect={() => {
                show = false;
                open = false;
                value = view;
                setTimeout(() => (show = true));
              }}
            >
              <Icon name={viewIcon(view)} />
              <span>{view.name}</span>
            </Command.Item>
          {/each}
        </Command.List>
      </Command.Root>
    {/if}
    {#if !selected}
      <div class="bases-style-flex-60fbb7 bases-style-w-full-6da6a3 bases-style-flex-col-8dddea bases-style-gap-1-44ee8b bases-style-border-t-b950dd bases-style-p-1-eb6a3c">
        <Button
          size="sm"
          onclick={() => (selected = value)}
          class="bases-style-w-full-6da6a3 bases-style-justify-start-4b5cc1"
          variant="ghost"
        >
          <Ellipsis /> Edit current view
        </Button>
        <Button
          size="sm"
          onclick={(evt) => addView(evt)}
          class="bases-style-w-full-6da6a3 bases-style-justify-start-4b5cc1"
          variant="ghost"
        >
          <Plus /> Add view
        </Button>
      </div>
    {/if}
  </Popover.Content>
</Popover.Root>
