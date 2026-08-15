<script lang="ts" generics="TData, TValue">
  import Properties from "./components/column-visibility.svelte";
  import FilterComponent from "./components/filters/filter-root.svelte";
  import Sort from "./components/sort/sort-root.svelte";
  import Limit from "./components/limit.svelte";
  import { cn } from "@lapis-notes/api";
  import Views from "./components/views.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import Plus from "@lucide/svelte/icons/plus";
  import Search from "@lucide/svelte/icons/search";
  import { onMount } from "svelte";
  import type { QueryController } from "./bases.svelte";
  import { serializeResultsToCsv } from "./export-core";

  type DataTableProps<TData, TValue> = {
    controller: QueryController;
  };

  let { controller = $bindable() }: DataTableProps<TData, TValue> = $props();

  async function createFile() {
    await controller.view?.createFileForView();
  }

  function buildCsv() {
    const properties = controller.view?.config.getOrder() ?? [];
    return serializeResultsToCsv(
      controller.view?.data.data ?? [],
      properties,
      (propertyId) => controller.view.config.getDisplayName(propertyId),
    );
  }

  async function copyCsv() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(buildCsv());
  }

  function exportCsv() {
    if (typeof document === "undefined" || typeof URL === "undefined") return;
    const blob = new Blob([buildCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${controller.selectedView.name || "base"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  let show = $state(false);
  onMount(() => {
    setTimeout(() => {
      show = true;
    });
  });
</script>

<div
  class="bases-view__toolbar bases-style-flex-60fbb7 bases-style-flex-wrap-1eb5c6 bases-style-items-center-3960ff bases-style-justify-between-8ef226 bases-style-gap-1-44ee8b bases-style-px-2-d5eab2 bases-style-py-4-cb11fe"
  data-ui-component="bases-toolbar"
  data-ui-part="root"
>
  <div class="bases-style-flex-60fbb7 bases-style-flex-wrap-1eb5c6 bases-style-gap-1-44ee8b">
    <Views
      bind:show
      {controller}
      bind:value={
        () => controller.selectedView,
        (value) => (controller.selectedView = value)
      }
      bind:views={
        () => controller.doc.views, (views) => (controller.doc.views = views)
      }
    />
    <Limit
      bind:view={controller.selectedView}
      class={cn({
        "bases-view__toolbar-button--active":
          controller.selectedView.limit && controller.selectedView.limit > 0,
      })}
      count={controller.count}
      onCopyCsv={copyCsv}
      onExportCsv={exportCsv}
    />
  </div>
  <div class="bases-style-flex-60fbb7 bases-style-flex-wrap-1eb5c6 bases-style-gap-1-44ee8b">
    <Button
      variant="outline"
      size="sm"
      class={cn("bases-style-h-8-ed8a5d", {
        "bases-view__toolbar-button--active":
          controller.searchPanelOpen || !!controller.searchQuery.trim(),
      })}
      onclick={() => controller.toggleSearchPanel()}
    >
      <Search />
      <span>Search</span>
    </Button>
    <Sort
      bind:orderBy={
        () => controller.selectedView.sort,
        (orderBy) => (controller.selectedView.sort = orderBy)
      }
      {controller}
      class={cn({
        "bases-view__toolbar-button--active":
          controller.selectedView.sort.length ||
          !!controller.selectedView.groupBy?.property,
      })}
    />
    <FilterComponent
      bind:currentFilter={
        () => controller.selectedView.filter,
        (currentFilter) => (controller.selectedView.filter = currentFilter)
      }
      bind:globalFilter={
        () => controller.doc.filters,
        (globalFilter) => (controller.doc.filters = globalFilter)
      }
      {controller}
    />
    <Properties
      bind:order={
        () => controller.selectedView.order,
        (order) => (controller.selectedView.order = order)
      }
      bind:formulas={
        () => controller.formulas,
        (formulas) => (controller.formulas = formulas)
      }
      bind:properties={
        () => controller.properties,
        (properties) => (controller.properties = properties)
      }
      {controller}
    />
    <Button variant="outline" size="sm" class="bases-style-h-8-ed8a5d" onclick={createFile}>
      <Plus />
      <span>New</span>
    </Button>
  </div>
</div>
