<script lang="ts">
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";

  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import LucideList from "@lucide/svelte/icons/list";
  import FunctionIcon from "@lucide/svelte/icons/square-function";
  import EyeOff from "@lucide/svelte/icons/eye-off";

  import { cn } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Icon } from "@lapis-notes/api/icon";
  import { Label } from "@lapismd/design-core/shadcn/label";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import { tick } from "svelte";
  import QueryEditor from "./query-editor.svelte";
  import { formulaColumn, isFilterColumn } from "../filter-parser";
  import type { BasesPropertyId } from "@lapis-notes/api";
  import type { QueryController } from "../bases.svelte";
  import type { ColumnDefinition } from "../columns";

  let {
    table,
    controller = table as QueryController,
    properties = $bindable(),
    formulas = $bindable(),
    order = $bindable(),
  }: {
    controller?: QueryController;
    table?: any;
    properties: Record<string, { displayName: string }>;
    formulas: Record<string, string>;
    order: Array<string>;
  } = $props();

  let selected: ColumnDefinition | null = $state(null);
  let selectedFormula = $derived.by(() => {
    if (!selected?.id) return "";
    const [isFilter, filterKey] = isFilterColumn(selected.id);
    return isFilter ? filterKey : "";
  });
  let addedFormula = $state({ id: "", invalid: false, value: "" });
  let sortedColumns = $state(getSortedColumns());
  let open = $state(false);
  const COUNT_SUMMARY_OPTIONS = [
    { label: "None", value: "none" },
    { label: "Count", value: "count" },
    { label: "Count empty", value: "count-empty" },
    { label: "Count filled", value: "count-filled" },
  ];
  const NUMBER_SUMMARY_OPTIONS = [
    ...COUNT_SUMMARY_OPTIONS,
    { label: "Sum", value: "sum" },
    { label: "Average", value: "avg" },
    { label: "Min", value: "min" },
    { label: "Max", value: "max" },
  ];

  $effect(() => {
    if (!open) {
      sortedColumns = getSortedColumns();
    }
  });

  function normalizeName(name: string) {
    return name.replaceAll(/[^a-zA-Z0-9 ]/g, " ").trim();
  }

  let summaryOptions = $derived.by(() => {
    if (!selected) return COUNT_SUMMARY_OPTIONS;
    return selected.type === "number"
      ? NUMBER_SUMMARY_OPTIONS
      : COUNT_SUMMARY_OPTIONS;
  });

  function getSortedColumns() {
    return controller.getAllColumns().sort((ca, cb) => {
      const a = controller.isVisible(ca.id) ? 1 : 0;
      const b = controller.isVisible(cb.id) ? 1 : 0;
      return b - a;
    });
  }

  function editColumn(evt: MouseEvent, column: ColumnDefinition) {
    selected = column;
    evt.preventDefault();
    evt.stopImmediatePropagation();
    evt.stopPropagation();
  }

  function changeDisplayName(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (target && selected && value && value !== selected?.displayName) {
      const [isFilter, filterKey] = isFilterColumn(selected.id);
      if (isFilter && addedFormula.id === selected.id) {
        if (formulas[value]) {
          addedFormula.invalid = true;
          addedFormula.value = value;
          return;
        }
        addedFormula.invalid = false;
        const index = order.findIndex((c) => c === selected!.id);
        const previous = formulas[filterKey];
        if (index !== -1) {
          order[index] = formulaColumn(filterKey);
        }
        delete formulas[filterKey];
        formulas[value] = previous;
        selected.id = formulaColumn(value);
        selected.displayName = value;
        return;
      }
      properties[selected.id] ||= { displayName: value };
      properties[selected.id].displayName = value;
      selected.displayName = value;
    }
  }

  function addFormula(evt: MouseEvent) {
    let id = "Untitled";
    let count = 1;
    while (id in formulas) {
      id = `Untitiled ${count}`;
      count++;
    }
    formulas[id] = "";
    addedFormula.id = formulaColumn(id);
    order = [...new Set([...order, addedFormula.id])];
    tick().then(() => {
      setTimeout(() => {
        selected =
          controller.getColumn(addedFormula.id as BasesPropertyId) ?? null;
      });
    });
  }

  function deleteFormula(column: ColumnDefinition) {
    const [isFilter, filterKey] = isFilterColumn(column.id);
    if (!isFilter) return;
    delete formulas[filterKey];
    order = order.filter((o) => o !== column.id);
    selected = null;
  }

  function updateFormula(content: string) {
    if (!selected) return;
    const [isFilter, filterKey] = isFilterColumn(selected.id);
    if (!isFilter) return;
    formulas[filterKey] = content;
  }

  function getBaseSummary() {
    if (!selected) return "none";
    return controller.doc.summaries?.[selected.id] ?? "none";
  }

  function setBaseSummary(value: string) {
    if (!selected) return;
    const summaries = { ...(controller.doc.summaries ?? {}) };
    if (!value || value === "none") {
      delete summaries[selected.id];
    } else {
      summaries[selected.id] = value;
    }
    controller.doc.summaries = Object.keys(summaries).length
      ? summaries
      : undefined;
  }

  function getViewSummary() {
    if (!selected) return "none";
    return controller.selectedView.summaries?.[selected.id] ?? "none";
  }

  function setViewSummary(value: string) {
    if (!selected) return;
    const summaries = { ...(controller.selectedView.summaries ?? {}) };
    if (!value || value === "none") {
      delete summaries[selected.id];
    } else {
      summaries[selected.id] = value;
    }
    controller.selectedView.summaries = Object.keys(summaries).length
      ? summaries
      : undefined;
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <Button {...props} variant="outline" size="sm" class="bases-style-h-8-ed8a5d bases-style-border-dashed-a29b7a">
        <LucideList /> Properties
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="bases-style-w-max-2f935d bases-style-p-0-8a539c" align="start">
    {#if selected}
      {@const name = selected.displayName ?? normalizeName(selected.id)}
      <Command.Root>
        <div class="bases-style-p-2-7660b4">
          <div class="bases-style-flex-60fbb7 bases-style-justify-between-8ef226">
            <Button
              variant="ghost"
              size="sm"
              class="bases-style-flex-60fbb7 grow bases-style-justify-start-4b5cc1"
              onclick={(evt) => {
                selected = null;
                addedFormula = { id: "", invalid: false, value: "" };
              }}
            >
              <ChevronLeft /> Edit {name}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Button {...props} size="sm" variant="ghost"
                    ><Ellipsis /></Button
                  >
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  onclick={() => controller.toggleVisibility(selected!.id)}
                  >Hide property</DropdownMenu.Item
                >
                {#if selected.id.startsWith("formula.")}
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onclick={() => deleteFormula(selected!)}
                    >Delete formula</DropdownMenu.Item
                  >
                {/if}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
          <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e">
            <Label for="column_name" class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50">
              Display name
            </Label>
            <Input
              aria-invalid={addedFormula.invalid}
              id="column_name"
              onblur={(evt) => changeDisplayName(evt)}
              value={name}
              class={cn("bases-style-col-span-2-40efc0 bases-style-h-8-ed8a5d", {
                "bases-style-bg-destructive-20-82a978": addedFormula.invalid,
              })}
            />
            {#if addedFormula.invalid}
              <Label
                aria-invalid
                for="column_name"
                class="bases-style-text-destructive-811148 bases-style-text-xs-359090 bases-style-opacity-50-0b8c50"
              >
                Formula with id '{addedFormula.value}' already exists
              </Label>
            {/if}
          </div>
          {#if selectedFormula}
            <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e">
              <Label for="formula" class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50">Formula</Label>
              <QueryEditor
                {controller}
                class="bases-style-rounded-md-421ac2 bases-style-border-2-65935d bases-style-p-1-eb6a3c bases-style-pb-20px-112bf7"
                content={formulas[selectedFormula]}
                placeholder="x + y"
                id="formula"
                onBlur={(evt) => updateFormula(evt)}
              />
            </div>
          {/if}
          <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-3-ce335a">
            <Label class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50">Summary in all views</Label>
            <Select.Root
              type="single"
              bind:value={getBaseSummary, setBaseSummary}
            >
              <Select.Trigger
                size="sm"
                class="bases-style-bg-background-e6f9e3 bases-style-h-8-ed8a5d bases-style-justify-between-8ef226"
              >
                {summaryOptions.find(
                  (option) => option.value === getBaseSummary(),
                )?.label ?? "None"}
              </Select.Trigger>
              <Select.Content>
                {#each summaryOptions as option (option.value)}
                  <Select.Item value={option.value} label={option.label}
                    >{option.label}</Select.Item
                  >
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-1-6b7d6e">
            <Label class="bases-style-text-sm-fc7473 bases-style-opacity-50-0b8c50">Summary in this view</Label>
            <Select.Root
              type="single"
              bind:value={getViewSummary, setViewSummary}
            >
              <Select.Trigger
                size="sm"
                class="bases-style-bg-background-e6f9e3 bases-style-h-8-ed8a5d bases-style-justify-between-8ef226"
              >
                {summaryOptions.find(
                  (option) => option.value === getViewSummary(),
                )?.label ?? "None"}
              </Select.Trigger>
              <Select.Content>
                {#each summaryOptions as option (option.value)}
                  <Select.Item value={option.value} label={option.label}
                    >{option.label}</Select.Item
                  >
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </Command.Root>
    {:else}
      <Command.Root>
        <Command.Input placeholder="Find or create" />
        <Command.List class="bases-style-p-1-eb6a3c">
          <Command.Empty>No results found.</Command.Empty>
          {#each sortedColumns as column (column.id)}
            <Command.Item
              onSelect={() => {
                controller.toggleVisibility(column.id);
              }}
            >
              <div
                data-ui-part="bases-option-indicator"
                data-selected={controller.isVisible(column.id)}
                class={cn(
                  "bases-style-mr-2-d2347e bases-style-flex-60fbb7 bases-style-size-4-f7b5fa bases-style-items-center-3960ff bases-style-justify-center-86843c bases-style-rounded-sm-36d446 border bases-style-border-var-interactive-accent-f46c93",
                  controller.isVisible(column.id)
                    ? "bases-style-ring-ring-3e1868 bases-style-border-none-4a5f0e bases-style-bg-var-interactive-accent-c58cc0 bases-style-text-var-text-on-accent-22b2b1 hover:ring bases-style-hover-ring-2-8a0edf"
                    : "bases-style-opacity-50-0b8c50 [&_svg]:invisible",
                )}
              >
                <CheckIcon class="bases-style-size-4-f7b5fa" />
              </div>
              <Icon name={[column.icon ?? "lucide-info"]} />
              <span
                class={cn({ "bases-style-opacity-40-2a2db4": !controller.isVisible(column.id) })}
                >{column.displayName ?? normalizeName(column.id)}</span
              >
              <Command.Shortcut>
                <button
                  class="bases-style-hover-bg-border-2e3f11 bases-style-rounded-sm-36d446 bases-style-p-1-eb6a3c"
                  onclick={(evt) => editColumn(evt, column)}
                >
                  <ChevronRight />
                </button>
              </Command.Shortcut>
            </Command.Item>
          {/each}
        </Command.List>
      </Command.Root>
    {/if}
    {#if !selected}
      <div class="bases-style-flex-60fbb7 bases-style-w-full-6da6a3 bases-style-flex-col-8dddea bases-style-gap-1-44ee8b bases-style-border-t-b950dd bases-style-p-1-eb6a3c">
        <Button
          size="sm"
          onclick={(evt) => addFormula(evt)}
          class="bases-style-w-full-6da6a3 bases-style-justify-start-4b5cc1"
          variant="ghost"
        >
          <FunctionIcon /> Add formula
        </Button>
        <Button
          size="sm"
          onclick={() => (order = [])}
          class="bases-style-w-full-6da6a3 bases-style-justify-start-4b5cc1"
          variant="ghost"
        >
          <EyeOff /> Hide all
        </Button>
      </div>
    {/if}
  </Popover.Content>
</Popover.Root>
