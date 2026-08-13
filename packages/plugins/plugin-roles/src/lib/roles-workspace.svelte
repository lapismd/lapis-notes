<script lang="ts">
  import * as Alert from "@lapismd/design-core/shadcn/alert";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import type { ColumnCanvasLayoutV1 } from "@lapismd/design-core/shadcn/column-canvas";
  import { untrack } from "svelte";
  import ApplicationsBoard from "./applications-board.svelte";
  import RoleActionsBoard from "./role-actions-board.svelte";
  import RoleActivityTimeline from "./role-activity-timeline.svelte";
  import { moveRoleAction, transitionRoleStatus, type RoleAction, type RoleActionColumnId } from "./roles/actions";
  import { RolesManager } from "./roles/roles-manager";
  import type {
    RoleRecord,
    RoleStatus,
    RolesMode,
    RolesPresentationState,
    RolesSnapshot,
  } from "./roles/types";

  let {
    manager,
    presentation,
    onPresentationChange,
    onOpenRole,
  }: {
    manager: RolesManager;
    presentation: RolesPresentationState;
    onPresentationChange?: (state: RolesPresentationState) => void | Promise<void>;
    onOpenRole?: (role: RoleRecord) => void | Promise<void>;
  } = $props();

  const initialPresentation = untrack(() => presentation);
  let presentationState = $state<RolesPresentationState>({
    ...initialPresentation,
    collapsedColumnIds: [...initialPresentation.collapsedColumnIds],
    columnWidths: { ...initialPresentation.columnWidths },
  });
  let snapshot = $state<RolesSnapshot>(untrack(() => manager.getSnapshot()));
  let mode = $state<RolesMode>(initialPresentation.mode);
  let query = $state(initialPresentation.query);
  let selectedRoleId = $state<string | undefined>(initialPresentation.selectedRoleId);
  let createOpen = $state(false);
  let company = $state("");
  let title = $state("");
  let operationError = $state<string | null>(null);
  const filteredRoles = $derived(
    snapshot.roles.filter((role) => {
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return [role.company, role.title, role.location, ...role.tags]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    }),
  );
  const layout = $derived<ColumnCanvasLayoutV1>({
    version: 1,
    columns: Object.fromEntries(
      ["saved", "applied", "screening", "interview", "offer", "rejected"].map(
        (id) => [
          id,
          {
            collapsed: presentationState.collapsedColumnIds.includes(id),
            ...(presentationState.columnWidths[id]
              ? { width: presentationState.columnWidths[id] }
              : {}),
          },
        ],
      ),
    ),
  });

  $effect(() => manager.subscribe((next) => (snapshot = next)));

  function persist(patch: Partial<RolesPresentationState>) {
    const next: RolesPresentationState = {
      ...presentationState,
      mode,
      query,
      selectedRoleId,
      ...patch,
    };
    presentationState = next;
    void onPresentationChange?.(next);
  }

  function setMode(next: RolesMode) {
    mode = next;
    persist({ mode: next });
  }

  function setQuery(next: string) {
    query = next;
    persist({ query: next });
  }

  async function openRole(role: RoleRecord) {
    selectedRoleId = role.id;
    persist({ selectedRoleId: role.id });
    await onOpenRole?.(role);
  }

  async function createRole() {
    operationError = null;
    if (!company.trim() || !title.trim()) {
      operationError = "Company and title are required.";
      return;
    }
    try {
      const role = await manager.createRole({ company: company.trim(), title: title.trim() });
      company = "";
      title = "";
      createOpen = false;
      await openRole(role);
    } catch (error) {
      operationError = error instanceof Error ? error.message : String(error);
    }
  }

  async function moveApplication(role: RoleRecord, status: RoleStatus, sortOrder: number) {
    operationError = null;
    try {
      await manager.updateRole(role.sourcePath, {
        status,
        sortOrder,
        ...(status === "applied" && !role.appliedAt
          ? { appliedAt: new Date().toISOString() }
          : {}),
      });
    } catch (error) {
      operationError = error instanceof Error ? error.message : String(error);
    }
  }

  async function moveAction(
    action: RoleAction,
    target: Exclude<RoleActionColumnId, "overdue">,
  ) {
    operationError = null;
    try {
      await manager.updateRole(action.role.sourcePath, moveRoleAction(action, target));
    } catch (error) {
      operationError = error instanceof Error ? error.message : String(error);
    }
  }

  async function changeActionStatus(action: RoleAction, status: RoleStatus) {
    operationError = null;
    try {
      await manager.updateRole(
        action.role.sourcePath,
        transitionRoleStatus(action.role, status),
      );
    } catch (error) {
      operationError = error instanceof Error ? error.message : String(error);
    }
  }

  function persistLayout(next: ColumnCanvasLayoutV1) {
    persist({
      collapsedColumnIds: Object.entries(next.columns)
        .filter(([, value]) => value.collapsed)
        .map(([id]) => id),
      columnWidths: Object.fromEntries(
        Object.entries(next.columns).flatMap(([id, value]) =>
          typeof value.width === "number" ? [[id, value.width]] : [],
        ),
      ),
    });
  }
