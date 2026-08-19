<script lang="ts">
  import { useTextHighlight, type App } from "@lapis-notes/api";
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Checkbox } from "@lapismd/design-core/shadcn/checkbox";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import ChevronsDownUpIcon from "@lucide/svelte/icons/chevrons-down-up";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import FolderClosedIcon from "@lucide/svelte/icons/folder-closed";
  import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PuzzleIcon from "@lucide/svelte/icons/puzzle";
  import SquareArrowOutUpRightIcon from "@lucide/svelte/icons/square-arrow-out-up-right";
  import TerminalIcon from "@lucide/svelte/icons/terminal";
  import UserIcon from "@lucide/svelte/icons/user";
  import WrenchIcon from "@lucide/svelte/icons/wrench";
  import { onMount, type Component } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import { filterCatalogGroups } from "./filter";
  import {
    catalogCommandKey,
    catalogKindKey,
    catalogOwnerKey,
    catalogSkillKey,
    catalogToolKey,
    collectCatalogExpandableKeys,
    collectCatalogFolderKeys,
    isCatalogFolderKey,
    type CatalogKindKey,
  } from "./tree";
  import type {
    CatalogCommandRow,
    CatalogGroup,
    CatalogSkillRow,
    CatalogToolRow,
  } from "./types";

  let {
    app,
    loadCatalog,
    onToggleTool,
    onOpenSkill,
    subscribeSettings,
  }: {
    app: App;
    loadCatalog: () => Promise<CatalogGroup[]>;
    onToggleTool: (tool: CatalogToolRow, enabled: boolean) => Promise<void>;
    onOpenSkill: (path: string) => Promise<void>;
    subscribeSettings?: (listener: () => void) => () => void;
  } = $props();

  let groups = $state<CatalogGroup[]>([]);
  let query = $state("");
  let openKeys = new SvelteSet<string>();
  let openedCatalogPath = $state<string | null>(null);
  let defaultsApplied = false;

  const visibleGroups = $derived(filterCatalogGroups(groups, query));
  const filtering = $derived(query.trim().length > 0);
  const expandableKeys = $derived(collectCatalogExpandableKeys(visibleGroups));
  const allExpanded = $derived(
    expandableKeys.length > 0 &&
      expandableKeys.every(
        (key) =>
          (filtering && isCatalogFolderKey(key)) || openKeys.has(key),
      ),
  );

  function isOpen(key: string): boolean {
    if (filtering && isCatalogFolderKey(key)) return true;
    return openKeys.has(key);
  }

  function setOpen(key: string, open: boolean): void {
    if (open) openKeys.add(key);
    else openKeys.delete(key);
  }

  function toggleAll(): void {
    if (allExpanded) {
      openKeys.clear();
      return;
    }
    openKeys.clear();
    for (const key of collectCatalogExpandableKeys(visibleGroups)) {
      openKeys.add(key);
    }
  }

  async function refresh(): Promise<void> {
    groups = await loadCatalog();
    if (!defaultsApplied) {
      openKeys.clear();
      for (const key of collectCatalogFolderKeys(groups)) {
        openKeys.add(key);
      }
      defaultsApplied = true;
    }
  }

  onMount(() => {
    const tools = app.agentTools.on("changed", () => void refresh());
    const commands = app.agentSlashCommands.on("changed", () => void refresh());
    const skills = app.agentSkills.on("changed", () => void refresh());
    const created = app.vault.on("create", () => void refresh());
    const deleted = app.vault.on("delete", () => void refresh());
    const modified = app.vault.on("modify", () => void refresh());
    const renamed = app.vault.on("rename", () => void refresh());
    const unsubscribeSettings = subscribeSettings?.(() => void refresh());
    void refresh();
    return () => {
      app.agentTools.offref(tools);
      app.agentSlashCommands.offref(commands);
      app.agentSkills.offref(skills);
      app.vault.offref(created);
      app.vault.offref(deleted);
      app.vault.offref(modified);
      app.vault.offref(renamed);
      unsubscribeSettings?.();
    };
  });

  async function openCatalogFile(path: string): Promise<void> {
    openedCatalogPath = path;
    await onOpenSkill(path);
  }

  function ownerIcon(group: CatalogGroup): Component {
    if (group.kind === "user") return UserIcon;
    if (group.kind === "diagnostics") return CircleAlertIcon;
    if (group.kind === "folders") return FolderClosedIcon;
    return PuzzleIcon;
  }

  function kindIcon(kind: CatalogKindKey): Component {
    if (kind === "tools") return WrenchIcon;
    if (kind === "commands") return TerminalIcon;
    if (kind === "skills") return BookOpenIcon;
    return CircleAlertIcon;
  }

  function kindLabel(kind: CatalogKindKey): string {
    if (kind === "tools") return "Tools";
    if (kind === "commands") return "Commands";
    if (kind === "skills") return "Skills";
    return "Diagnostics";
  }

  function shouldIgnoreRowToggle(event: Event): boolean {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest("[data-catalog-ignore-toggle]"));
  }

  function toggleLeafRow(event: Event, key: string, open: boolean): void {
    if (shouldIgnoreRowToggle(event)) return;
    setOpen(key, !open);
  }

  function handleLeafKeydown(
    event: KeyboardEvent,
    key: string,
    open: boolean,
  ): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (shouldIgnoreRowToggle(event)) return;
    event.preventDefault();
    setOpen(key, !open);
  }
