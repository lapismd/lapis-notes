<script lang="ts">
  import * as Select from "@lapismd/design-core/shadcn/select";
  import {
    filterGroupType,
    filterGroupValues,
    isFilterGroup,
    isFilterLine,
    type Filters,
  } from "../..";
  import FilterRow from "./filter-row.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import Self from "./filter-group.svelte";
  import { cn } from "@lapis-notes/api";
  import Trash from "@lucide/svelte/icons/trash-2";
  import type { QueryController } from "../../bases.svelte";

  let {
    filter = $bindable(),
    controller,
    class: className,
    deleteFilterGroup,
  }: {
    filter: Filters;
    controller: QueryController;
    class?: string;
    deleteFilterGroup?: () => void;
  } = $props();
  const filterTypes = [
    { label: "All of the following are true", value: "and" },
    { label: "Any of the following are true", value: "or" },
    { label: "None of the following are true", value: "not" },
  ];
  let filterType = $derived(filterGroupType(filter));
  let filterValues = $derived(filterGroupValues(filter));
  let empty: string = $state("");

  $effect(() => {
    if (!filterValues.length && empty) {
      filterValues.push(empty);
      empty = "";
    }
  });

  const triggerContent = $derived(
    filterTypes.find((f) => f.value === filterType)?.label ??
      "Select a filter type",
  );

  function addFilter() {
    if (!filterValues.length) {
      filterValues.push(empty);
      empty = "";
    }
    filterValues.push("");
  }

  function addGroup() {
    filterValues.push({ and: [""] });
  }

  function deleteFilter(index: number) {
    filterValues.splice(index, 1);
  }

  function getFilterType() {
    return filterType;
  }

  function setFilterType(newValue: string) {
    (filter as any) = { [newValue]: filterValues };
  }
</script>

<div class={cn("filter-group", className)}>
  <div class="filter-group-header bases-style-flex-60fbb7 bases-style-items-center-3960ff bases-style-justify-between-8ef226">
    <Select.Root type="single" bind:value={getFilterType, setFilterType}>
      <Select.Trigger data-bases-filter-control="group-type-trigger">
        {triggerContent}
      </Select.Trigger>
      <Select.Content
        align="start"
        data-bases-filter-control="group-type-content"
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
    {#if deleteFilterGroup}
      <Button
        variant="ghost"
        size="sm"
        class="bases-style-h-8-ed8a5d bases-style-rounded-none-0c5e91 bases-style-rounded-r-md-d4eb07 bases-style-border-none-4a5f0e bases-style-shadow-none-ad47d1 bases-style-outline-none-df37b1"
        onclick={() => deleteFilterGroup?.()}
      >
        <Trash />
      </Button>
    {/if}
  </div>
  <div class="filter-group-statements bases-style-grid-f3c543 bases-style-gap-2-77a2a2 bases-style-pt-1-6b7d6e">
    {#if !filterValues.length}
      <FilterRow
        label="where"
        {controller}
        bind:value={empty}
        deleteFilter={() => {
          empty = "";
        }}
      />
    {/if}
    {#each filterValues as predicate, i}
      {#if typeof predicate === "string" || isFilterLine(predicate)}
        <FilterRow
          label={i === 0 ? "where" : filterType}
          {controller}
          bind:value={filterValues[i] as any}
          deleteFilter={() => deleteFilter(i)}
        />
      {:else if isFilterGroup(predicate)}
        <Self
          bind:filter={filterValues[i] as Filters}
          {controller}
          class={cn("bases-style-bg-accent-40-fb8b4c bases-style-m-2-e9a778 bases-style-rounded-sm-36d446 border bases-style-p-2-7660b4")}
          deleteFilterGroup={() => deleteFilter(i)}
        />
      {/if}
    {/each}
  </div>
  <div class="filter-group-actions bases-style-mt-2-50d0d2">
    <Button size="sm" variant="ghost" onclick={(evt) => addFilter()}>
      <PlusIcon /> Add Filter
    </Button>
    <Button size="sm" variant="ghost" onclick={(evt) => addGroup()}>
      <PlusIcon /> Add Filter Group
    </Button>
  </div>
</div>
