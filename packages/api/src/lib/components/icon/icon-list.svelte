<script lang="ts">
    import Check from "@lucide/svelte/icons/check";
    import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
    import { onMount, tick } from "svelte";
    import * as Command  from "@lapis-notes/ui/command";
    import * as Popover  from "@lapis-notes/ui/popover";
    import { Button, type ButtonProps } from "@lapis-notes/ui/button";
    import { fuzzySearch } from "@lapis-notes/ui";
    import Icon from "./icon.svelte";
    import { cn } from "../../utils.js";
    import { getIconPacks } from "../../icons";
    import type { IconifyJSON } from "@iconify/types";
    import { createVirtualizer } from "../../hooks/createVirtualizer.svelte";

    type IconSearchEntry = {
      icon: string;
      name: string;
      prefix: string;
      aliasesText: string;
    };

   
    let open = $state(false);
    let {
        onValueChange,
        value = $bindable(""),
        ref = $bindable(null),
        disabled = false,
        label = "Select an icon",
        ...btnProps
    }: ButtonProps & {
        onValueChange?: (value: string) => void;
        value?: string;
        ref?: HTMLButtonElement | null,
        label?: string;
    } = $props()
    let iconPacks: IconifyJSON[] = $state([]);
    let query = $state("");

    let iconEntries = $derived.by(() => {
      const entries: IconSearchEntry[] = [];
      for (const pack of iconPacks) {
        const aliases = Object.keys(pack.aliases ?? {}).reduce((acc: Record<string, string[]>, alias) => {
          const icon = pack.aliases![alias];
          acc[icon.parent] ||= [];
          acc[icon.parent].push(alias);
          return acc;
        }, {});

        for (const name of Object.keys(pack.icons)) {
          entries.push({
            icon: `${pack.prefix}:${name}`,
            name,
            prefix: pack.prefix,
            aliasesText: (aliases[name] ?? []).join(" "),
          });
        }
      }
      return entries;
    });

    let mergedIcons = $derived.by(() => {
      const normalizedQuery = query.trim();
      const rankedEntries = normalizedQuery
        ? fuzzySearch(iconEntries, normalizedQuery, {
            keys: ["name", "icon", "prefix", "aliasesText"],
          }).map((result) => result.item)
        : iconEntries;

      const visibleIcons: Array<string | IconSearchEntry> = [];
      let currentPrefix = "";

      for (const entry of rankedEntries) {
        if (entry.prefix !== currentPrefix) {
          currentPrefix = entry.prefix;
          visibleIcons.push(entry.prefix);
        }
        visibleIcons.push(entry);
      }

      return visibleIcons;
    });

    let virtualListEl: HTMLDivElement | null = $state(null)
    let virtualizer = createVirtualizer({
            get count() {
              return mergedIcons.length;
            },
            getScrollElement: () => virtualListEl,
            estimateSize: () => 32,
            overscan: 5,
    });

   
    // We want to refocus the trigger button when the user selects
    // an item from the list so users can continue navigating the
    // rest of the form with the keyboard.
    function closeAndFocusTrigger() {
      open = false;
      tick().then(() => {
        ref?.focus();
      });
    }

  $effect(() => {
    virtualizer.setOptions({ count: mergedIcons.length });
  });

  onMount(() => {
        Promise.all(getIconPacks().map(it => {
            if ("loader" in it) {
                return it.loader();
            }
            return Promise.resolve(it.icons);
        })).then(packs => {
            iconPacks = packs;
        })
    })
  </script>
  <Popover.Root bind:open>
    <Popover.Trigger bind:ref={ref}>
      {#snippet child({ props })}
        <Button
          variant="outline"
          class="w-[200px] justify-between"
          {...props}
          {...btnProps}
          {disabled}
          role="combobox"
          aria-expanded={open}
        >
          {#if value}
            <Icon name={value} />
          {:else}
            <span>{label}</span>
          {/if}
          <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="p-0" style="width: 250px">
      <Command.Root shouldFilter={false}>
        <Command.Input placeholder="Search icon..." bind:value={query} />
        <Command.List>
            <div bind:this={virtualListEl} style="max-height: 300px; overflow: auto">
              <div class="relative pr-1" style="height: {virtualizer.getTotalSize()}px;">
                <Command.Group class="text-foreground p-1 w-[350px] whitespace-nowrap">
                  {#each virtualizer.getVirtualItems() as row (row.index)}
                    {@const item = mergedIcons[row.index]}
                    {#if typeof item === "string"}
                      <Command.GroupHeading class="text-muted-foreground px-2 py-1.5 text-xs font-medium" style="position: absolute; z-index: 10000; top: 0; left: 0; width: 100%; height: {row.size}px; transform: translateY({row.start}px);">
                        {item}
                      </Command.GroupHeading>
                    {:else if item}
                      <Command.Item
                        style="position: absolute; top: 0; left: 0; width: 100%; height: {row.size}px; transform: translateY({row.start}px);"
                        class="pr-1"
                        value={item.icon}
                        onSelect={() => {
                            value = item.icon;
                            onValueChange?.(item.icon)
                          
                            closeAndFocusTrigger();
                        }}
                    >
                        <Check
                        class={cn(
                            "mr-2 size-4",
                            value !== item.icon && "text-transparent"
                        )}
                        />
                        <Icon name={item.icon} class="mr-2 size-4" />
                        {item.name}
                    </Command.Item> 
                    {/if}
                  {/each}
                </Command.Group>
              </div>
            </div>
        </Command.List>
      </Command.Root>
    </Popover.Content>
</Popover.Root>