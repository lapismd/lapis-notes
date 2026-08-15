<script lang="ts">
  import { Icon } from "@lapis-notes/api/icon";
  import { Label } from "@lapismd/design-core/shadcn/label";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Textarea } from "@lapismd/design-core/shadcn/textarea";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { Slider } from "@lapismd/design-core/shadcn/slider";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ArrowUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import X from "@lucide/svelte/icons/x";
  import CheckIcon from "@lucide/svelte/icons/check";
  import { cn } from "@lapis-notes/api";
  import type {
    BasesAllOptions,
    BasesOptions,
    BasesPropertyId,
  } from "@lapis-notes/api";
  import type { QueryController } from "./bases.svelte";
  import type { BasesViewBase } from "./models";

  let {
    controller,
    view = $bindable(),
  }: { controller: QueryController; view: BasesViewBase } = $props();
  let layoutOptions = $derived.by(() => {
    return [...controller.views.entries()].map(([key, view]) => {
      return { value: key, label: view.name, icon: view.icon };
    });
  });
  let options = $derived(
    controller.views.get(view.type)?.options?.(controller.view.config) || [],
  );
  type OptionEntry =
    | { kind: "group"; key: string; displayName: string }
    | { kind: "option"; key: string; option: BasesOptions };
  function flattenOptions(
    items: BasesAllOptions[],
    path = "options",
  ): OptionEntry[] {
    return items.flatMap((item, index) => {
      const key = `${path}-${index}`;
      if (item.type !== "group") {
        return [{ kind: "option", key, option: item } satisfies OptionEntry];
      }
      if (item.shouldHide?.()) return [];
      return [
        { kind: "group", key, displayName: item.displayName } satisfies OptionEntry,
        ...flattenOptions(item.items, key),
      ];
    });
  }
  let optionEntries = $derived.by(() => flattenOptions(options));
  const selectedLayout = $derived(
    layoutOptions.find((f) => f.value === view.type) ?? layoutOptions[0],
  );
  let openPropertyKey = $state<string | null>(null);

  function dropDownOptions(data: Record<string, string>) {
    return Object.entries(data).map(([value, label]) => {
      return { label, value };
    });
  }
</script>

