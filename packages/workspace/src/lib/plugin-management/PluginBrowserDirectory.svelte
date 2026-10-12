<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Breadcrumb from "@lapismd/design-core/shadcn/breadcrumb";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { AppShell } from "@lapismd/design-core/shell";
  import { WorkspaceSidebarToggle } from "@lapismd/design-core/workspace/sidebar-toggle";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import ListIcon from "@lucide/svelte/icons/list";
  import PackageIcon from "@lucide/svelte/icons/package";
  import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";
  import XIcon from "@lucide/svelte/icons/x";
  import FilterXIcon from "@lucide/svelte/icons/filter-x";
  import type { Component } from "svelte";

  import {
    categoriesFor as collectRegistryCategories,
    filterPlugins as filterRegistryEntries,
    titleCase as titleCaseRegistryValue,
    type PluginDirectoryState as RegistryDirectoryState,
  } from "./plugin-browser-model";
  import CommunityChip from "./community-presentation/CommunityChip.svelte";
  import { registryFilterIcon } from "./community-presentation/registry-filter-icons.js";
  import RegistryPluginCard from "./PluginBrowserCard.svelte";

  import type {
    PluginCatalogEntry as RegistryCatalogEntry,
    PluginCatalogStatus as RegistryCatalogStatus,
  } from "@lapis-notes/api";
  import { registryStatusLabel } from "./community-presentation/model-adapter";
  import type { PluginRegistryController } from "./plugin-registry-controller.svelte";
  let {
    registry,
    compact = false,
    filtersOpen = false,
    ontogglefilters,
    onhome,
    contentRef = $bindable(null),
    directoryState,
    installedIds,
    updateIds,
    downloads,
    onopen: onOpenPlugin,
    onchange,
  }: {
    registry: PluginRegistryController;
    compact?: boolean;
    filtersOpen?: boolean;
    ontogglefilters: (event: MouseEvent) => void;
    onhome: () => void;
    contentRef?: HTMLDivElement | null;
    directoryState: RegistryDirectoryState;
    installedIds: Set<string>;
    updateIds: ReadonlySet<string>;
    downloads: (id: string) => number;
    onopen: (plugin: RegistryCatalogEntry) => void;
    onchange: (state: RegistryDirectoryState) => void;
  } = $props();
  const plugins = $derived(registry.catalogEntries);
  let bodyElement = $state<HTMLElement | null>(null);
  let filterElement = $state<HTMLElement | null>(null);
  let filterWidth = $state<number>();
  let resizePointerId = $state<number | null>(null);
  let resizeStartX = 0;
  let resizeStartWidth = 0;
  let typeOpen = $state(true);
  let statusOpen = $state(true);
  let categoryOpen = $state(true);
  let platformOpen = $state(true);
  let otherOpen = $state(true);
  let categoriesExpanded = $state(false);
  const results = $derived(
    filterRegistryEntries(
      plugins,
      directoryState,
      installedIds,
      downloads,
      updateIds,
    ),
  );
  const categories = $derived(collectRegistryCategories(plugins));
  const platforms = $derived(
    [...new Set(plugins.flatMap((plugin) => plugin.platforms))].toSorted(),
  );
  const statuses = $derived<RegistryCatalogStatus[]>([
    "active",
    "pending",
    "deprecated",
    "disabled",
    "revoked",
  ]);
  const activeFilterCount = $derived(
    directoryState.categories.length +
      directoryState.platforms.length +
      directoryState.statuses.length +
      (directoryState.officialOnly ? 1 : 0) +
      (directoryState.updatesOnly ? 1 : 0),
  );
  const resizeMinimum = 192;
  const hoverScrollbarProps = { scrollbarVisibility: "hover" } as const;
  const sortLabels: Record<RegistryDirectoryState["sort"], string> = {
    name: "Name",
    new: "New",
    updated: "Recently updated",
    status: "Status",
    downloads: "Most downloaded",
  };
  const resizeMaximum = $derived(resizeBounds().max);
  const presentedFilterWidth = $derived(
    Math.round(
      filterWidth ?? filterElement?.getBoundingClientRect().width ?? 224,
    ),
  );

  function replaceState(next: Partial<RegistryDirectoryState>): void {
    onchange({ ...directoryState, ...next });
  }

  function toggleListValue(
    key: "categories" | "platforms" | "statuses",
    value: string,
  ): void {
    const current = directoryState[key];
    replaceState({
      [key]: current.includes(value)
        ? current.filter((candidate) => candidate !== value)
        : [...current, value],
    });
  }

  function resetFilters(): void {
    replaceState({
      categories: [],
      platforms: [],
      statuses: [],
      officialOnly: false,
      updatesOnly: false,
    });
  }

  function countFor(
    predicate: (plugin: RegistryCatalogEntry) => boolean,
  ): number {
    return plugins.filter(predicate).length;
  }

  function resizeBounds(): { min: number; max: number } {
    const available = (bodyElement?.clientWidth ?? 768) - 384;
    return {
      min: resizeMinimum,
      max: Math.max(resizeMinimum, Math.min(384, available)),
    };
  }

  function clampFilterWidth(width: number): number {
    const { min, max } = resizeBounds();
    return Math.min(max, Math.max(min, width));
  }

  function currentFilterWidth(): number {
    return filterWidth ?? filterElement?.getBoundingClientRect().width ?? 224;
  }

  function beginResize(event: PointerEvent): void {
    if (event.button !== 0) return;
    resizePointerId = event.pointerId;
    resizeStartX = event.clientX;
    resizeStartWidth = currentFilterWidth();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveResize(event: PointerEvent): void {
    if (event.pointerId !== resizePointerId) return;
    filterWidth = clampFilterWidth(
      resizeStartWidth + event.clientX - resizeStartX,
    );
  }

  function finishResize(event: PointerEvent): void {
    if (event.pointerId !== resizePointerId) return;
    resizePointerId = null;
    const handle = event.currentTarget as HTMLElement;
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
  }

  function resizeWithKeyboard(event: KeyboardEvent): void {
    const { min, max } = resizeBounds();
    let nextWidth = currentFilterWidth();
    if (event.key === "ArrowLeft") nextWidth -= 16;
    else if (event.key === "ArrowRight") nextWidth += 16;
    else if (event.key === "Home") nextWidth = min;
    else if (event.key === "End") nextWidth = max;
    else return;
    event.preventDefault();
    filterWidth = clampFilterWidth(nextWidth);
  }

  function filterIcon(id: string, selected: boolean): Component {
    return selected ? CheckIcon : registryFilterIcon(id);
  }
</script>

{#snippet filterMark(id: string, selected = false)}
  {@const Icon = filterIcon(id, selected)}
  <span
    class="registry-directory__filter-icon"
    data-filter-icon={selected ? "check" : id}
  >
    <Icon aria-hidden="true" />
  </span>
{/snippet}

{#snippet filters()}
  <div class="registry-directory__filter-groups">
    <Collapsible.Root bind:open={typeOpen} class="registry-directory__group">
      <h2>
        <Collapsible.Trigger
          class="registry-directory__group-trigger"
          aria-label={`${typeOpen ? "Collapse" : "Expand"} Type filters`}
        >
          <span>Type</span>
          <ChevronDownIcon aria-hidden="true" />
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Content class="registry-directory__group-content">
        <button
          type="button"
          class="registry-directory__filter selected"
          aria-pressed="true"
        >
          <span>{@render filterMark("package")} Plugins</span>
          <span>{plugins.length}</span>
        </button>
      </Collapsible.Content>
    </Collapsible.Root>

    <Collapsible.Root bind:open={statusOpen} class="registry-directory__group">
      <h2>
        <Collapsible.Trigger
          class="registry-directory__group-trigger"
          aria-label={`${statusOpen ? "Collapse" : "Expand"} Status filters`}
        >
          <span>Status</span>
          <ChevronDownIcon aria-hidden="true" />
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Content class="registry-directory__group-content">
        {#each statuses as status}
          <button
            type="button"
            class="registry-directory__filter"
            class:selected={directoryState.statuses.includes(status)}
            aria-pressed={directoryState.statuses.includes(status)}
            onclick={() => toggleListValue("statuses", status)}
          >
            <span>
              {@render filterMark(
                status,
                directoryState.statuses.includes(status),
              )}
              {registryStatusLabel(status)}
            </span>
            <span
              >{countFor(
                (plugin) => (plugin.status ?? "active") === status,
              )}</span
            >
          </button>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <Collapsible.Root
      bind:open={categoryOpen}
      class="registry-directory__group"
    >
      <h2>
        <Collapsible.Trigger
          class="registry-directory__group-trigger"
          aria-label={`${categoryOpen ? "Collapse" : "Expand"} Category filters`}
        >
          <span>Categories</span>
          <ChevronDownIcon aria-hidden="true" />
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Content class="registry-directory__group-content">
        {#each categories as category, index (category.id)}
          {#if categoriesExpanded || index < 8}
            <button
              type="button"
              class="registry-directory__filter"
              class:selected={directoryState.categories.includes(category.id)}
              aria-pressed={directoryState.categories.includes(category.id)}
              onclick={() => toggleListValue("categories", category.id)}
            >
              <span>
                {@render filterMark(
                  category.id,
                  directoryState.categories.includes(category.id),
                )}
                {category.label}
              </span>
              <span>{category.count}</span>
            </button>
          {/if}
        {/each}
        {#if categories.length > 8}
          <button
            class="registry-directory__show-more"
            type="button"
            aria-expanded={categoriesExpanded}
            onclick={() => (categoriesExpanded = !categoriesExpanded)}
          >
            {categoriesExpanded ? "Show less" : "Show more"}
          </button>
        {/if}
      </Collapsible.Content>
    </Collapsible.Root>

    <Collapsible.Root
      bind:open={platformOpen}
      class="registry-directory__group"
    >
      <h2>
        <Collapsible.Trigger
          class="registry-directory__group-trigger"
          aria-label={`${platformOpen ? "Collapse" : "Expand"} Platform filters`}
        >
          <span>Platforms</span>
          <ChevronDownIcon aria-hidden="true" />
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Content class="registry-directory__group-content">
        {#each platforms as platform}
          <button
            type="button"
            class="registry-directory__filter"
            class:selected={directoryState.platforms.includes(platform)}
            aria-pressed={directoryState.platforms.includes(platform)}
            onclick={() => toggleListValue("platforms", platform)}
          >
            <span>
              {@render filterMark(
                platform,
                directoryState.platforms.includes(platform),
              )}
              {titleCaseRegistryValue(platform)}
            </span>
            <span>
              {countFor((plugin) => plugin.platforms.includes(platform))}
            </span>
          </button>
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>

    <Collapsible.Root bind:open={otherOpen} class="registry-directory__group">
      <h2>
        <Collapsible.Trigger
          class="registry-directory__group-trigger"
          aria-label={`${otherOpen ? "Collapse" : "Expand"} Other filters`}
        >
          <span>Other</span>
          <ChevronDownIcon aria-hidden="true" />
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Content class="registry-directory__group-content">
        <button
          type="button"
          class="registry-directory__filter"
          class:selected={directoryState.updatesOnly}
          aria-pressed={directoryState.updatesOnly}
          onclick={() =>
            replaceState({ updatesOnly: !directoryState.updatesOnly })}
        >
          <span
            >{@render filterMark(
              "updates",
              directoryState.updatesOnly,
            )}Updates</span
          >
          <span>{countFor((plugin) => updateIds.has(plugin.id))}</span>
        </button>

        <button
          type="button"
          class="registry-directory__filter"
          class:selected={directoryState.officialOnly}
          aria-pressed={directoryState.officialOnly}
          onclick={() =>
            replaceState({ officialOnly: !directoryState.officialOnly })}
        >
          <span>
            {@render filterMark("official", directoryState.officialOnly)}
            Official
          </span>
          <span>{countFor((plugin) => plugin.channel === "official")}</span>
        </button>
      </Collapsible.Content>
    </Collapsible.Root>
  </div>
{/snippet}

{#snippet filterToggle()}
  <WorkspaceSidebarToggle
    side="left"
    label={filtersOpen ? "Hide plugin filters" : "Show plugin filters"}
    size="small"
    expanded={filtersOpen}
    onSelect={ontogglefilters}
  />
{/snippet}

<AppShell.Body
  element="section"
  bind:ref={bodyElement}
  layout="regions"
  label="Plugin directory"
  class="registry-directory"
  style={filterWidth === undefined
    ? undefined
    : `--ui-shell-body-sidebar-width: ${filterWidth}px`}
>
  <AppShell.Body.Sidebar
    {...hoverScrollbarProps}
    bind:ref={filterElement}
    panelId="registry-filters"
    side="left"
    label="Plugin filters"
    mobileLabel="Plugin filters"
    class="registry-directory__filters-region"
  >
    <div class="registry-directory__filters">
      <div class="registry-directory__filters-header">
        <strong>Filters</strong>
        {#if activeFilterCount > 0}
          <button type="button" onclick={resetFilters}>Clear</button>
        {/if}
      </div>
      {@render filters()}
    </div>
  </AppShell.Body.Sidebar>

  {#if !compact}<button
      type="button"
      class="registry-directory__resize-handle"
      data-resizing={resizePointerId === null ? undefined : ""}
      data-min-width={resizeMinimum}
      data-max-width={resizeMaximum}
      data-current-width={presentedFilterWidth}
      aria-label="Resize plugin filters panel"
      title="Drag to resize. Double-click to reset width."
      onpointerdown={beginResize}
      onpointermove={moveResize}
      onpointerup={finishResize}
      onpointercancel={finishResize}
      ondblclick={() => (filterWidth = undefined)}
      onkeydown={resizeWithKeyboard}
    >
      <span aria-hidden="true"></span>
    </button>{/if}

  <div class="registry-directory__main">
    <nav
      class="registry-directory__heading"
      aria-label="Plugin directory controls"
      data-compact={compact || undefined}
    >
      {#if compact}
        <div class="registry-directory__path">
          {@render filterToggle()}
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Link
                  href="#/registry"
                  onclick={(event) => {
                    event.preventDefault();
                    onhome();
                  }}>Registry</Breadcrumb.Link
                >
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item
                ><Breadcrumb.Page>Plugins</Breadcrumb.Page></Breadcrumb.Item
              >
            </Breadcrumb.List>
          </Breadcrumb.Root>
        </div>
      {/if}
      <div class="registry-directory__tools" aria-label="Result controls">
        <div class="registry-directory__view" aria-label="View mode">
          <Button
            type="button"
            size="sm"
            variant={directoryState.view === "list" ? "secondary" : "ghost"}
            aria-pressed={directoryState.view === "list"}
            onclick={() => replaceState({ view: "list" })}
          >
            <ListIcon data-icon="inline-start" aria-hidden="true" /> List
          </Button>
          <Button
            type="button"
            size="sm"
            variant={directoryState.view === "grid" ? "secondary" : "ghost"}
            aria-pressed={directoryState.view === "grid"}
            onclick={() => replaceState({ view: "grid" })}
          >
            <LayoutGridIcon data-icon="inline-start" aria-hidden="true" /> Cards
          </Button>
        </div>
        <Select.Root
          type="single"
          value={directoryState.sort}
          onValueChange={(value) => {
            if (value) {
              replaceState({ sort: value as RegistryDirectoryState["sort"] });
            }
          }}
        >
          <Select.Trigger
            size="sm"
            class="registry-directory__sort-trigger"
            aria-label="Sort plugins"
            role="combobox"
          >
            <span class="registry-directory__sort-label"
              >{sortLabels[directoryState.sort]}</span
            >
          </Select.Trigger>
          <Select.Content aria-label="Sort plugins">
            <Select.Group>
              {#each Object.entries(sortLabels) as [value, label] (value)}
                <Select.Item {value} {label}>{label}</Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>
    </nav>
    <AppShell.Body.Content
      bind:ref={contentRef}
      {...hoverScrollbarProps}
      label="Plugin directory results"
      class="registry-directory__results-region"
    >
      <section class="registry-directory__results">
        <div class="registry-directory__search" data-ui-part="registry-search">
          <p aria-live="polite">
            {results.length}
            {results.length === 1 ? "result" : "results"}
          </p>
          <Input
            value={directoryState.query}
            aria-label="Search registry plugins"
            placeholder="Search plugins"
            oninput={(event) =>
              replaceState({ query: event.currentTarget.value })}
          />
        </div>

        {#if activeFilterCount > 0}
          <div
            class="registry-directory__active-filters"
            aria-label="Active filters"
          >
            {#each directoryState.categories as value}
              <CommunityChip
                variant="muted"
                ariaLabel={`Remove ${titleCaseRegistryValue(value)} filter`}
                onclick={() => toggleListValue("categories", value)}
                >{titleCaseRegistryValue(value)}
                <XIcon
                  data-icon="inline-end"
                  aria-hidden="true"
                /></CommunityChip
              >
            {/each}
            {#each directoryState.platforms as value}
              <CommunityChip
                variant="muted"
                onclick={() => toggleListValue("platforms", value)}
                >{titleCaseRegistryValue(value)}
                <XIcon
                  data-icon="inline-end"
                  aria-hidden="true"
                /></CommunityChip
              >
            {/each}
            {#each directoryState.statuses as value}
              <CommunityChip
                variant="muted"
                onclick={() => toggleListValue("statuses", value)}
                >{registryStatusLabel(value)}
                <XIcon
                  data-icon="inline-end"
                  aria-hidden="true"
                /></CommunityChip
              >
            {/each}
            {#if directoryState.officialOnly}
              <CommunityChip
                variant="muted"
                onclick={() => replaceState({ officialOnly: false })}
                >Official
                <XIcon
                  data-icon="inline-end"
                  aria-hidden="true"
                /></CommunityChip
              >
            {/if}
            {#if directoryState.updatesOnly}
              <CommunityChip
                variant="muted"
                ariaLabel="Remove Updates filter"
                onclick={() => replaceState({ updatesOnly: false })}
              >
                Updates <XIcon data-icon="inline-end" aria-hidden="true" />
              </CommunityChip>
            {/if}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <Button
                      {...props}
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      class="registry-directory__clear-all"
                      aria-label="Clear all filters"
                      onclick={resetFilters}
                    >
                      <FilterXIcon
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                    </Button>
                  {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>Clear all filters</Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        {/if}

        {#if results.length === 0}
          <Empty.Root class="registry-directory__empty">
            <Empty.Header>
              <Empty.Media variant="icon"
                ><PackageIcon aria-hidden="true" /></Empty.Media
              >
              <Empty.Title role="heading" aria-level={2}>
                No plugins match
              </Empty.Title>
              <Empty.Description>
                Try changing the search or plugin filters.
              </Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <Button type="button" variant="outline" onclick={resetFilters}
                >Reset filters</Button
              >
            </Empty.Content>
          </Empty.Root>
        {:else}
          <div class="registry-directory__list" data-view={directoryState.view}>
            {#each results as plugin (plugin.id)}
              <RegistryPluginCard
                {plugin}
                variant={directoryState.view === "grid" ? "card" : "list"}
                onOpen={onOpenPlugin}
              />
            {/each}
          </div>
        {/if}
      </section>
    </AppShell.Body.Content>
  </div>
</AppShell.Body>

<style>
  :global(.registry-directory) {
    --ui-shell-body-sidebar-width: 14rem;
  }

  .registry-directory__filters {
    display: grid;
    align-content: start;
    min-height: 100%;
    padding: 0 0.65rem 2rem;
  }

  :global(.registry-directory__filters-region[data-side="left"]) {
    border-inline-end-color: transparent;
    background: var(--background);
  }

  .registry-directory__filters-header {
    position: sticky;
    z-index: 1;
    inset-block-start: 0;
    display: flex;
    min-height: var(--ui-shell-toolbar-height);
    align-items: center;
    justify-content: space-between;
    padding-inline: 0.5rem;
    background: var(--background);
  }

  .registry-directory__filters-header strong {
    font-size: var(--community-text-secondary);
  }

  .registry-directory__filters-header button {
    border: 0;
    padding: 0.25rem;
    color: var(--muted-foreground);
    background: transparent;
    font-size: var(--community-text-secondary);
    cursor: pointer;
  }

  .registry-directory__filters-header button:hover,
  .registry-directory__filters-header button:focus-visible {
    color: var(--foreground);
  }

  .registry-directory__filter-groups {
    display: grid;
    align-content: start;
    gap: 0.35rem;
  }

  :global(.registry-directory__group) {
    display: grid;
    padding-block-end: 0.2rem;
  }

  .registry-directory__filter-groups h2 {
    margin: 0;
  }

  :global(.registry-directory__group-trigger) {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    border: 0;
    border-radius: var(--radius);
    padding: 0.5rem;
    color: var(--muted-foreground);
    background: transparent;
    font-size: var(--community-text-secondary);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-align: start;
    text-transform: uppercase;
    cursor: pointer;
  }

  :global(.registry-directory__group-trigger:hover),
  :global(.registry-directory__group-trigger:focus-visible) {
    color: var(--foreground);
    background: color-mix(in srgb, var(--accent) 60%, transparent);
    outline: none;
  }

  :global(.registry-directory__group-trigger svg) {
    width: 0.85rem;
    height: 0.85rem;
    transition: transform 120ms ease;
  }

  :global(.registry-directory__group-trigger[data-state="closed"] svg) {
    transform: rotate(-90deg);
  }

  :global(.registry-directory__group-content) {
    display: grid;
    gap: 0.2rem;
  }

  .registry-directory__filter,
  .registry-directory__show-more {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border: 0;
    border-radius: var(--radius);
    padding: 0.42rem 0.5rem;
    color: var(--foreground);
    background: transparent;
    text-align: start;
    cursor: pointer;
  }

  .registry-directory__filter:hover,
  .registry-directory__filter:focus-visible,
  .registry-directory__filter.selected {
    background: color-mix(in srgb, var(--accent) 86%, transparent);
    outline: none;
  }

  .registry-directory__filter.selected {
    font-weight: 650;
  }

  .registry-directory__filter > span:first-child {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .registry-directory__filter > span:last-child {
    color: var(--muted-foreground);
    font-size: var(--community-text-secondary);
  }

  .registry-directory__filter-icon {
    display: inline-grid;
    width: 1rem;
    height: 1rem;
    flex: none;
    place-items: center;
  }

  .registry-directory__filter-icon :global(svg) {
    width: 0.9rem;
    height: 0.9rem;
  }

  .registry-directory__filter-icon[data-filter-icon="check"] {
    border-radius: 999px;
    color: var(--primary-foreground);
    background: var(--primary);
  }

  .registry-directory__filter-icon[data-filter-icon="check"] :global(svg) {
    width: 0.7rem;
    height: 0.7rem;
  }

  .registry-directory__show-more {
    color: var(--muted-foreground);
    font-size: var(--community-text-secondary);
  }

  .registry-directory__resize-handle {
    position: relative;
    z-index: 3;
    order: 0;
    width: 1px;
    flex: none;
    margin-inline-start: -1px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: col-resize;
    touch-action: none;
  }

  .registry-directory__resize-handle > span {
    position: absolute;
    inset-block: 0;
    inset-inline-start: -0.25rem;
    width: 0.5rem;
  }

  .registry-directory__resize-handle > span::after {
    position: absolute;
    inset-block: 0;
    inset-inline-start: calc(50% - 0.5px);
    width: 1px;
    background: transparent;
    content: "";
    transition: background-color 120ms ease;
  }

  .registry-directory__resize-handle:hover > span::after,
  .registry-directory__resize-handle:focus-visible > span::after,
  .registry-directory__resize-handle[data-resizing] > span::after {
    background: var(--ring);
  }

  .registry-directory__resize-handle:focus-visible {
    outline: none;
  }

  .registry-directory__main {
    display: flex;
    flex: 1;
    order: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    container: registry-results / inline-size;
  }
  .registry-directory__results {
    display: grid;
    align-content: start;
    gap: 1rem;
    width: min(100%, 78rem);
    min-width: 0;
    min-height: 100%;
    margin-inline: auto;
    padding: 1rem clamp(1rem, 4cqi, 3rem) clamp(1rem, 4cqi, 3rem);
  }

  :global(
      .registry-directory__results-region
        [data-ui-part="scroll-area-viewport"]
        > div
    ) {
    min-height: 100%;
  }

  .registry-directory__heading {
    flex-shrink: 0;
    margin: 0.5rem;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .registry-directory__path {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
  }

  .registry-directory__search {
    display: grid;
    gap: 0.4rem;
    min-width: 0;
  }

  .registry-directory__search p {
    margin: 0;
    color: var(--muted-foreground);
  }

  :global(.registry-directory__clear-all[data-ui-component="button"]) {
    border-radius: 50%;
    flex: none;
  }

  .registry-directory__tools,
  .registry-directory__view {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .registry-directory__tools {
    flex-wrap: nowrap;
    justify-content: flex-end;
    margin-inline-start: auto;
    min-width: 0;
  }

  :global(.registry-directory__sort-trigger) {
    width: 11rem;
    max-width: 100%;
    justify-content: space-between;
  }

  .registry-directory__heading[data-compact] .registry-directory__tools {
    margin-inline-start: 0;
    flex: none;
  }

  .registry-directory__heading[data-compact]
    :global(.registry-directory__sort-trigger) {
    width: 11rem;
  }

  .registry-directory__sort-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .registry-directory__active-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .registry-directory__list {
    display: grid;
    gap: 0.75rem;
  }

  .registry-directory__list[data-view="grid"] {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  :global(.registry-directory__empty) {
    border: 1px dashed var(--border);
  }

  @container registry-results (max-width: 48rem) {
    .registry-directory__list[data-view="grid"] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @container registry-results (max-width: 32rem) {
    .registry-directory__heading {
      gap: 0.5rem;
    }

    .registry-directory__view {
      display: none;
    }

    :global(.registry-directory__sort-trigger) {
      width: 5rem;
    }

    .registry-directory__heading[data-compact]
      :global(.registry-directory__sort-trigger) {
      width: 5rem;
    }

    .registry-directory__path :global([data-ui-part="breadcrumb"]) {
      min-width: 0;
    }

    .registry-directory__path :global([data-ui-part="breadcrumb-list"]) {
      flex-wrap: nowrap;
      gap: 0.25rem;
    }

    .registry-directory__path :global([data-ui-part="breadcrumb-item"]) {
      min-width: 0;
    }

    .registry-directory__path
      :global([data-ui-part="breadcrumb-item"]:last-child) {
      flex: none;
    }

    .registry-directory__path :global([data-ui-part="breadcrumb-link"]) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .registry-directory__list[data-view="grid"] {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
