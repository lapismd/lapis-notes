<script module lang="ts">
  let filterErrorSequence = 0;
</script>

<script lang="ts">
  import type { Table } from "@tanstack/table-core";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import { columnName, filterTypeFor, isFilterLine } from "../..";
  import { Icon } from "@lapis-notes/api/icon";
  import CheckIcon from "@lucide/svelte/icons/check";
  import CodeXML from "@lucide/svelte/icons/code-xml";
  import FilterIcon from "@lucide/svelte/icons/mouse-pointer-click";

  import Trash from "@lucide/svelte/icons/trash-2";
  import ArrowUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import * as Select from "@lapismd/design-core/shadcn/select";

  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { FilterLine } from "../..";
  import { onMount, untrack } from "svelte";
  import FilterEditor from "./filter-editor.svelte";
  import { cn } from "@lapis-notes/api";
  import {
    resolveFilterDraft,
    toSQL,
    validateFilterPredicate,
  } from "../../filter-parser";
  import { Notice } from "@lapis-notes/api";
  import QueryEditor from "../query-editor.svelte";
  import type { BasesPropertyId, QueryController } from "../../bases.svelte";

  let {
    label,
    controller,
    value = $bindable(),
    deleteFilter,
  }: {
    label: string;
    controller: QueryController;
    value: string | FilterLine;
    deleteFilter?: () => void;
  } = $props();

  let filter: FilterLine = $state({
    column: "",
    op: "",
    value: "",
  });
  const filterErrorId = `bases-filter-error-${++filterErrorSequence}`;
  let customDraft = $state("");
  let customError = $state<string | null>(null);

  let column = $derived(
    filter.column
      ? controller.getColumn(filter.column as BasesPropertyId)
      : undefined,
  );
  let type = $derived(column?.type ?? "unknown");
  let filterTypes = $derived(filterTypeFor(column));
  let simple = $derived(typeof filter.custom !== "string");
  let filterValue = $derived(filterTypes.find((f) => f.value === filter.op));
  let isValid = $derived(
    filter.op.length > 0 &&
      filter.column.length > 0 &&
      filterValue &&
      (filterValue.type === "none" || String(filter.value).length > 0),
  );

  function equalFilterLines(
    left: FilterLine | null | undefined,
    right: FilterLine | null | undefined,
  ): boolean {
    if (!left || !right) {
      return left === right;
    }

    const equalValue =
      Array.isArray(left.value) || Array.isArray(right.value)
        ? Array.isArray(left.value) &&
          Array.isArray(right.value) &&
          left.value.length === right.value.length &&
          left.value.every((value, index) => value === right.value[index])
        : left.value === right.value;

    return (
      left.column === right.column &&
      left.op === right.op &&
      left.custom === right.custom &&
      equalValue
    );
  }

  function syncCustomDraft(source: string, error: string | null = null) {
    if (untrack(() => customDraft) !== source) {
      customDraft = source;
    }
    customError = error;
  }

  function updateCustomDraft(source: string) {
    customDraft = source;
    const result = resolveFilterDraft(filter.custom ?? "", source);
    customError = result.error;
    if (result.valid) {
      filter.custom = result.applied;
    }
  }

  $effect(() => {
    if (isFilterLine(value)) {
      if (!equalFilterLines(filter, value)) {
        filter = { ...value };
      }
      if (typeof value.custom === "string") {
        syncCustomDraft(value.custom);
      }
      return;
    }

    if (typeof filter.custom === "string" && filter.custom === value) {
      syncCustomDraft(value);
      return;
    }

    const validation = validateFilterPredicate(value);
    if (!validation.valid) {
      filter = { ...filter, custom: value };
      syncCustomDraft(value, validation.error);
      return;
    }

    const predicate = validation.predicate;
    if (isFilterLine(predicate)) {
      if (!equalFilterLines(filter, predicate)) {
        filter = predicate;
      }
      if (typeof predicate.custom === "string") {
        syncCustomDraft(predicate.custom);
      } else {
        syncCustomDraft(value);
      }
    } else {
      filter.op = filterTypes[0].value;
    }
  });

  $effect(() => {
    if (filterValue && filterValue.type === "none" && filterValue.value) {
      filterValue.value = "";
    }
  });

  onMount(() => {
    if (!filter.column) {
      filter.column = controller.getAllColumns()[0]?.id;
    }
    if (!filter.value) {
      filter.value = "";
    }
  });

  function toggleSimple() {
    if (simple) {
      const source = toSQL(filter);
      filter.custom = source;
      syncCustomDraft(source);
    } else {
      const validation = validateFilterPredicate(customDraft);
      customError = validation.error;
      if (!validation.valid) {
        return;
      }
      const predicate = validation.predicate;
      if (isFilterLine(predicate) && !predicate.custom) {
        filter.column = predicate.column;
        filter.op = predicate.op;
        filter.value = predicate.value;
        filter.custom = null;
      } else {
        new Notice(
          `This filter cannot be represented by the simple filter builder`,
        );
      }
    }
  }

  $effect(() => {
    const nextValue = isValid
      ? simple
        ? { ...filter, custom: null }
        : (filter.custom ?? "")
      : "";

    if (typeof nextValue === "string") {
      if (value !== nextValue) {
        value = nextValue;
      }
      return;
    }

    if (!isFilterLine(value) || !equalFilterLines(value, nextValue)) {
      value = nextValue;
    }
  });
  let columnsIsOpen: boolean = $state(false);
</script>

