<script lang="ts">
  import SlidersHorizontal from "@lucide/svelte/icons/sliders-horizontal";
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import {
    FilterCommandPicker,
    type FilterCommandOption,
  } from "@lapismd/design-core/forms";
  import * as Button from "@lapismd/design-core/shadcn/button";

  type ToolbarTab = "installed" | "browse" | "updates";

  let {
    tab,
    search = $bindable(""),
    platform = $bindable("all"),
    channel = $bindable("all"),
    category = $bindable("all"),
    installedState = $bindable("all"),
    compatibleOnly = $bindable(false),
    enabledState = $bindable("all"),
    provenance = $bindable("all"),
    updateState = $bindable("all"),
    sort = $bindable("name"),
    categories = [],
    filterCount,
    resultCount,
    onreset,
  }: {
    tab: ToolbarTab;
    search?: string;
    platform?: string;
    channel?: string;
    category?: string;
    installedState?: string;
    compatibleOnly?: boolean;
    enabledState?: string;
    provenance?: string;
    updateState?: string;
    sort?: string;
    categories?: string[];
    filterCount: number;
    resultCount: number;
    onreset: () => void;
  } = $props();

  let filtersExpanded = $state(false);

  const platformOptions: FilterCommandOption[] = [
    { value: "all", label: "All platforms", description: "Show every supported host." },
    { value: "web", label: "Web", description: "Runs in browser-hosted Lapis apps." },
    { value: "desktop", label: "Desktop", description: "Runs in supported desktop hosts." },
  ];
  const channelOptions: FilterCommandOption[] = [
    { value: "all", label: "All channels", description: "Official and community releases." },
    { value: "official", label: "Official", description: "Curated and verified by the Lapis registry." },
    { value: "community", label: "Community", description: "Published by community maintainers." },
  ];
  const installedOptions: FilterCommandOption[] = [
    { value: "all", label: "Any install state" },
    { value: "available", label: "Available", description: "Not currently included or installed." },
    { value: "installed", label: "Installed", description: "Included in the profile or vault." },
  ];
  const enabledOptions: FilterCommandOption[] = [
    { value: "all", label: "Any status" },
    { value: "enabled", label: "Enabled" },
    { value: "disabled", label: "Disabled" },
    { value: "revoked", label: "Revoked" },
    { value: "restart", label: "Restart required" },
  ];
  const provenanceOptions: FilterCommandOption[] = [
    { value: "all", label: "Any provenance" },
    { value: "official", label: "Official" },
    { value: "community", label: "Community" },
    { value: "manual", label: "Manual" },
    { value: "development", label: "Development" },
  ];
  const updateOptions: FilterCommandOption[] = [
    { value: "all", label: "Any update status" },
    { value: "ready", label: "Ready" },
    { value: "incompatible", label: "Incompatible" },
    { value: "revoked", label: "Revoked" },
  ];

  const browseSortOptions: FilterCommandOption[] = [
    { value: "name", label: "Name" },
    { value: "recent", label: "Recently updated" },
    {
      value: "downloads",
      label: "Most downloaded",
      description: "Highest approximate download requests during the last 30 days.",
    },
  ];
  const installedSortOptions: FilterCommandOption[] = [
    { value: "name", label: "Name" },
    { value: "recent", label: "Recently updated" },
  ];
  const updateSortOptions: FilterCommandOption[] = [
    { value: "status", label: "Status first" },
    { value: "name", label: "Name" },
  ];
  let categoryOptions = $derived<FilterCommandOption[]>([
    { value: "all", label: "All categories" },
    ...categories.map((item) => ({ value: item, label: item })),
  ]);
</script>

<div
  class="lapis-plugin-registry-toolbar"
  data-ui-component="plugin-registry-toolbar"
  data-toolbar-tab={tab}
>
  <SearchFilterBar
    value={search}
    placeholder={`Search ${tab === "browse" ? "plugins" : tab}`}
    ariaLabel={`Search ${tab}`}
    showFilterToggle
    bind:filtersExpanded
    showClearAll={filterCount > 0}
    clearAllDisabled={filterCount === 0}
    clearAllLabel="Reset search and filters"
    expandFiltersLabel={`Show ${tab} filters`}
    collapseFiltersLabel={`Hide ${tab} filters`}
    onValueChange={(next) => (search = next)}
    onClearSearch={() => {
      search = "";
    }}
    onClearAll={onreset}
  >
    {#snippet filters()}
      <div class="lapis-plugin-registry-toolbar__controls">
        {#if tab === "browse"}
          <FilterCommandPicker label="Platform" ariaLabel="Filter by platform" options={platformOptions} value={platform} onChange={(next) => { platform = next; }} />
          <FilterCommandPicker label="Channel" ariaLabel="Filter by channel" options={channelOptions} value={channel} onChange={(next) => { channel = next; }} />
          <FilterCommandPicker label="Category" ariaLabel="Filter by category" options={categoryOptions} value={category} onChange={(next) => { category = next; }} />
          <FilterCommandPicker label="Installed" ariaLabel="Filter by installed state" options={installedOptions} value={installedState} onChange={(next) => { installedState = next; }} />
          <Button.Root
            size="sm"
            variant={compatibleOnly ? "secondary" : "outline"}
            aria-pressed={compatibleOnly}
            onclick={() => (compatibleOnly = !compatibleOnly)}
          ><SlidersHorizontal data-icon="inline-start" />Compatible only</Button.Root>
          <FilterCommandPicker label="Sort" ariaLabel="Sort Browse plugins" options={browseSortOptions} value={sort} onChange={(next) => { sort = next; }} />
        {:else if tab === "installed"}
          <FilterCommandPicker label="Status" ariaLabel="Filter installed status" options={enabledOptions} value={enabledState} onChange={(next) => { enabledState = next; }} />
          <FilterCommandPicker label="Provenance" ariaLabel="Filter installed provenance" options={provenanceOptions} value={provenance} onChange={(next) => { provenance = next; }} />
          <FilterCommandPicker label="Sort" ariaLabel="Sort installed plugins" options={installedSortOptions} value={sort} onChange={(next) => { sort = next; }} />
        {:else}
          <FilterCommandPicker label="Status" ariaLabel="Filter update status" options={updateOptions} value={updateState} onChange={(next) => { updateState = next; }} />
          <FilterCommandPicker label="Sort" ariaLabel="Sort updates" options={updateSortOptions} value={sort} onChange={(next) => { sort = next; }} />
        {/if}
      </div>
    {/snippet}
  </SearchFilterBar>
  <div class="lapis-plugin-registry-toolbar__summary" aria-live="polite">
    <span>{resultCount} {resultCount === 1 ? "result" : "results"}</span>
    <span>{filterCount} {filterCount === 1 ? "active filter" : "active filters"}</span>
  </div>
</div>
