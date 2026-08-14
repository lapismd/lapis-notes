<script lang="ts">
  import { createVirtualizer, type TFile } from "@lapis-notes/api";
  import { Icon } from "@lapis-notes/api/icon";
  import { cn } from "@lapis-notes/api";
  import { fuzzySearch } from "../fuzzy-search";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import type { HTMLAttributes } from "svelte/elements";
  type Options = { label: string; value: string; icon?: string };

  let {
    value = $bindable(""),
    options,
    placeholder = "Find or create",
    class: className,
    rootClass,
    onSelect,
    ...inputAttrs
  }: {
    value: string;
    options: Array<Options> | (() => Array<Options>);
    placeholder?: string;
    class?: string;
    rootClass?: string;
    onSelect?: (value: string) => void;
  } & HTMLAttributes<HTMLInputElement> = $props();

  const commandInputAttrs = $derived.by(
    () =>
      ({
        ...inputAttrs,
        id: inputAttrs.id ?? undefined,
      }) as any,
  );

  let filteredOptions = $derived.by(() => {
    const opts = Array.isArray(options) ? options : options();
    return fuzzySearch(opts, value?.toString() ?? "", {
      keys: ["label", "value"],
    }).map((result) => result.item);
  });

  let inputEl: HTMLInputElement = $state(null)!;
  let isOpen: boolean = $state(false);
  const listboxId = `bases-autocomplete-${crypto.randomUUID()}`;

  let virtualListEl: HTMLDivElement | null = $state(null);
  let virtualizer = createVirtualizer({
    get count() {
      return filteredOptions.length;
    },
    getScrollElement: () => virtualListEl,
    estimateSize: () => 32,
    overscan: 5,
  });

  $effect(() => {
    virtualizer.setOptions({ count: filteredOptions.length });
  });
</script>

<Command.Root shouldFilter={false} class={cn("bases-style-bg-transparent-7f19cd", rootClass)}>
  <Popover.Root bind:open={isOpen}>
    <div
      class={cn(
        "bases-style-h-full-668b21 bases-style-data-slot-command-input-wrapper-h-full-7c1764 bases-style-data-slot-command-input-wrapper-border-non-3e6b83",
        className,
      )}
    >
      <Popover.Trigger>
        {#snippet child({ props }: { props: Record<string, any> })}
          <Command.Input
            bind:value
            bind:ref={inputEl}
            onblur={(evt) => onSelect?.((evt.target as HTMLInputElement).value)}
            {...props}
            {...commandInputAttrs}
            {placeholder}
            aria-controls={listboxId}
            class="bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-rounded-none-0c5e91 bases-style-border-none-4a5f0e bases-style-bg-transparent-7f19cd bases-style-py-0-68ecb3 bases-style-pl-1-6ad214 bases-style-outline-none-df37b1"
          />
        {/snippet}
      </Popover.Trigger>
    </div>
    <Popover.Content
      trapFocus={false}
      class="bases-style-w-250px-71e31b bases-style-p-0-5-de8350"
      onOpenAutoFocus={(e: Event) => {
        e.preventDefault();
        inputEl?.focus();
      }}
    >
      <Command.List id={listboxId} class="bases-style-p-1-eb6a3c">
        <div
          bind:this={virtualListEl}
          style="max-height: 300px; overflow: auto"
        >
          <Command.Empty>No results found.</Command.Empty>
          {#each virtualizer.getVirtualItems() as row (row.index)}
            {@const option = filteredOptions[row.index]}
            {#if option?.value}
              <Command.Item
                class={cn({ "bases-style-bg-accent-f1669c": option?.value === value })}
                onSelect={() => {
                  value = option.value;
                  isOpen = false;
                  onSelect?.(value);
                }}
              >
                {#if option?.icon}
                  <Icon name={option?.icon} />
                {/if}
                {option?.label}
              </Command.Item>
            {/if}
          {/each}
        </div>
      </Command.List>
    </Popover.Content>
  </Popover.Root>
</Command.Root>
