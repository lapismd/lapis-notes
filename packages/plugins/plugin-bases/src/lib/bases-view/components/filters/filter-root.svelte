<script lang="ts">
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import LucideListFilter from "@lucide/svelte/icons/list-filter";
  import * as Accordion from "@lapismd/design-core/shadcn/accordion";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import FilterGroupComponent from "./filter-group.svelte";
  import { filterCount, type Filters } from "../..";
  import { cn } from "@lapis-notes/api";
  import type { QueryController } from "../../bases.svelte";

  let {
    table,
    controller = table as QueryController,
    currentFilter = $bindable(),
    globalFilter = $bindable(),
    class: className,
  }: {
    controller?: QueryController;
    table?: any;
    globalFilter: Filters;
    currentFilter: Filters;
    class?: string;
  } = $props();

  let globalCount = $derived(filterCount(globalFilter));
  let currentCount = $derived(filterCount(currentFilter));
  let totalCount = $derived(globalCount + currentCount);
  let defaultOpenSection = $derived(
    currentCount > 0
      ? "this-view"
      : globalCount > 0
        ? "all-views"
        : "this-view",
  );
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props }: { props: Record<string, any> })}
      <Button
        {...props}
        variant="outline"
        size="sm"
        class={cn("bases-style-h-8-ed8a5d bases-style-border-dashed-a29b7a", {
          "bases-style-text-var-text-accent-69c994 bases-style-hover-bg-color-mix-in-srgb-var-interactive-4e3e8a bases-style-hover-text-var-text-accent-5b2cb5":
            totalCount > 0,
        })}
      >
        <LucideListFilter /> Filter
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    class={cn(
      "bases-query-popover bases-filter-popover bases-style-mr-2-d2347e",
      className,
    )}
    data-bases-popover="filter"
    align="start"
  >
    <Accordion.Root type="single" value={defaultOpenSection}>
      <Accordion.Item value="all-views">
        <Accordion.Trigger
          indicatorPosition="start"
          indicatorVariant="disclosure"
          class="bases-style-py-1-660d2e bases-style-font-bold-69450e hover:no-underline"
        >
          <span>
            All views
            <Badge
              variant="secondary"
              class={cn({ invisible: globalCount == 0 })}>{globalCount}</Badge
            >
          </span>
        </Accordion.Trigger>
        <Accordion.Content class="">
          <ScrollArea
            orientation="both"
            class="bases-style-h-full-668b21 bases-style-max-w-55svw-8a9ecb bases-style-data-scroll-area-viewport-max-h-55svh-15dd46"
          >
            <FilterGroupComponent {controller} bind:filter={globalFilter} />
          </ScrollArea>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="this-view">
        <Accordion.Trigger
          indicatorPosition="start"
          indicatorVariant="disclosure"
          class="bases-style-py-1-660d2e bases-style-font-bold-69450e hover:no-underline"
        >
          <span>
            This view
            <Badge
              variant="secondary"
              class={cn({ invisible: currentCount == 0 })}>{currentCount}</Badge
            >
          </span>
        </Accordion.Trigger>
        <Accordion.Content class="">
          <ScrollArea
            orientation="both"
            class="bases-style-h-full-668b21 bases-style-max-w-55svw-8a9ecb bases-style-data-scroll-area-viewport-max-h-55svh-15dd46"
          >
            <FilterGroupComponent {controller} bind:filter={currentFilter} />
          </ScrollArea>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  </Popover.Content>
</Popover.Root>