</script>

<Tooltip.Provider delayDuration={0}>
<div class="ai-catalog" data-ui-component="ai-catalog" data-testid="ai-catalog">
  <div class="ai-catalog__chrome" data-ui-part="chrome">
    <div data-ui-part="toolbar">
      <SearchFilterBar
        value={query}
        inputMode="plain"
        ariaLabel="Filter catalog"
        placeholder="Filter catalog…"
        onValueChange={(value) => {
          query = value;
        }}
        onClearSearch={() => {
          query = "";
        }}
      >
        {#snippet actions()}
          <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Button
                    {...props}
                    size="icon-sm"
                    variant="ghost"
                    aria-label={allExpanded ? "Collapse all" : "Expand all"}
                    disabled={expandableKeys.length === 0}
                    onclick={toggleAll}
                  >
                    {#if allExpanded}
                      <ChevronsDownUpIcon
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                    {:else}
                      <ChevronsUpDownIcon
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                    {/if}
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">
                {allExpanded ? "Collapse all" : "Expand all"}
              </Tooltip.Content>
            </Tooltip.Root>
        {/snippet}
      </SearchFilterBar>
    </div>
  </div>

  <ScrollArea class="ai-catalog__scroll">
    <div class="ai-catalog__body">
      {#if visibleGroups.length === 0}
        <p class="ai-catalog__state">
          {filtering
            ? "No catalog items match your filter."
            : "No catalog items yet."}
        </p>
      {:else}
        <Sidebar.Menu
          class="ai-catalog__tree"
          role="tree"
          aria-label="AI catalog"
        >
          {#each visibleGroups as group (group.id)}
            {@render OwnerNode({ group })}
          {/each}
        </Sidebar.Menu>
      {/if}
    </div>
  </ScrollArea>
</div>
</Tooltip.Provider>

{#snippet OwnerNode({ group }: { group: CatalogGroup })}
  {@const key = catalogOwnerKey(group.id)}
  {@const open = isOpen(key)}
  {@const OwnerIcon = ownerIcon(group)}
  <Sidebar.MenuItem role="none" class="ai-catalog__item">
    <Collapsible.Root {open} onOpenChange={(value) => setOpen(key, value)}>
      <Collapsible.Trigger
        class="ai-catalog__row"
        role="treeitem"
        aria-level={1}
        aria-expanded={open}
        aria-selected="false"
        aria-label={group.label}
      >
        <ChevronRightIcon
          class="ai-catalog__disclosure"
          data-open={open}
          aria-hidden="true"
        />
        {#if group.kind === "folders" && open}
          <FolderOpenIcon class="ai-catalog__icon" aria-hidden="true" />
        {:else}
          <OwnerIcon class="ai-catalog__icon" aria-hidden="true" />
        {/if}
        <span
          class="ai-catalog__label"
          use:useTextHighlight={{ query, value: group.label }}>{group.label}</span
        >
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Sidebar.MenuSub role="group" class="ai-catalog__subtree">
          {#if group.tools.length > 0}
            {@render KindNode({ group, kind: "tools" })}
          {/if}
          {#if group.commands.length > 0}
            {@render KindNode({ group, kind: "commands" })}
          {/if}
          {#if group.skills.length > 0}
            {@render KindNode({ group, kind: "skills" })}
          {/if}
          {#if group.diagnostics.length > 0}
            {@render KindNode({ group, kind: "diagnostics" })}
          {/if}
        </Sidebar.MenuSub>
      </Collapsible.Content>
    </Collapsible.Root>
  </Sidebar.MenuItem>
{/snippet}

{#snippet KindNode({
  group,
  kind,
}: {
  group: CatalogGroup;
  kind: CatalogKindKey;
})}
  {@const key = catalogKindKey(group.id, kind)}
  {@const open = isOpen(key)}
  {@const KindIcon = kindIcon(kind)}
  {@const label = kindLabel(kind)}
  <Sidebar.MenuSubItem role="none" class="ai-catalog__item">
    <Collapsible.Root {open} onOpenChange={(value) => setOpen(key, value)}>
      <Collapsible.Trigger
        class="ai-catalog__row"
        role="treeitem"
        aria-level={2}
        aria-expanded={open}
        aria-selected="false"
        aria-label={label}
      >
        <ChevronRightIcon
          class="ai-catalog__disclosure"
          data-open={open}
          aria-hidden="true"
        />
        <KindIcon class="ai-catalog__icon" aria-hidden="true" />
        <span class="ai-catalog__label">{label}</span>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Sidebar.MenuSub role="group" class="ai-catalog__subtree">
          {#if kind === "tools"}
            {#each group.tools as tool (`tool:${tool.name}`)}
              {@render ToolRow({ tool })}
            {/each}
          {:else if kind === "commands"}
            {#each group.commands as command (`command:${command.name}`)}
              {@render CommandRow({ command })}
            {/each}
          {:else if kind === "skills"}
            {#each group.skills as skill (`skill:${skill.source}:${skill.name}`)}
              {@render SkillRow({ skill })}
            {/each}
          {:else}
            {#each group.diagnostics as diagnostic (`diag:${diagnostic.path}`)}
              <div
                class="ai-catalog__row"
                role="treeitem"
                aria-level={3}
                aria-selected="false"
              >
                <CircleAlertIcon class="ai-catalog__icon" aria-hidden="true" />
                <span class="ai-catalog__label">{diagnostic.message}</span>
              </div>
            {/each}
          {/if}
        </Sidebar.MenuSub>
      </Collapsible.Content>
    </Collapsible.Root>
  </Sidebar.MenuSubItem>
{/snippet}

{#snippet ToolRow({ tool }: { tool: CatalogToolRow })}
  {@const key = catalogToolKey(tool.name)}
  {@const open = isOpen(key)}
  <Sidebar.MenuSubItem role="none" class="ai-catalog__item">
    <Collapsible.Root {open} onOpenChange={(value) => setOpen(key, value)}>
      <div
        class="ai-catalog__row"
        role="treeitem"
        tabindex="0"
        aria-level={3}
        aria-expanded={open}
        aria-selected="false"
        aria-label={tool.name}
        onclick={(event) => toggleLeafRow(event, key, open)}
        onkeydown={(event) => handleLeafKeydown(event, key, open)}
      >
        <ChevronRightIcon
          class="ai-catalog__disclosure"
          data-open={open}
          aria-hidden="true"
        />
        <span class="ai-catalog__enable" data-catalog-ignore-toggle>
          <Checkbox
            checked={tool.enabled}
            aria-label={`Enable ${tool.name} for the next chat`}
            onCheckedChange={(checked) =>
              void onToggleTool(tool, checked === true)}
          />
        </span>
        <span
          class="ai-catalog__label"
          use:useTextHighlight={{ query, value: tool.name }}>{tool.name}</span
        >
        <span class="ai-catalog__meta">{tool.effect}</span>
      </div>
      <Collapsible.Content>
        <p
          class="ai-catalog__description"
          use:useTextHighlight={{ query, value: tool.description }}
        >
          {tool.description}
        </p>
      </Collapsible.Content>
    </Collapsible.Root>
  </Sidebar.MenuSubItem>
{/snippet}

{#snippet CommandRow({ command }: { command: CatalogCommandRow })}
  {@const key = catalogCommandKey(command.name)}
  {@const open = isOpen(key)}
  {@const slashName = `/${command.name}`}
  {@const selected = Boolean(command.path && openedCatalogPath === command.path)}
  <Sidebar.MenuSubItem role="none" class="ai-catalog__item">
    <Collapsible.Root {open} onOpenChange={(value) => setOpen(key, value)}>
      <div
        class="ai-catalog__row"
        role="treeitem"
        tabindex="0"
        aria-level={3}
        aria-expanded={open}
        aria-selected={selected}
        aria-label={slashName}
        data-active={selected}
        onclick={(event) => toggleLeafRow(event, key, open)}
        onkeydown={(event) => handleLeafKeydown(event, key, open)}
      >
        <ChevronRightIcon
          class="ai-catalog__disclosure"
          data-open={open}
          aria-hidden="true"
        />
        <span
          class="ai-catalog__label"
          use:useTextHighlight={{ query, value: slashName }}>{slashName}</span
        >
        {#if command.path}
          <span data-catalog-ignore-toggle>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Button
                    {...props}
                    size="icon-sm"
                    variant="ghost"
                    class="ai-catalog__open-skill"
                    aria-label={`Open ${command.name}`}
                    onclick={() => void openCatalogFile(command.path!)}
                  >
                    <SquareArrowOutUpRightIcon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">Open {command.name}</Tooltip.Content>
            </Tooltip.Root>
          </span>
        {/if}
      </div>
      <Collapsible.Content>
        <p
          class="ai-catalog__description"
          use:useTextHighlight={{ query, value: command.description }}
        >
          {command.description}
        </p>
      </Collapsible.Content>
    </Collapsible.Root>
  </Sidebar.MenuSubItem>
{/snippet}

{#snippet SkillRow({ skill }: { skill: CatalogSkillRow })}
  {@const key = catalogSkillKey(skill.source, skill.name)}
  {@const open = isOpen(key)}
  {@const selected = Boolean(skill.path && openedCatalogPath === skill.path)}
  <Sidebar.MenuSubItem role="none" class="ai-catalog__item">
    <Collapsible.Root {open} onOpenChange={(value) => setOpen(key, value)}>
      <div
        class="ai-catalog__row"
        role="treeitem"
        tabindex="0"
        aria-level={3}
        aria-expanded={open}
        aria-selected={selected}
        aria-label={skill.name}
        data-active={selected}
        title={skill.path ? undefined : "Bundled skill is not a vault file"}
        onclick={(event) => toggleLeafRow(event, key, open)}
        onkeydown={(event) => handleLeafKeydown(event, key, open)}
      >
        <ChevronRightIcon
          class="ai-catalog__disclosure"
          data-open={open}
          aria-hidden="true"
        />
        {#if skill.path}
          <FileTextIcon class="ai-catalog__icon" aria-hidden="true" />
        {:else}
          <PackageIcon class="ai-catalog__icon" aria-hidden="true" />
        {/if}
        <span
          class="ai-catalog__label"
          use:useTextHighlight={{ query, value: skill.name }}>{skill.name}</span
        >
        {#if skill.shadowed}
          <span class="ai-catalog__meta">shadowed</span>
        {/if}
        {#if skill.path}
          <span data-catalog-ignore-toggle>
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Button
                    {...props}
                    size="icon-sm"
                    variant="ghost"
                    class="ai-catalog__open-skill"
                    aria-label={`Open ${skill.name}`}
                    onclick={() => void openCatalogFile(skill.path!)}
                  >
                    <SquareArrowOutUpRightIcon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                  </Button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">Open {skill.name}</Tooltip.Content>
            </Tooltip.Root>
          </span>
        {/if}
      </div>
      <Collapsible.Content>
        <p
          class="ai-catalog__description"
          use:useTextHighlight={{ query, value: skill.description }}
        >
          {skill.description}
        </p>
      </Collapsible.Content>
    </Collapsible.Root>
  </Sidebar.MenuSubItem>
{/snippet}

<style>
  .ai-catalog {
    --ai-catalog-surface: var(
      --ui-workspace-view-background,
      var(--ui-workspace-background, var(--background))
    );
    --ai-catalog-foreground: var(
      --ui-workspace-view-foreground,
      var(--ui-workspace-foreground, var(--foreground))
    );

    display: flex;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    color: var(--ai-catalog-foreground);
    background: var(--ai-catalog-surface);
    font-family: var(--ui-workspace-explorer-font-family, inherit);
    font-size: var(--ui-workspace-explorer-font-size, 0.8125rem);
  }

  .ai-catalog__chrome {
    position: relative;
    z-index: 10;
    flex: 0 0 auto;
    background: var(--ai-catalog-surface);
    --cv-search-filter-background: var(--ai-catalog-surface);
    --cv-search-filter-justify: center;
    --cv-search-filter-content-justify: center;
  }

  .ai-catalog__chrome :global(.cv-search-filter-bar) {
    padding: 0.5rem;
  }

  :global(.ai-catalog__scroll) {
    min-height: 0;
    height: 100%;
    flex: 1 1 auto;
    --ui-scroll-area-foreground: var(
      --ui-workspace-border-strong,
      var(--sidebar-border)
    );
  }

  .ai-catalog__body {
    box-sizing: border-box;
    min-height: 100%;
    padding: var(--ui-workspace-explorer-content-padding, 0.5rem);
    padding-block-end: 2.5rem;
  }

  :global(.ai-catalog__tree),
  :global(.ai-catalog__item),
  :global(.ai-catalog__item [data-ui-part="collapsible"]) {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
  }

  :global(.ai-catalog__tree) {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
    flex-direction: column;
    gap: var(--ui-workspace-explorer-row-gap, 0.125rem);
  }

  :global(.ai-catalog__subtree) {
    box-sizing: border-box;
    width: auto;
    max-width: 100%;
    margin-inline: var(--ui-workspace-explorer-indent, 0.75rem);
    padding-inline-start: var(--ui-workspace-explorer-guide-gap, 0.25rem);
    border-inline-start: var(--ui-workspace-explorer-guide-width, 1px) solid
      var(--ui-workspace-explorer-guide-color, var(--border));
  }

  :global(.ai-catalog__row) {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: var(--ui-workspace-explorer-row-height, 1.75rem);
    align-items: center;
    gap: 0.25rem;
    border: 2px solid transparent;
    border-radius: var(--ui-workspace-radius-small, 0.25rem);
    padding: 0.125rem 0.375rem;
    color: inherit;
    background: transparent;
    font: inherit;
    font-size: inherit;
    line-height: 1.25;
    text-align: start;
    cursor: pointer;
  }

  :global(.ai-catalog__row:hover),
  :global(.ai-catalog__row:focus-visible),
  :global(.ai-catalog__row:focus-within) {
    background: var(
      --ui-workspace-explorer-row-hover-background,
      var(--sidebar-accent)
    );
    outline: none;
  }

  :global(.ai-catalog__row[data-active="true"]) {
    background: var(
      --ui-workspace-explorer-row-active-background,
      var(--accent)
    );
    font-weight: var(--ui-workspace-explorer-row-active-weight, 600);
  }

  :global(.ai-catalog__disclosure),
  :global(.ai-catalog__icon) {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
  }

  :global(.ai-catalog__disclosure) {
    width: 0.875rem;
    height: 0.875rem;
    transition: transform 120ms ease;
  }

  :global(.ai-catalog__disclosure[data-open="true"]) {
    transform: rotate(90deg);
  }

  :global(.ai-catalog__icon) {
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
  }

  .ai-catalog__enable {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
  }

  .ai-catalog__label,
  .ai-catalog__meta {
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-catalog__label {
    flex: 1 1 auto;
  }

  .ai-catalog__meta {
    flex: 0 0 auto;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
  }

  :global(.ai-catalog__open-skill) {
    flex: 0 0 auto;
  }

  .ai-catalog__description {
    margin: 0;
    padding: 0.125rem 0.375rem 0.375rem 1.75rem;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    font-size: 0.75rem;
    line-height: 1.35;
    white-space: pre-wrap;
  }

  .ai-catalog__state {
    margin: 0;
    padding: 0.5rem 0.75rem;
    color: var(--ui-workspace-muted-foreground, var(--muted-foreground));
    font-size: 0.8125rem;
  }

  :global(.ai-catalog .suggestion-highlight) {
    border-radius: 0.125rem;
    color: var(--ui-search-highlight-foreground, inherit);
    background: var(
      --ui-search-highlight-background,
      color-mix(in srgb, var(--primary) 22%, transparent)
    );
  }
</style>