</script>

<section class="roles-workspace" data-ui-component="roles-workspace" data-ui-part="root">
  <header class="roles-workspace__header">
    <div class="roles-workspace__title">
      <h1>Roles</h1>
      <span>{filteredRoles.length} of {snapshot.roles.length}</span>
    </div>
    <nav class="roles-workspace__modes" aria-label="Roles views">
      <Button size="sm" variant={mode === "applications" ? "default" : "ghost"} aria-pressed={mode === "applications"} onclick={() => setMode("applications")}>Applications</Button>
      <Button size="sm" variant={mode === "activity" ? "default" : "ghost"} aria-pressed={mode === "activity"} onclick={() => setMode("activity")}>Activity</Button>
      <Button size="sm" variant={mode === "actions" ? "default" : "ghost"} aria-pressed={mode === "actions"} onclick={() => setMode("actions")}>Actions</Button>
    </nav>
    <Input
      class="roles-workspace__search"
      type="search"
      value={query}
      placeholder="Filter roles"
      aria-label="Filter roles"
      oninput={(event) => setQuery(event.currentTarget.value)}
    />
    <Button size="sm" onclick={() => (createOpen = !createOpen)}>New role</Button>
  </header>

  {#if createOpen}
    <form class="roles-workspace__create" onsubmit={(event) => { event.preventDefault(); void createRole(); }}>
      <Input bind:value={company} placeholder="Company" aria-label="Company" />
      <Input bind:value={title} placeholder="Role title" aria-label="Role title" />
      <Button type="submit">Create</Button>
      <Button type="button" variant="ghost" onclick={() => (createOpen = false)}>Cancel</Button>
    </form>
  {/if}

  {#if operationError}
    <Alert.Root variant="destructive" role="alert" class="roles-workspace__alert">
      <Alert.Title>Roles action failed</Alert.Title>
      <Alert.Description>{operationError}</Alert.Description>
    </Alert.Root>
  {/if}
  {#if snapshot.diagnostics.length > 0}
    <Alert.Root variant="destructive" role="alert" class="roles-workspace__alert">
      <Alert.Title>{snapshot.diagnostics.length} role {snapshot.diagnostics.length === 1 ? "file needs" : "files need"} attention</Alert.Title>
      <Alert.Description>{snapshot.diagnostics.map((item) => `${item.path}: ${item.message}`).join(" ")}</Alert.Description>
    </Alert.Root>
  {/if}

  <div class="roles-workspace__body">
    {#if mode === "applications"}
      <ApplicationsBoard
        roles={filteredRoles}
        {selectedRoleId}
        {layout}
        onSelect={openRole}
        onMove={moveApplication}
        onLayoutChange={persistLayout}
      />
    {:else if mode === "activity"}
      <RoleActivityTimeline roles={filteredRoles} onSelect={openRole} />
    {:else}
      <RoleActionsBoard roles={filteredRoles} onSelect={openRole} onMove={moveAction} onStatusChange={changeActionStatus} />
    {/if}
  </div>
</section>

<style>
  .roles-workspace {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    background: var(--ui-workspace-view-background, var(--background));
    color: var(--ui-workspace-view-foreground, var(--foreground));
  }

  .roles-workspace__header {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.625rem;
    border-bottom: 1px solid var(--border);
    padding: 0.625rem 0.75rem;
    overflow-x: auto;
  }

  .roles-workspace__title {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
  }

  .roles-workspace__title h1 {
    margin: 0;
    font-size: 1rem;
  }

  .roles-workspace__title span {
    color: var(--muted-foreground);
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .roles-workspace__modes {
    display: flex;
    gap: 0.125rem;
  }

  :global(.roles-workspace__search) {
    width: min(18rem, 30vw);
    margin-inline-start: auto;
  }

  .roles-workspace__create {
    display: grid;
    grid-template-columns: minmax(8rem, 1fr) minmax(10rem, 1fr) auto auto;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border);
    padding: 0.75rem;
  }

  :global(.roles-workspace__alert) {
    margin: 0.5rem 0.75rem 0;
    flex: 0 0 auto;
  }

  .roles-workspace__body {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  @media (max-width: 760px) {
    .roles-workspace__header {
      flex-wrap: wrap;
    }

    :global(.roles-workspace__search) {
      width: 100%;
      order: 2;
    }

    .roles-workspace__create {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