<div class="bases-style-pb-6-fe985c">
  <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e">
    <Label for="layout" class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50">Layout</Label>
    <Select.Root
      type="single"
      name="layout"
      bind:value={
        () => view.type,
        (value) => {
          view.type = value;
        }
      }
    >
      <Select.Trigger class="bases-style-w-full-6da6a3">
        <Icon name={selectedLayout.icon} />
        {selectedLayout.label}
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          <Select.Label>Layouts</Select.Label>
          {#each layoutOptions as option (option.value)}
            <Select.Item value={option.value} label={option.label}>
              <Icon name={option.icon} />
              {option.label}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </div>
  {#each optionEntries as entry (entry.key)}
    {#if entry.kind === "group"}
      <h3 class="bases-view-settings__group" data-ui-part="option-group">
        {entry.displayName}
      </h3>
    {:else}
      {@const option = entry.option}
    {#if option.type === "dropdown"}
      {@const selectOptions = dropDownOptions(option.options)}
      {@const selectedOption =
        selectOptions.find(
          (it) =>
            it.value ===
            (controller.view.config.get(option.key) ?? option.default),
        ) ?? selectOptions[0]}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e" data-ui-part="view-option" data-option-type="dropdown">
        <Label for={option.key} class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50"
          >{option.displayName}</Label
        >
        <Select.Root
          type="single"
          name={option.key}
          bind:value={
            () => {
              return (controller.view.config.get(option.key) ||
                option.default) as string;
            },
            (value) => {
              controller.view.config.set(option.key, value);
            }
          }
        >
          <Select.Trigger class="bases-style-w-full-6da6a3">
            {selectedOption.label}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>{option.displayName}</Select.Label>
              {#each selectOptions as opt (opt.value)}
                <Select.Item value={opt.value} label={opt.label}>
                  {opt.label}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>
    {:else if option.type === "slider"}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-py-2-03b4dd" data-ui-part="view-option" data-option-type="slider">
        <Label for={option.key} class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50"
          >{option.displayName}</Label
        >
        <Slider
          data-tooltip={controller.view.config.get(option.key)}
          type="single"
          bind:value={
            () => {
              return (controller.view.config.get(option.key) ||
                option.default) as number;
            },
            (value) => {
              controller.view.config.set(option.key, value);
            }
          }
          min={option.min}
          max={option.max}
          step={option.step}
          class="bases-style-w-full-6da6a3"
        />
      </div>
    {:else if option.type === "text"}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e" data-ui-part="view-option" data-option-type="text">
        <Label for={option.key} class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50"
          >{option.displayName}</Label
        >
        <Input
          bind:value={
            () => {
              return (controller.view.config.get(option.key) ??
                option.default ??
                "") as string;
            },
            (value) => {
              controller.view.config.set(option.key, value);
            }
          }
          id={option.key}
          placeholder={option.placeholder}
        />
      </div>
    {:else if option.type === "multitext"}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e" data-ui-part="view-option" data-option-type="multitext">
        <Label for={option.key} class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50">{option.displayName}</Label>
        <Input
          id={option.key}
          value={((controller.view.config.get(option.key) ?? option.default ?? []) as string[]).join(", ")}
          onblur={(event) => {
            controller.view.config.set(
              option.key,
              event.currentTarget.value
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            );
          }}
        />
      </div>
    {:else if option.type === "toggle"}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e" data-ui-part="view-option" data-option-type="toggle">
        <Label for={option.key} class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50"
          >{option.displayName}</Label
        >
        <Switch
          bind:checked={
            () => {
              return Boolean(
                controller.view.config.get(option.key) ?? option.default,
              );
            },
            (value) => {
              controller.view.config.set(option.key, value);
            }
          }
          id={option.key}
        />
      </div>
    {:else if option.type === "file" || option.type === "folder"}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e" data-ui-part="view-option" data-option-type={option.type}>
        <Label for={option.key} class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50">{option.displayName}</Label>
        <Input
          id={option.key}
          placeholder={option.placeholder}
          bind:value={
            () => (controller.view.config.get(option.key) ?? option.default ?? "") as string,
            (value) => controller.view.config.set(option.key, value)
          }
        />
      </div>
    {:else if option.type === "formula"}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e" data-ui-part="view-option" data-option-type="formula">
        <Label for={option.key} class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50">{option.displayName}</Label>
        <Textarea
          id={option.key}
          placeholder={option.placeholder}
          bind:value={
            () => (controller.view.config.get(option.key) ?? option.default ?? "") as string,
            (value) => controller.view.config.set(option.key, value)
          }
        />
      </div>
    {:else if option.type === "property"}
      <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e" data-ui-part="view-option" data-option-type="property">
        <Label for={option.key} class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50"
          >{option.displayName}</Label
        >
        <Popover.Root
          bind:open={
            () => openPropertyKey === option.key,
            (value) => {
              openPropertyKey = value ? option.key : null;
            }
          }
        >
          <Popover.Trigger>
            {#snippet child({ props }: { props: Record<string, any> })}
              {@const selectedProperty = (controller.view.config.get(
                option.key,
              ) ?? option.default) as BasesPropertyId | undefined}
              {@const column = selectedProperty
                ? controller.getColumn(selectedProperty)
                : undefined}
              <div class="relative bases-style-flex-60fbb7">
                <Button
                  {...props}
                  id={option.key}
                  variant="outline"
                  size="sm"
                  class="bases-style-h-8-ed8a5d grow bases-style-justify-between-8ef226 bases-style-rounded-none-0c5e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
                >
                  <Icon name={[column?.icon ?? "lucide-file"]} />
                  {#if column?.displayName}
                    {column.displayName}
                  {:else}
                    <span class="bases-style-text-muted-foreground-bfa603"
                      >{option.placeholder ?? "Property"}</span
                    >{/if}
                  <ArrowUpDown />
                </Button>
                <X
                  onclick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    controller.view.config.set(option.key, "");
                    openPropertyKey = null;
                  }}
                  class="absolute bases-style-top-2-9a2db8 bases-style-right-6-82d7e5 bases-style-size-4-f7b5fa"
                />
              </div>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="bases-style-w-310px-8357f2 bases-style-p-0-8a539c" align="start">
            <Command.Root>
              <Command.Input placeholder="Find or create" />
              <Command.List class="bases-style-p-1-eb6a3c">
                <Command.Empty>No results found.</Command.Empty>
                {#each controller
                  .getAllColumns()
                  .filter((p) => !option.filter || option.filter(p.id)) as column (column.id)}
                  <Command.Item
                    onSelect={() => {
                      controller.view.config.set(option.key, column.id);
                      openPropertyKey = null;
                    }}
                  >
                    <div
                      class={cn(
                        "bases-style-mr-2-d2347e bases-style-flex-60fbb7 bases-style-size-4-f7b5fa bases-style-items-center-3960ff bases-style-justify-center-86843c",
                        (controller.view.config.get(option.key) ??
                          option.default) === column.id
                          ? ""
                          : "bases-style-opacity-50-0b8c50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon class="bases-style-size-4-f7b5fa" />
                    </div>
                    <Icon name={[column?.icon ?? "lucide-info"]} />
                    <span>{column?.displayName ?? column.id}</span>
                    <Command.Shortcut class="bases-style-font-mono-0e6570 bases-style-text-0-75em-c425cc"
                      >{column.id}</Command.Shortcut
                    >
                  </Command.Item>
                {/each}
              </Command.List>
            </Command.Root>
          </Popover.Content>
        </Popover.Root>
      </div>
    {/if}
    {/if}
  {/each}
</div>

<style>
  .bases-view-settings__group {
    margin: 0.75rem 0 0.25rem;
    padding: 0 0.5rem;
    color: var(--ui-workspace-muted-foreground);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
</style>