<div class="filter-row bases-style-flex-60fbb7 bases-style-items-center-3960ff bases-style-gap-0-63a285">
  <span class="filter-row__label bases-style-min-w-4-5rem-00331a bases-style-pr-1-eda955 bases-style-text-right-308fc0"
    >{label}</span
  >
  <div class="filter-row__field">
    <div
      class={cn(
        "filter-row__controls bases-style-bg-background-e6f9e3 bases-style-flex-60fbb7 bases-style-min-h-9-968a1e bases-style-items-center-3960ff bases-style-rounded-md-421ac2 bases-style-border-2-65935d",
      )}
      data-invalid={customError !== null}
    >
    {#if simple}
      <Popover.Root bind:open={columnsIsOpen}>
        <Popover.Trigger>
          {#snippet child({ props }: { props: Record<string, any> })}
            <Button
              {...props}
              variant="outline"
              size="sm"
              class="bases-style-min-h-inherit-05c993 bases-style-h-auto-b8f0a0 bases-style-self-stretch-18069a bases-style-rounded-none-0c5e91 bases-style-rounded-l-md-9b2e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
            >
              <Icon name={[column?.icon ?? "lucide-file"]} />
              {column?.displayName}
              <ArrowUpDown />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="bases-style-w-max-2f935d bases-style-p-0-8a539c" align="start">
          <Command.Root>
            <Command.Input placeholder="Find or create" />
            <Command.List class="bases-style-p-1-eb6a3c">
              <Command.Empty>No results found.</Command.Empty>
              {#each controller.getAllColumns() as column (column.id)}
                <Command.Item
                  onSelect={() => {
                    filter.column = column.id;
                    columnsIsOpen = false;
                  }}
                >
                  <div
                    class={cn(
                      "bases-style-mr-2-d2347e bases-style-flex-60fbb7 bases-style-size-4-f7b5fa bases-style-items-center-3960ff bases-style-justify-center-86843c",
                      filter.column === column.id
                        ? ""
                        : "bases-style-opacity-50-0b8c50 [&_svg]:invisible",
                    )}
                  >
                    <CheckIcon class="bases-style-size-4-f7b5fa" />
                  </div>
                  <Icon name={[column?.icon ?? "lucide-info"]} />
                  <span>{column?.displayName}</span>
                  {#if !column?.id?.startsWith("note.")}
                    <Command.Shortcut class="bases-style-font-mono-0e6570 bases-style-text-0-75em-c425cc"
                      >{column?.id}</Command.Shortcut
                    >
                  {/if}
                </Command.Item>
              {/each}
            </Command.List>
          </Command.Root>
        </Popover.Content>
      </Popover.Root>
      <Select.Root type="single" bind:value={filter.op}>
        <Select.Trigger
          size="sm"
          data-bases-filter-control="operator-trigger"
          class="bases-style-bg-background-e6f9e3 bases-style-min-h-inherit-05c993 bases-style-h-auto-b8f0a0 bases-style-self-stretch-18069a bases-style-rounded-none-0c5e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
        >
          {filterValue?.label || filter.op}
        </Select.Trigger>
        <Select.Content
          align="start"
          data-bases-filter-control="operator-content"
        >
          <Select.Group>
            {#each filterTypes as filterType (filterType.value)}
              <Select.Item value={filterType.value} label={filterType.label}
                >{filterType.label}</Select.Item
              >
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
      <FilterEditor
        type={filterValue?.type ?? type}
        {controller}
        bind:value={filter.value}
      />
      <Button
        onclick={() => toggleSimple()}
        data-tooltip="Simple filter"
        aria-label="Use custom filter"
        variant="ghost"
        size="sm"
        class="bases-style-bg-background-e6f9e3 bases-style-min-h-inherit-05c993 bases-style-h-auto-b8f0a0 bases-style-self-stretch-18069a  bases-style-rounded-none-0c5e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
      >
        <CodeXML />
      </Button>
    {:else}
      <QueryEditor
        {controller}
        onBlur={updateCustomDraft}
        onDocChange={updateCustomDraft}
        bind:content={customDraft}
        invalid={customError !== null}
        describedBy={customError ? filterErrorId : undefined}
        class="bases-style-bg-background-e6f9e3 bases-style-h-full-668b21 grow bases-style-rounded-l-md-9b2e91 bases-style-border-none-4a5f0e bases-style-pl-1-6ad214 bases-style-outline-none-df37b1"
      />
      <Button
        onclick={() => toggleSimple()}
        data-tooltip="Simple filter"
        aria-label="Use simple filter"
        variant="ghost"
        size="sm"
        class="bases-style-min-h-inherit-05c993 bases-style-bg-background-e6f9e3 bases-style-h-auto-b8f0a0 bases-style-self-stretch-18069a bases-style-rounded-none-0c5e91 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
      >
        <FilterIcon />
      </Button>
    {/if}
    {#if deleteFilter}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Delete filter"
        class="bases-style-bg-background-e6f9e3 bases-style-min-h-inherit-05c993 bases-style-h-auto-b8f0a0 bases-style-self-stretch-18069a bases-style-rounded-none-0c5e91 bases-style-rounded-r-md-d4eb07 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
        onclick={() => deleteFilter()}
      >
        <Trash />
      </Button>
    {/if}
    </div>
    {#if customError}
      <p
        id={filterErrorId}
        class="filter-row__error"
        data-ui-part="filter-error"
        role="alert"
      >
        {customError}
      </p>
    {/if}
  </div>
</div>
