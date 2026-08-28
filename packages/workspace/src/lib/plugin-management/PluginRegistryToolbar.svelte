<script lang="ts">
  import SlidersHorizontal from "@lucide/svelte/icons/sliders-horizontal";
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Select from "@lapismd/design-core/shadcn/select";

  type ToolbarTab = "installed" | "browse" | "updates";
  type Option = { value: string; label: string };

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

  const platformOptions: Option[] = [
    { value: "all", label: "All platforms" },
    { value: "web", label: "Web" },
    { value: "electron", label: "Electron" },
    { value: "desktop", label: "Desktop" },
  ];
  const channelOptions: Option[] = [
    { value: "all", label: "All channels" },
    { value: "official", label: "Official" },
    { value: "community", label: "Community" },
  ];
  const installedOptions: Option[] = [
    { value: "all", label: "Any install state" },
    { value: "available", label: "Available" },
    { value: "installed", label: "Installed" },
  ];
  const enabledOptions: Option[] = [
    { value: "all", label: "Any status" },
    { value: "enabled", label: "Enabled" },
    { value: "disabled", label: "Disabled" },
    { value: "revoked", label: "Revoked" },
    { value: "restart", label: "Restart required" },
  ];
  const provenanceOptions: Option[] = [
    { value: "all", label: "Any provenance" },
    { value: "official", label: "Official" },
    { value: "community", label: "Community" },
    { value: "manual", label: "Manual" },
    { value: "development", label: "Development" },
  ];
  const updateOptions: Option[] = [
    { value: "all", label: "Any update status" },
    { value: "ready", label: "Ready" },
    { value: "incompatible", label: "Incompatible" },
    { value: "revoked", label: "Revoked" },
  ];

  function labelFor(options: Option[], value: string): string {
    return options.find((option) => option.value === value)?.label ?? value;
  }
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
    onClearAll={onreset}
  >
    {#snippet filters()}
      <div class="lapis-plugin-registry-toolbar__controls">
        {#if tab === "browse"}
          <Select.Root type="single" bind:value={platform}>
            <Select.Trigger size="sm" aria-label="Filter by platform">{labelFor(platformOptions, platform)}</Select.Trigger>
            <Select.Content><Select.Group>{#each platformOptions as item}<Select.Item value={item.value} label={item.label} />{/each}</Select.Group></Select.Content>
          </Select.Root>
          <Select.Root type="single" bind:value={channel}>
            <Select.Trigger size="sm" aria-label="Filter by channel">{labelFor(channelOptions, channel)}</Select.Trigger>
            <Select.Content><Select.Group>{#each channelOptions as item}<Select.Item value={item.value} label={item.label} />{/each}</Select.Group></Select.Content>
          </Select.Root>
          <Select.Root type="single" bind:value={category}>
            <Select.Trigger size="sm" aria-label="Filter by category">{category === "all" ? "All categories" : category}</Select.Trigger>
            <Select.Content><Select.Group><Select.Item value="all" label="All categories" />{#each categories as item}<Select.Item value={item} label={item} />{/each}</Select.Group></Select.Content>
          </Select.Root>
          <Select.Root type="single" bind:value={installedState}>
            <Select.Trigger size="sm" aria-label="Filter by installed state">{labelFor(installedOptions, installedState)}</Select.Trigger>
            <Select.Content><Select.Group>{#each installedOptions as item}<Select.Item value={item.value} label={item.label} />{/each}</Select.Group></Select.Content>
          </Select.Root>
          <Button.Root
            size="sm"
            variant={compatibleOnly ? "secondary" : "outline"}
            aria-pressed={compatibleOnly}
            onclick={() => (compatibleOnly = !compatibleOnly)}
          ><SlidersHorizontal />Compatible only</Button.Root>
          <Select.Root type="single" bind:value={sort}>
            <Select.Trigger size="sm" aria-label="Sort Browse plugins">{sort === "recent" ? "Recently updated" : "Name"}</Select.Trigger>
            <Select.Content><Select.Group><Select.Item value="name" label="Name" /><Select.Item value="recent" label="Recently updated" /></Select.Group></Select.Content>
          </Select.Root>
        {:else if tab === "installed"}
          <Select.Root type="single" bind:value={enabledState}>
            <Select.Trigger size="sm" aria-label="Filter installed status">{labelFor(enabledOptions, enabledState)}</Select.Trigger>
            <Select.Content><Select.Group>{#each enabledOptions as item}<Select.Item value={item.value} label={item.label} />{/each}</Select.Group></Select.Content>
          </Select.Root>
          <Select.Root type="single" bind:value={provenance}>
            <Select.Trigger size="sm" aria-label="Filter installed provenance">{labelFor(provenanceOptions, provenance)}</Select.Trigger>
            <Select.Content><Select.Group>{#each provenanceOptions as item}<Select.Item value={item.value} label={item.label} />{/each}</Select.Group></Select.Content>
          </Select.Root>
          <Select.Root type="single" bind:value={sort}>
            <Select.Trigger size="sm" aria-label="Sort installed plugins">{sort === "recent" ? "Recently updated" : "Name"}</Select.Trigger>
            <Select.Content><Select.Group><Select.Item value="name" label="Name" /><Select.Item value="recent" label="Recently updated" /></Select.Group></Select.Content>
          </Select.Root>
        {:else}
          <Select.Root type="single" bind:value={updateState}>
            <Select.Trigger size="sm" aria-label="Filter update status">{labelFor(updateOptions, updateState)}</Select.Trigger>
            <Select.Content><Select.Group>{#each updateOptions as item}<Select.Item value={item.value} label={item.label} />{/each}</Select.Group></Select.Content>
          </Select.Root>
          <Select.Root type="single" bind:value={sort}>
            <Select.Trigger size="sm" aria-label="Sort updates">{sort === "name" ? "Name" : "Status first"}</Select.Trigger>
            <Select.Content><Select.Group><Select.Item value="status" label="Status first" /><Select.Item value="name" label="Name" /></Select.Group></Select.Content>
          </Select.Root>
        {/if}
      </div>
    {/snippet}
  </SearchFilterBar>
  <div class="lapis-plugin-registry-toolbar__summary" aria-live="polite">
    <span>{resultCount} {resultCount === 1 ? "result" : "results"}</span>
    <span>{filterCount} {filterCount === 1 ? "active filter" : "active filters"}</span>
  </div>
</div>
