<script lang="ts">
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import { cn } from "@lapis-notes/api";
  import { Icon } from "@lapis-notes/api/icon";
  import ArrowUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import CheckIcon from "@lucide/svelte/icons/check";
  import type { QueryController } from "../../bases.svelte";

  let {
    controller,
    value = $bindable(),
  }: { value: any; controller: QueryController } = $props();

  let col = $derived(determineColumn(value));
  let isOpen: boolean = $derived(false);

  function determineColumn(id: string) {
    const column = controller.getAllColumns().find((it) => it.id === id);
    if (!column) {
      return { name: id, icon: "lucide-info" };
    }
    return {
      name: column.displayName ?? id,
      icon: column.icon ?? "lucide-info",
    };
  }
</script>

<Popover.Root bind:open={isOpen}>
  <Popover.Trigger class="">
    {#snippet child({ props }: { props: Record<string, any> })}
      <Button
        {...props}
        variant="outline"
        size="sm"
        class="bases-style-flex-60fbb7 bases-style-h-8-ed8a5d grow bases-style-justify-between-8ef226 bases-style-rounded-none-0c5e91 bases-style-rounded-l-md-9b2e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
      >
        <span class="bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-items-center-3960ff">
          <Icon name={col.icon} class="bases-style-mr-1-618162" />
          {col.name}
        </span>
        <ArrowUpDown />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="bases-style-w-310px-8357f2 bases-style-p-0-8a539c" align="start">
    <Command.Root>
      <Command.Input placeholder="Find or create" />
      <Command.List class="bases-style-p-1-eb6a3c">
        <Command.Empty>No results found.</Command.Empty>
        {#each controller
          .getAllColumns()
          .filter((col) => col.id.startsWith("note.")) as column (column.id)}
          <Command.Item
            onSelect={() => {
              value = column.id;
              isOpen = false;
            }}
          >
            <div
              class={cn(
                "bases-style-mr-2-d2347e bases-style-flex-60fbb7 bases-style-size-4-f7b5fa bases-style-items-center-3960ff bases-style-justify-center-86843c",
                value === column.id ? "" : "bases-style-opacity-50-0b8c50 [&_svg]:invisible",
              )}
            >
              <CheckIcon class="bases-style-size-4-f7b5fa" />
            </div>
            <Icon name={[column.icon ?? "lucide-info"]} />
            <span>{column.displayName}</span>
          </Command.Item>
        {/each}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
