<script lang="ts">
  import * as Command from "@lapismd/design-core/shadcn/command";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { cn } from "@lapis-notes/api";
  import CheckIcon from "@lucide/svelte/icons/check";
  import type { QueryController } from "../../bases.svelte";
  import { Icon } from "@lapis-notes/api/icon";

  let {
    controller,
    class: className,
  }: {
    controller: QueryController;
    class?: string;
  } = $props();

  const directions = [
    { label: "Ascending", value: "ASC" },
    { label: "Descending", value: "DESC" },
  ] as const;

  let groupBy = $derived(controller.selectedView.groupBy);
  let selectedColumn = $derived.by(() => {
    return groupBy?.property
      ? controller.getColumn(groupBy.property)
      : undefined;
  });

  function setGroupBy(property: string) {
    controller.selectedView.groupBy = {
      property,
      direction: controller.selectedView.groupBy?.direction ?? "ASC",
    };
  }

  function getDirection() {
    return controller.selectedView.groupBy?.direction ?? "ASC";
  }

  function setDirection(direction: string) {
    if (!controller.selectedView.groupBy) return;
    controller.selectedView.groupBy = {
      ...controller.selectedView.groupBy,
      direction: direction === "DESC" ? "DESC" : "ASC",
    };
  }
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <Button
        {...props}
        variant="outline"
        size="sm"
        class={cn("bases-style-h-8-ed8a5d bases-style-border-dashed-a29b7a", className, {
          "bases-style-text-var-text-accent-69c994 bases-style-hover-bg-color-mix-in-srgb-var-interactive-4e3e8a bases-style-hover-text-var-text-accent-5b2cb5":
            !!groupBy?.property,
        })}
      >
        Group
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="bases-style-w-320px-57f3af bases-style-p-0-8a539c" align="start">
    <Command.Root>
      <Command.Input placeholder="Group by property" />
      <Command.List class="bases-style-p-1-eb6a3c">
        <Command.Empty>No properties found.</Command.Empty>
        {#each controller.getAllColumns() as column (column.id)}
          <Command.Item onSelect={() => setGroupBy(column.id)}>
            <div
              data-ui-part="bases-option-indicator"
              data-selected={groupBy?.property === column.id}
              class={cn(
                "bases-style-mr-2-d2347e bases-style-flex-60fbb7 bases-style-size-4-f7b5fa bases-style-items-center-3960ff bases-style-justify-center-86843c bases-style-rounded-sm-36d446 border bases-style-border-var-interactive-accent-f46c93",
                groupBy?.property === column.id
                  ? "bases-style-ring-ring-3e1868 bases-style-border-none-4a5f0e bases-style-bg-var-interactive-accent-c58cc0 bases-style-text-var-text-on-accent-22b2b1 hover:ring"
                  : "bases-style-opacity-50-0b8c50 [&_svg]:invisible",
              )}
            >
              <CheckIcon class="bases-style-size-4-f7b5fa" />
            </div>
            <Icon name={[column.icon ?? "lucide-file"]} />
            <span class="truncate">{column.displayName}</span>
          </Command.Item>
        {/each}
      </Command.List>
      <div class="bases-style-border-t-b950dd bases-style-p-2-7660b4">
        <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-gap-2-77a2a2">
          <Select.Root type="single" bind:value={getDirection, setDirection}>
            <Select.Trigger size="sm" class="bases-style-bg-background-e6f9e3 bases-style-h-8-ed8a5d bases-style-justify-between-8ef226">
              {directions.find(
                (direction) => direction.value === getDirection(),
              )?.label}
            </Select.Trigger>
            <Select.Content>
              {#each directions as direction (direction.value)}
                <Select.Item value={direction.value} label={direction.label}
                  >{direction.label}</Select.Item
                >
              {/each}
            </Select.Content>
          </Select.Root>
          <Button
            variant="ghost"
            size="sm"
            class="bases-style-justify-start-4b5cc1"
            disabled={!selectedColumn}
            onclick={() => (controller.selectedView.groupBy = undefined)}
          >
            Clear grouping
          </Button>
        </div>
      </div>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
