<script lang="ts">
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    buildRoleActionColumns,
    type RoleAction,
    type RoleActionColumnId,
  } from "./roles/actions";
  import { ROLE_STATUSES, type RoleRecord, type RoleStatus } from "./roles/types";

  let {
    roles = [],
    now = new Date(),
    onSelect,
    onMove,
    onStatusChange,
  }: {
    roles?: readonly RoleRecord[];
    now?: Date;
    onSelect?: (role: RoleRecord) => void;
    onMove?: (action: RoleAction, target: Exclude<RoleActionColumnId, "overdue">) => void;
    onStatusChange?: (action: RoleAction, status: RoleStatus) => void;
  } = $props();

  const columns = $derived(buildRoleActionColumns(roles, now));
  const controller = ColumnCanvas.createColumnCanvasController({
    columns: {
      overdue: { defaultWidth: 280, minWidth: 230, resizable: true, collapsible: true },
      today: { defaultWidth: 280, minWidth: 230, resizable: true, collapsible: true },
      upcoming: { defaultWidth: 280, minWidth: 230, resizable: true, collapsible: true },
      waiting: { defaultWidth: 280, minWidth: 230, resizable: true, collapsible: true },
      done: { defaultWidth: 280, minWidth: 230, resizable: true, collapsible: true },
    },
  });
</script>

<section class="role-actions" data-ui-component="role-actions" aria-label="Role actions">
  <ColumnCanvas.Root controller={controller} displayMode="fixed" aria-label="Action columns">
    {#each columns as column (column.id)}
      <ColumnCanvas.Column id={column.id} title={column.title} count={column.actions.length}>
        <ColumnCanvas.Body>
          <div class="role-actions__column">
            <p>{column.description}</p>
            {#each column.actions as action (action.id)}
              <article class="role-actions__card" data-action-kind={action.kind}>
                <button class="role-actions__role" type="button" onclick={() => onSelect?.(action.role)}>
                  <strong>{action.title}</strong>
                  <span>{action.role.title}</span>
                  <span>{action.role.company}</span>
                  {#if action.dueAt}<time datetime={action.dueAt}>{action.dueAt}</time>{/if}
                </button>
                <div class="role-actions__controls" aria-label={`Move ${action.role.title} action`}>
                  {#if column.id !== "today"}<Button size="xs" variant="outline" onclick={() => onMove?.(action, "today")}>Today</Button>{/if}
                  {#if column.id !== "upcoming"}<Button size="xs" variant="outline" onclick={() => onMove?.(action, "upcoming")}>+7 days</Button>{/if}
                  {#if column.id !== "waiting"}<Button size="xs" variant="outline" onclick={() => onMove?.(action, "waiting")}>Wait</Button>{/if}
                  {#if column.id !== "done"}<Button size="xs" onclick={() => onMove?.(action, "done")}>Contacted</Button>{/if}
                  <label class="role-actions__status">
                    <span>Status</span>
                    <select
                      value={action.role.status}
                      aria-label={`Application status for ${action.role.title}`}
                      onchange={(event) => onStatusChange?.(action, event.currentTarget.value as RoleStatus)}
                    >
                      {#each ROLE_STATUSES as status}<option value={status}>{status}</option>{/each}
                    </select>
                  </label>
                </div>
              </article>
            {/each}
          </div>
        </ColumnCanvas.Body>
      </ColumnCanvas.Column>
    {/each}
  </ColumnCanvas.Root>
</section>

<style>
  .role-actions {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  .role-actions :global([data-ui-component="column-canvas"][data-ui-part="root"]) {
    width: 100%;
    height: 100%;
  }

  .role-actions__column {
    display: grid;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .role-actions__column > p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  .role-actions__card {
    display: grid;
    gap: 0.625rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    padding: 0.75rem;
  }

  .role-actions__role {
    display: grid;
    gap: 0.2rem;
    border: 0;
    background: transparent;
    color: var(--card-foreground);
    padding: 0;
    text-align: left;
  }

  .role-actions__role span,
  .role-actions__role time {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  .role-actions__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .role-actions__status {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  .role-actions__status select {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, var(--radius));
    background: var(--background);
    color: var(--foreground);
    padding: 0.2rem 0.35rem;
  }
</style>
