<script lang="ts">
  import {
    Menu as UIMenu,
    Notice,
    useTextHighlight,
    type App,
    type MetadataBulkOperationResult,
    type MetadataTypeProperty,
  } from "@lapis-notes/api";
  import { Icon } from "@lapis-notes/api/icon";
  import { fuzzyMatchScore } from "@lapis-notes/ui";
  import * as Sidebar from "@lapis-notes/ui/sidebar-custom";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { tick } from "svelte";
  import MarkdownSidebarPanel from "../sidebar-panel/markdown-sidebar-panel.svelte";

  let { app }: { app: App } = $props();

  const sorters: Record<
    string,
    (a: MetadataTypeProperty, b: MetadataTypeProperty) => number
  > = {
    "frequency:asc": (a, b) => a.count - b.count,
    "frequency:desc": (a, b) => b.count - a.count,
    "property:asc": (a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    "property:desc": (a, b) =>
      b.name.toLowerCase().localeCompare(a.name.toLowerCase()),
  };

  let searchState = $state({
    open: false,
    query: "",
    sortBy: "frequency:desc",
  });

  type PropertyRow = {
    depth: number;
    label: string;
    property: MetadataTypeProperty;
    topLevel: boolean;
    actionable: boolean;
  };

  let expandedProperties = $state<Record<string, boolean>>({});
  let renameState = $state<{
    property: string;
    topLevel: boolean;
    value: string;
  } | null>(null);
  let renameInput: HTMLInputElement | null = $state(null);
  let deleteDialogOpen = $state(false);
  let deleteState = $state<{
    property: MetadataTypeProperty;
    topLevel: boolean;
  } | null>(null);
  let deleteInProgress = $state(false);

  $effect(() => {
    if (!deleteDialogOpen && !deleteInProgress) {
      deleteState = null;
    }
  });

  const topLevelProperties = $derived.by(() => {
    const trackedProperties = app.metadataTypeManager.properties;
    return [...app.metadataTypeManager.topLevelPropertyNames]
      .map((name) => trackedProperties[name])
      .filter((property): property is MetadataTypeProperty => Boolean(property))
      .map((property) => ({
        ...property,
        files: new Set<string>(),
        type:
          app.metadataTypeManager.types[property.name]?.type ?? property.type,
      }));
  });

  const properties = $derived.by(() => {
    return topLevelProperties
      .map((p) => {
        const score = fuzzyMatchScore(p.name, searchState.query, []);
        return { property: p, score };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => sorters[searchState.sortBy]!(a.property, b.property))
      .map((a) => a.property);
  });

  const topLevelPropertyNames = $derived(
    new Set(topLevelProperties.map((property) => property.name)),
  );

  const typeWidgets = $derived.by(() =>
    Object.values(app.metadataTypeManager.registeredTypeWidgets)
      .filter((widget) => widget.type !== "unknown")
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  function isNestedPath(parent: string, path: string) {
    return path.startsWith(`${parent}.`) || path.startsWith(`${parent}[`);
  }

  function nestedPathSegments(parent: string, path: string): string[] {
    const relative = path.slice(parent.length).replace(/^\./, "");
    return relative.replaceAll("[", ".[").split(".").filter(Boolean);
  }

  function pathSegmentCount(path: string) {
    return path.replaceAll("[", ".[").split(".").filter(Boolean).length;
  }

  function arrayChildRelativePath(parent: string, path: string) {
    const prefix = `${parent}[`;
    if (!path.startsWith(prefix)) return null;
    const closeIndex = path.indexOf("]", prefix.length);
    if (closeIndex === -1) return null;
    const suffix = path.slice(closeIndex + 1);
    if (!suffix.startsWith(".")) return null;
    return suffix.slice(1).replace(/\[\d+\]/gu, "[]");
  }

  function arrayNestedRowsFor(property: MetadataTypeProperty): PropertyRow[] {
    const groups = new Map<
      string,
      { count: number; type: MetadataTypeProperty["type"] }
    >();

    for (const candidate of Object.values(app.metadataTypeManager.properties)) {
      if (
        candidate.name === property.name ||
        topLevelPropertyNames.has(candidate.name) ||
        !isNestedPath(property.name, candidate.name)
      ) {
        continue;
      }

      const relativePath = arrayChildRelativePath(
        property.name,
        candidate.name,
      );
      if (!relativePath) continue;

      const group = groups.get(relativePath) ?? {
        count: 0,
        type: candidate.type,
      };
      group.count = Math.max(group.count, candidate.count);
      if (group.type !== candidate.type) group.type = "unknown";
      groups.set(relativePath, group);
    }

    return [...groups.entries()]
      .map(([relativePath, group]) => ({
        depth: pathSegmentCount(relativePath),
        label: relativePath,
        property: {
          name: `${property.name}[].${relativePath}`,
          type: group.type,
          count: group.count,
          files: new Set<string>(),
        },
        topLevel: false,
        actionable: false,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function nestedRowsFor(property: MetadataTypeProperty): PropertyRow[] {
    if (property.type !== "object" && property.type !== "array") return [];
    if (property.type === "array") return arrayNestedRowsFor(property);

    return Object.values(app.metadataTypeManager.properties)
      .filter(
        (candidate) =>
          candidate.name !== property.name &&
          !topLevelPropertyNames.has(candidate.name) &&
          isNestedPath(property.name, candidate.name),
      )
      .map((candidate) => {
        const segments = nestedPathSegments(property.name, candidate.name);
        return {
          depth: Math.max(1, segments.length),
          label: segments.at(-1) ?? candidate.name,
          property: candidate,
          topLevel: false,
          actionable: true,
        };
      })
      .sort((a, b) => a.property.name.localeCompare(b.property.name));
  }

  function toggleNestedProperty(property: string) {
    expandedProperties[property] = !expandedProperties[property];
  }

  function isRenaming(property: MetadataTypeProperty, topLevel: boolean) {
    return (
      renameState?.property === property.name &&
      renameState.topLevel === topLevel
    );
  }

  function toggleSearch() {
    if (searchState.open) {
      searchState.open = false;
      searchState.query = "";
    } else {
      searchState.open = true;
      searchState.query = "";
    }
  }

  function createMenu(evt: MouseEvent) {
    new UIMenu()
      .addItem((item) =>
        item
          .setTitle("Property name (A to Z)")
          .setChecked(searchState.sortBy === "property:asc")
          .onClick(() => (searchState.sortBy = "property:asc")),
      )
      .addItem((item) =>
        item
          .setTitle("Property name (Z to A)")
          .setChecked(searchState.sortBy === "property:desc")
          .onClick(() => (searchState.sortBy = "property:desc")),
      )
      .addSeparator()
      .addItem((item) =>
        item
          .setTitle("Frequency (high to low)")
          .setChecked(searchState.sortBy === "frequency:desc")
          .onClick(() => (searchState.sortBy = "frequency:desc")),
      )
      .addItem((item) =>
        item
          .setTitle("Frequency (low to high)")
          .setChecked(searchState.sortBy === "frequency:asc")
          .onClick(() => (searchState.sortBy = "frequency:asc")),
      )
      .showAtMouseEvent(evt);
  }

  function quotedPropertyQuery(name: string) {
    return `["${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
  }

  function openSearchForProperty(
    property: MetadataTypeProperty,
    queryName = property.name,
  ) {
    if (renameState?.property === property.name) return;
    void app.commands
      .executeCommand(
        "search:open-search",
        quotedPropertyQuery(queryName),
      )
      .catch(() => undefined);
  }

  function searchNameForRow(row: PropertyRow) {
    return row.property.name.replace(/\[\]/gu, "");
  }

  function reportResult(action: string, result: MetadataBulkOperationResult) {
    const failed = result.failedFiles.length;
    const updated = result.updatedFiles.length;
    if (failed) {
      new Notice(`${action}: ${updated} file(s) updated, ${failed} failed`);
      return;
    }
    new Notice(`${action}: ${updated} file(s) updated`);
  }

  async function startRenamingProperty(
    property: MetadataTypeProperty,
    topLevel: boolean,
  ) {
    renameState = { property: property.name, topLevel, value: property.name };
    await tick();
    renameInput?.focus();
    renameInput?.select();
  }

  async function commitRenameProperty(
    property: MetadataTypeProperty,
    topLevel: boolean,
  ) {
    const currentRenameState = renameState;
    if (
      !currentRenameState ||
      currentRenameState.property !== property.name ||
      currentRenameState.topLevel !== topLevel
    ) {
      return;
    }

    const nextName = currentRenameState.value.trim();
    renameState = null;
    if (!nextName || nextName === property.name) return;

    const result = await app.notifications.withProgress(
      {
        title: `Renaming ${property.name}`,
        source: "Markdown",
        location: "status",
        persistOnError: true,
      },
      (progress) => {
        const options = {
          onProgress: (state: {
            current: number;
            path: string;
            total: number;
          }) =>
            progress.report({
              current: state.current,
              total: state.total,
              message: state.path,
            }),
        };
        return topLevel
          ? app.metadataTypeManager.renameTopLevelProperty(
              property.name,
              nextName,
              options,
            )
          : app.metadataTypeManager.rename(property.name, nextName);
      },
    );
    reportResult(`Renamed ${property.name} to ${nextName}`, result);
  }

  function cancelRenameProperty(
    property: MetadataTypeProperty,
    topLevel: boolean,
  ) {
    if (isRenaming(property, topLevel)) renameState = null;
  }

  function requestDeleteProperty(
    property: MetadataTypeProperty,
    topLevel: boolean,
  ) {
    deleteState = { property, topLevel };
    deleteDialogOpen = true;
  }

  async function deleteProperty() {
    const state = deleteState;
    if (!state || deleteInProgress) return;
    const { property, topLevel } = state;

    deleteInProgress = true;
    try {
      const result = await app.notifications.withProgress(
        {
          title: `Deleting ${property.name}`,
          source: "Markdown",
          location: "status",
          persistOnError: true,
        },
        (progress) => {
          const options = {
            onProgress: (state: {
              current: number;
              path: string;
              total: number;
            }) =>
              progress.report({
                current: state.current,
                total: state.total,
                message: state.path,
              }),
          };
          return topLevel
            ? app.metadataTypeManager.deleteTopLevelProperty(
                property.name,
                options,
              )
            : app.metadataTypeManager.deleteProperty(property.name, options);
        },
      );
      deleteDialogOpen = false;
      reportResult(`Deleted ${property.name}`, result);
    } finally {
      deleteInProgress = false;
    }
  }

  async function changePropertyType(
    property: MetadataTypeProperty,
    type: MetadataTypeProperty["type"],
    topLevel: boolean,
  ) {
    const result = await app.notifications.withProgress(
      {
        title: `Changing ${property.name} type`,
        source: "Markdown",
        location: "status",
        persistOnError: true,
      },
      (progress) => {
        const options = {
          onProgress: (state: {
            current: number;
            path: string;
            total: number;
          }) =>
            progress.report({
              current: state.current,
              total: state.total,
              message: state.path,
            }),
        };
        return topLevel
          ? app.metadataTypeManager.setTopLevelPropertyType(
              property.name,
              type,
              options,
            )
          : app.metadataTypeManager.setPropertyType(
              property.name,
              type,
              options,
            );
      },
    );
    reportResult(`Changed ${property.name} type`, result);
  }

  function createPropertyMenu(
    evt: MouseEvent,
    property: MetadataTypeProperty,
    topLevel: boolean,
  ) {
    evt.preventDefault();
    evt.stopPropagation();

    new UIMenu()
      .addItem((item) =>
        item
          .setTitle("Rename")
          .setIcon("lucide-pencil")
          .onClick(() => void startRenamingProperty(property, topLevel)),
      )
      .addMenu((submenu) => {
        submenu.setTitle("Change Property Type");
        for (const widget of typeWidgets) {
          submenu.addItem((item) =>
            item
              .setTitle(widget.name)
              .setIcon(widget.icon)
              .setChecked(property.type === widget.type)
              .onClick(
                () => void changePropertyType(property, widget.type, topLevel),
              ),
          );
        }
      })
      .addSeparator()
      .addItem((item) =>
        item
          .setTitle("Delete Property")
          .setIcon("lucide-trash-2")
          .setWarning()
          .onClick(() => requestDeleteProperty(property, topLevel)),
      )
      .showAtMouseEvent(evt);
  }

  function iconFor(type: MetadataTypeProperty["type"]) {
    return (
      app.metadataTypeManager.registeredTypeWidgets[type]?.icon ||
      app.metadataTypeManager.registeredTypeWidgets.unknown?.icon ||
      "lucide-file-question"
    );
  }
</script>

<!--
  Shell owns sticky chrome + ui Search (LN-MD-018).
  NestedProvider is Menu context only. Wrapper keeps scoped Menu CSS.
-->
<div class="all-properties">
  <MarkdownSidebarPanel
    component="all-properties"
    title="All properties"
    testId="all-properties-panel"
    showTitle={false}
    searchPlaceholder="Search properties"
    searchToggleable={true}
    bind:searchOpen={searchState.open}
    bind:query={searchState.query}
  >
    {#snippet toolbar()}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Sort properties"
        title="Sort properties"
        data-tooltip="Sort Files"
        data-tooltip-position="bottom"
        onclick={(evt) => createMenu(evt)}
      >
        <Icon name="lucide-arrow-up-narrow-wide" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Search properties"
        title="Search properties"
        data-tooltip="Search properties"
        data-tooltip-position="bottom"
        data-active={searchState.open ? "true" : "false"}
        aria-pressed={searchState.open}
        onclick={() => toggleSearch()}
      >
        <Icon name="lucide-search" />
      </Button>
    {/snippet}

    <Sidebar.NestedProvider id="all-properties" class="all-properties__fill">
      <Sidebar.Content class="all-properties__menu-host">
        {#if app.metadataTypeManager.queryError}
          <p class="markdown-sidebar-panel__empty" role="alert">
            Unable to load properties: {app.metadataTypeManager.queryError}
          </p>
        {:else if app.metadataTypeManager.propertiesLoading && !properties.length}
          <p class="markdown-sidebar-panel__empty">Loading properties…</p>
        {:else if !properties.length}
          <p class="markdown-sidebar-panel__empty">No properties found.</p>
        {:else}
          {#each properties as property (property.name)}
          {@const nestedRows = nestedRowsFor(property)}
          {@const renaming = isRenaming(property, true)}
          <Sidebar.Menu>
            <Sidebar.MenuItem
              class="all-properties__item"
              data-renaming={renaming ? "true" : "false"}
            >
              <Sidebar.MenuButton
                class="all-properties__button"
                onclick={() => openSearchForProperty(property)}
                oncontextmenu={(evt) => createPropertyMenu(evt, property, true)}
              >
                {#if nestedRows.length}
                  <span
                    class="all-properties__expand"
                    role="button"
                    tabindex="0"
                    aria-label={expandedProperties[property.name]
                      ? "Collapse nested properties"
                      : "Expand nested properties"}
                    aria-expanded={Boolean(expandedProperties[property.name])}
                    onclick={(evt) => {
                      evt.stopPropagation();
                      toggleNestedProperty(property.name);
                    }}
                    onkeydown={(evt) => {
                      if (evt.key === "Enter" || evt.key === " ") {
                        evt.preventDefault();
                        evt.stopPropagation();
                        toggleNestedProperty(property.name);
                      }
                    }}
                  >
                    <Icon
                      name={expandedProperties[property.name]
                        ? "lucide-chevron-down"
                        : "lucide-chevron-right"}
                    />
                  </span>
                {:else}
                  <span class="all-properties__expand" aria-hidden="true"
                  ></span>
                {/if}
                <span class="all-properties__type-icon" aria-hidden="true">
                  <Icon name={iconFor(property.type)} />
                </span>
                {#if renaming}
                  <input
                    bind:this={renameInput}
                    class="all-properties__rename"
                    value={renameState?.value ?? ""}
                    aria-label={`Rename ${property.name}`}
                    oninput={(evt) => {
                      if (renameState) {
                        renameState.value = evt.currentTarget.value;
                      }
                    }}
                    onblur={() => void commitRenameProperty(property, true)}
                    onclick={(evt) => evt.stopPropagation()}
                    onmousedown={(evt) => evt.stopPropagation()}
                    onkeydown={(evt) => {
                      if (evt.key === "Enter") {
                        evt.preventDefault();
                        void commitRenameProperty(property, true);
                      } else if (evt.key === "Escape") {
                        evt.preventDefault();
                        cancelRenameProperty(property, true);
                      }
                    }}
                  />
                {:else}
                  <span
                    class="all-properties__name"
                    use:useTextHighlight={{
                      query: searchState.query,
                      value: property.name,
                    }}>{property.name}</span
                  >
                {/if}
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge class="all-properties__count"
                >{property.count}</Sidebar.MenuBadge
              >
            </Sidebar.MenuItem>
          </Sidebar.Menu>
          {#if expandedProperties[property.name]}
            {#each nestedRows as row (row.property.name)}
              {@const nestedRenaming = isRenaming(row.property, false)}
              <Sidebar.Menu>
                <Sidebar.MenuItem
                  class="all-properties__item"
                  data-renaming={nestedRenaming ? "true" : "false"}
                >
                  <Sidebar.MenuButton
                    class="all-properties__button"
                    data-actionable={row.actionable ? "true" : "false"}
                    style={`padding-left: ${0.75 + row.depth * 0.75}rem`}
                    onclick={() => {
                      openSearchForProperty(
                        row.property,
                        searchNameForRow(row),
                      );
                    }}
                    oncontextmenu={(evt) => {
                      if (!row.actionable) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        return;
                      }
                      createPropertyMenu(evt, row.property, false);
                    }}
                  >
                    <span class="all-properties__expand" aria-hidden="true"
                    ></span>
                    <span class="all-properties__type-icon" aria-hidden="true">
                      <Icon name={iconFor(row.property.type)} />
                    </span>
                    {#if nestedRenaming}
                      <input
                        bind:this={renameInput}
                        class="all-properties__rename"
                        value={renameState?.value ?? ""}
                        aria-label={`Rename ${row.label}`}
                        oninput={(evt) => {
                          if (renameState) {
                            renameState.value = evt.currentTarget.value;
                          }
                        }}
                        onblur={() =>
                          void commitRenameProperty(row.property, false)}
                        onclick={(evt) => evt.stopPropagation()}
                        onmousedown={(evt) => evt.stopPropagation()}
                        onkeydown={(evt) => {
                          if (evt.key === "Enter") {
                            evt.preventDefault();
                            void commitRenameProperty(row.property, false);
                          } else if (evt.key === "Escape") {
                            evt.preventDefault();
                            cancelRenameProperty(row.property, false);
                          }
                        }}
                      />
                    {:else}
                      <span
                        class="all-properties__name"
                        use:useTextHighlight={{
                          query: searchState.query,
                          value: row.label,
                        }}>{row.label}</span
                      >
                    {/if}
                  </Sidebar.MenuButton>
                  <Sidebar.MenuBadge class="all-properties__count"
                    >{row.property.count}</Sidebar.MenuBadge
                  >
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            {/each}
          {/if}
          {/each}
        {/if}
      </Sidebar.Content>
    </Sidebar.NestedProvider>
  </MarkdownSidebarPanel>
</div>

{#if deleteState}
  <Dialog.Root bind:open={deleteDialogOpen}>
    <Dialog.Content showCloseButton={!deleteInProgress}>
      <Dialog.Header>
        <Dialog.Title>Delete property?</Dialog.Title>
        <Dialog.Description>
          Delete "{deleteState.property.name}" from
          {deleteState.property.count} file(s). This removes the selected
          frontmatter key across affected files.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Button
          variant="outline"
          disabled={deleteInProgress}
          onclick={() => (deleteDialogOpen = false)}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={deleteInProgress}
          onclick={() => void deleteProperty()}
        >
          {deleteInProgress ? "Deleting..." : "Delete Property"}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}

<style>
  /* Menu-row specifics; chrome/search/tokens live on MarkdownSidebarPanel. */
  .all-properties {
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    min-height: 0;
  }

  .all-properties :global(.markdown-sidebar-panel) {
    height: 100%;
  }

  .all-properties :global(.all-properties__fill) {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .all-properties :global(.all-properties__menu-host) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    overflow: visible;
    padding: 0;
    background: transparent;
  }

  .all-properties :global([data-ui-part="sidebar-menu"]) {
    width: 100%;
    min-width: 0;
  }

  .all-properties :global(.all-properties__item) {
    position: relative;
    width: 100%;
    min-width: 0;
    border: 2px solid transparent;
    border-radius: 0.375rem;
  }

  .all-properties :global(.all-properties__item[data-renaming="true"]) {
    border-color: var(--interactive-accent, var(--primary));
  }

  .all-properties :global(.all-properties__button) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    gap: var(--markdown-sidebar-icon-gap);
    padding-block: calc(var(--spacing, 0.25rem) * 2);
    /* Shell content-start + border + expand + gap = search icon offset. */
    padding-inline-start: calc(
      var(--markdown-sidebar-search-icon-offset) - 0.25rem - 2px -
        var(--markdown-sidebar-expand-size) - var(--markdown-sidebar-icon-gap)
    );
    padding-inline-end: calc(
      var(--markdown-sidebar-count-width) + var(--markdown-sidebar-count-end-pad)
    );
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .all-properties :global(.all-properties__button[data-actionable="false"]) {
    cursor: default;
  }

  .all-properties__expand {
    display: inline-flex;
    flex: 0 0 auto;
    width: var(--markdown-sidebar-expand-size);
    height: var(--markdown-sidebar-expand-size);
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }

  .all-properties__expand :global(svg) {
    width: 0.75rem;
    height: 0.75rem;
  }

  .all-properties__type-icon {
    display: inline-flex;
    flex: 0 0 auto;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }

  .all-properties__type-icon :global(svg) {
    width: 1rem;
    height: 1rem;
  }

  .all-properties__name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .all-properties__rename {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    padding: 0 0.25rem;
    border: none;
    color: inherit;
    background: transparent;
    font: inherit;
    font-size: 0.75rem;
    line-height: 1rem;
    outline: none;
  }

  .all-properties :global(.all-properties__count) {
    position: absolute;
    top: 50%;
    right: var(--markdown-sidebar-count-end-pad);
    z-index: 1;
    display: inline-flex;
    width: var(--markdown-sidebar-count-width);
    min-width: var(--markdown-sidebar-count-width);
    flex: 0 0 auto;
    align-items: center;
    justify-content: flex-end;
    transform: translateY(-50%);
    pointer-events: none;
    font-variant-numeric: tabular-nums;
  }
</style>
