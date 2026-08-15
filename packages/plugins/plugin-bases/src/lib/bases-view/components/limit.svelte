<script lang="ts">
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Label } from "@lapismd/design-core/shadcn/label";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import type { BasesViewBase } from "../models";
  import { cn } from "@lapis-notes/api";
  import Copy from "@lucide/svelte/icons/copy";
  import Download from "@lucide/svelte/icons/download";
  import ShowAll from "@lucide/svelte/icons/rotate-ccw";
  let {
    count,
    view = $bindable(),
    onCopyCsv,
    onExportCsv,
    table,
    class: className,
  }: {
    count: number;
    view: BasesViewBase;
    onCopyCsv?: () => void | Promise<void>;
    onExportCsv?: () => void;
    table?: any;
    class?: string;
  } = $props();

  let showAll = $derived.by(() => {
    return !view.limit || view.limit <= 0;
  });

  function changeLimit(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    const value = +target.value;
    if (value !== view.limit) {
      view.limit = value;
    }
  }
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <Button
        {...props}
        variant="outline"
        size="sm"
        class={cn("bases-style-h-8-ed8a5d bases-style-border-dashed-a29b7a", className)}
      >
        {count} results
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="bases-style-w-270px-448793 bases-style-min-w-220px-cbc208 bases-style-p-0-8a539c" align="start">
    <Command.Root>
      <div class="bases-style-p-2-7660b4">
        <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e">
          <Label for="column_name" class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50"
            >Limit number of results</Label
          >
          <Input
            type="number"
            placeholder="e.g 10"
            id="column_name"
            onblur={(evt) => changeLimit(evt)}
            value={showAll ? "" : view.limit}
            class="bases-style-col-span-2-40efc0 bases-style-h-8-ed8a5d"
          />
        </div>
        <div class="bases-style-mt-2-50d0d2 bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e">
          <Button
            disabled={showAll}
            size="sm"
            onclick={() => (view.limit = 0)}
            class={cn("bases-style-w-full-6da6a3 bases-style-justify-start-4b5cc1")}
            variant="ghost"
          >
            <ShowAll /> Show all
          </Button>
          <Button
            size="sm"
            onclick={() => onCopyCsv?.()}
            class={cn("bases-style-w-full-6da6a3 bases-style-justify-start-4b5cc1")}
            variant="ghost"
          >
            <Copy /> Copy to clipboard
          </Button>
          <Button
            size="sm"
            onclick={() => onExportCsv?.()}
            class={cn("bases-style-w-full-6da6a3 bases-style-justify-start-4b5cc1")}
            variant="ghost"
          >
            <Download /> Export CSV...
          </Button>
        </div>
      </div>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
