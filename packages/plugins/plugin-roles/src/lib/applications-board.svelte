<script lang="ts">
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import type { ColumnCanvasLayoutV1 } from "@lapismd/design-core/shadcn/column-canvas";
  import type { RoleRecord, RoleStatus } from "./roles/types";

  let {
    roles = [],
    selectedRoleId,
    layout = null,
    onSelect,
    onMove,
    onLayoutChange,
  }: {
    roles?: readonly RoleRecord[];
    selectedRoleId?: string;
    layout?: ColumnCanvasLayoutV1 | null;
    onSelect?: (role: RoleRecord) => void;
    onMove?: (role: RoleRecord, status: RoleStatus, sortOrder: number) => void;
    onLayoutChange?: (layout: ColumnCanvasLayoutV1) => void;
  } = $props();

  const columns: Array<{ id: RoleStatus; title: string; description: string }> = [
    { id: "saved", title: "Saved", description: "Roles to consider" },
    { id: "applied", title: "Applied", description: "Applications submitted" },
    { id: "screening", title: "Screening", description: "Initial conversations" },
    { id: "interview", title: "Interview", description: "Interview process" },
    { id: "offer", title: "Offer", description: "Offers received" },
    { id: "rejected", title: "Rejected", description: "Closed opportunities" },
  ];
  const controller = ColumnCanvas.createColumnCanvasController({
    columns: Object.fromEntries(
      columns.map((column) => [
        column.id,
        {
          defaultWidth: 288,
          minWidth: 240,
          maxWidth: 440,
          collapsible: true,
          resizable: true,
        },
      ]),
    ) as Record<RoleStatus, ColumnCanvas.ColumnCanvasColumnConfig>,
    persistence: {
      load: async () => layout,
      save: async (next) => onLayoutChange?.(next),
    },
  });
  let draggedRoleId = $state<string | null>(null);

  function rolesFor(status: RoleStatus) {
    return roles
      .filter((role) => role.status === status)
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }

  function move(role: RoleRecord, status: RoleStatus) {
    const targetRoles = rolesFor(status).filter((candidate) => candidate.id !== role.id);
    const sortOrder = (targetRoles.at(-1)?.sortOrder ?? 0) + 1000;
    onMove?.(role, status, sortOrder);
  }

  function keyboardMove(event: KeyboardEvent, role: RoleRecord) {
    if (!event.altKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const current = columns.findIndex((column) => column.id === role.status);
    const offset = event.key === "ArrowLeft" ? -1 : 1;
    const target = columns[current + offset];
    if (target) move(role, target.id);
  }
</script>

<section class="roles-board" data-ui-component="roles-applications" aria-label="Applications board">
  <ColumnCanvas.Root controller={controller} displayMode="fixed" aria-label="Application status columns">
    {#each columns as column (column.id)}
      <ColumnCanvas.Column id={column.id} title={column.title} count={rolesFor(column.id).length}>
        <ColumnCanvas.Body>
          <div
            class="roles-board__drop-zone"
            data-status={column.id}
            role="group"
            aria-label={`${column.title} applications`}
            ondragover={(event) => event.preventDefault()}
            ondrop={(event) => {
              event.preventDefault();
              const role = roles.find((candidate) => candidate.id === draggedRoleId);
              if (role) move(role, column.id);
              draggedRoleId = null;
            }}
          >
            <p class="roles-board__description">{column.description}</p>
            {#each rolesFor(column.id) as role (role.id)}
              <ColumnCanvas.Item
                selected={selectedRoleId === role.id}
                draggable="true"
                aria-label={`${role.title} at ${role.company}`}
                onclick={() => onSelect?.(role)}
                onkeydown={(event) => keyboardMove(event, role)}
                ondragstart={(event) => {
                  draggedRoleId = role.id;
                  event.dataTransfer?.setData("text/plain", role.id);
                }}
                ondragend={() => (draggedRoleId = null)}
              >
                <span class="roles-board__card-title">{role.title}</span>
                <span class="roles-board__company">{role.company}</span>
                <span class="roles-board__meta">
                  {#if role.location}<span>{role.location}</span>{/if}
                  {#if role.followUpAt}<Badge variant="outline">Follow up {role.followUpAt}</Badge>{/if}
                </span>
              </ColumnCanvas.Item>
            {/each}
          </div>
        </ColumnCanvas.Body>
      </ColumnCanvas.Column>
    {/each}
  </ColumnCanvas.Root>
</section>

<style>
  .roles-board {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  .roles-board :global([data-ui-component="column-canvas"][data-ui-part="root"]) {
    width: 100%;
    height: 100%;
  }

  .roles-board__drop-zone {
    display: flex;
    min-height: 100%;
    flex-direction: column;
    gap: 0.625rem;
    padding: 0.75rem;
  }

  .roles-board__description {
    margin: 0 0 0.25rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  .roles-board :global([data-ui-part="column-item"]) {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.3rem;
    text-align: left;
  }

  .roles-board__card-title {
    font-weight: 600;
  }

  .roles-board__company,
  .roles-board__meta {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  .roles-board__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
</style>
