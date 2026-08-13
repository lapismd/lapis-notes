<script lang="ts">
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import Grid2X2Icon from "@lucide/svelte/icons/grid-2x2";
  import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
  import PinIcon from "@lucide/svelte/icons/pin";
  import type { ColumnCanvasLayoutV1 } from "@lapismd/design-core/shadcn/column-canvas";
  import LegacyApplicationCard from "./legacy-application-card.svelte";
  import type { RoleRecord, RoleStatus } from "./roles/types";

  let { roles = [], selectedRoleId, layout = null, onSelect, onMove, onLayoutChange }: {
    roles?: readonly RoleRecord[];
    selectedRoleId?: string;
    layout?: ColumnCanvasLayoutV1 | null;
    onSelect?: (role: RoleRecord) => void;
    onMove?: (role: RoleRecord, status: RoleStatus, sortOrder: number) => void;
    onLayoutChange?: (layout: ColumnCanvasLayoutV1) => void;
  } = $props();

  const columns: Array<{ id: RoleStatus; title: string; color: string }> = [
    { id:"saved", title:"Saved", color:"#2563eb" }, { id:"applied", title:"Applied", color:"#0891b2" },
    { id:"screening", title:"Screening", color:"#ca8a04" }, { id:"interview", title:"Interview", color:"#059669" },
    { id:"offer", title:"Offer", color:"#db2777" }, { id:"rejected", title:"Rejected", color:"#6b7280" },
  ];
  let expanded = $state<RoleStatus[]>(["saved", "applied"]);
  let draggedRoleId = $state<string | null>(null);
  let pinsOpen = $state(false);

  function rolesFor(status: RoleStatus) { return roles.filter((role) => role.status === status).sort((a,b) => a.sortOrder-b.sortOrder); }
  function move(role: RoleRecord, status: RoleStatus) { const target = rolesFor(status).filter((item) => item.id !== role.id); onMove?.(role,status,(target.at(-1)?.sortOrder ?? 0)+1000); }
  $effect(() => {
    const next = columns
      .filter((column) => !(layout?.columns[column.id]?.collapsed ?? !["saved", "applied"].includes(column.id)))
      .map((column) => column.id);
    if (next.length && next.join("|") !== expanded.join("|")) expanded = next;
  });

  function updateExpanded(next: RoleStatus[]) {
    expanded = next;
    onLayoutChange?.({ version:1, columns:Object.fromEntries(columns.map((column) => [column.id,{ collapsed:!next.includes(column.id), ...(layout?.columns[column.id]?.width ? {width:layout.columns[column.id]!.width}: {}) }])) });
  }
  function toggle(status: RoleStatus) {
    if (expanded.includes(status)) {
      if (expanded.length === 1) return;
      updateExpanded(expanded.filter((item) => item !== status));
    } else updateExpanded([...expanded,status]);
  }
  const pinnedRoles = $derived(roles.filter((role) => role.pinned));
</script>

<div class="application-board-scroll" data-ui-component="roles-applications" role="region" aria-label="Applications board">
  <div class="application-board-columns">
    {#each columns as column, columnIndex (column.id)}
      {@const items = rolesFor(column.id)}
      <section class="application-kanban-column" class:is-expanded={expanded.includes(column.id)} class:is-collapsed={!expanded.includes(column.id)} style={`--column-color:${column.color};--card-count:${Math.min(items.length,15)}`} aria-label={column.title}
        ondragover={(event) => { if (draggedRoleId) event.preventDefault(); }}
        ondrop={(event) => { event.preventDefault(); const role=roles.find((item)=>item.id===(event.dataTransfer?.getData("text/plain")||draggedRoleId)); if(role) move(role,column.id); draggedRoleId=null; }}>
        <div class="column-shell">
          {#if expanded.includes(column.id)}
            <header class="column-header">
              <button class="column-icon-button" type="button" aria-label={`Column options for ${column.title}`}><MoreHorizontalIcon /></button>
              <button class="column-pill" type="button" aria-label={`Collapse ${column.title}`} aria-expanded="true" onclick={() => toggle(column.id)}><span class="column-count">{items.length}</span><h2>{column.title}</h2><ChevronDownIcon /></button>
              <button class="column-icon-button" type="button" aria-label={`Maximize ${column.title} column`} onclick={() => updateExpanded([column.id])}><Grid2X2Icon /></button>
            </header>
            <div class="column-cards"><div class="column-card-stack">
              {#each items as role, applicationIndex (role.id)}
                <LegacyApplicationCard {role} columnColor={column.color} displayNumber={columnIndex*100+applicationIndex+1} selected={selectedRoleId===role.id} canMoveLeft={columnIndex>0} canMoveRight={columnIndex<columns.length-1}
                  onMoveLeft={() => move(role,columns[columnIndex-1]!.id)} onMoveRight={() => move(role,columns[columnIndex+1]!.id)} onSelect={() => onSelect?.(role)} onOpen={() => onSelect?.(role)} onDragStart={() => draggedRoleId=role.id} onDragEnd={() => draggedRoleId=null} />
              {:else}<div class="column-empty">No applications</div>{/each}
            </div></div>
          {:else}
            <button class="collapsed-column-button" type="button" aria-label={`Expand ${column.title}, ${items.length} applications`} aria-expanded="false" onclick={() => toggle(column.id)}><span class="collapsed-progress" aria-hidden="true"></span><span class="collapsed-count" aria-hidden="true">{items.length}</span><span class="collapsed-title" aria-hidden="true">{column.title}</span></button>
          {/if}
        </div>
      </section>
    {/each}
  </div>
</div>

{#if pinnedRoles.length}
  <section class:opens={pinsOpen} class="pins-corner" aria-label="Pinned applications">
    <button type="button" class="pins-stack-toggle" aria-label={`${pinsOpen?"Close":"Open"} pins stack, ${pinnedRoles.length} pinned items`} onclick={() => pinsOpen=!pinsOpen}>
      {#each pinnedRoles as role,index (role.id)}<span class="pin-card" aria-hidden="true" style={`--pin-index:${index};--card-color:${columns.find((column)=>column.id===role.status)?.color}`}><span class="pin-board"><PinIcon /> No. {index+1} - {role.company}</span><strong>{role.title}</strong><span>{role.updatedAt}</span></span>{/each}
    </button>
  </section>
{/if}

<style>
  .application-board-scroll { min-height:0; flex:1; overflow:auto hidden; scroll-snap-type:x proximity; }
  .application-board-columns { display:flex; min-width:max-content; height:100%; align-items:stretch; gap:.5rem; padding:.75rem 1rem 1.25rem; }
  .application-kanban-column { --column-width-collapsed:2.5rem; --column-width-expanded:min(86vw,28rem); flex-shrink:0; height:100%; scroll-snap-align:center; transition:width 300ms cubic-bezier(.2,.9,.25,1); }
  .application-kanban-column.is-expanded{width:var(--column-width-expanded)} .application-kanban-column.is-collapsed{width:var(--column-width-collapsed)}
  .column-shell { --column-wash:color-mix(in srgb,var(--column-color) 6%,var(--kanban-card)); height:100%; border-radius:1.35rem; overflow:hidden; }
  .column-header{position:relative;z-index:5;display:grid;grid-template-columns:2.5rem minmax(0,1fr) 2.5rem;align-items:center;gap:.5rem;padding:.65rem 1rem .5rem}
  .column-icon-button{display:grid;width:2.5rem;height:2.5rem;place-items:center;border:0;border-radius:999px;background:transparent;color:var(--column-color);cursor:pointer;opacity:.72}.column-icon-button:hover{background:color-mix(in srgb,var(--column-color) 12%,var(--kanban-card))}
  .column-icon-button :global(svg),.column-pill :global(svg){width:1rem;height:1rem}
  .column-pill{display:inline-flex;min-width:0;height:2.5rem;align-items:center;justify-content:center;gap:.45rem;overflow:hidden;border:0;border-radius:999px;color:var(--column-color);background:linear-gradient(90deg,color-mix(in srgb,var(--column-color) 18%,var(--kanban-card)),var(--kanban-card) 74%),var(--column-wash);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--column-color) 16%,transparent),0 1px 2px var(--kanban-shadow);cursor:pointer;padding:0 .75rem;text-transform:uppercase}
  .column-pill h2{min-width:0;overflow:hidden;font-size:.75rem;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap}.column-count,.collapsed-count{z-index:1;display:inline-grid;min-width:1.9rem;height:1.9rem;place-items:center;border-radius:999px;background:var(--column-color);color:white;font-size:.72rem;font-weight:950;line-height:1}
  .column-cards{position:relative;z-index:1;min-height:0;height:calc(100% - 3.65rem);overflow:auto}.column-card-stack{display:flex;flex-direction:column;gap:1rem;padding:.9rem 1.2rem .75rem .55rem}.column-empty{display:block;width:min(100%,26rem);margin:.5rem auto;border:2px dashed color-mix(in srgb,var(--kanban-border) 78%,transparent);border-radius:.4rem;color:var(--kanban-muted);font-size:1.1875rem;padding:1.15rem 1.55rem;rotate:-3deg;text-align:center}
  .collapsed-column-button{--progress-height:min(calc(var(--column-width-collapsed) + var(--card-count)*1.35rem),50dvh);position:relative;display:flex;height:100%;width:100%;align-items:center;flex-direction:column;gap:.7rem;overflow:hidden;border:0;border-radius:999px;color:var(--column-color);background:linear-gradient(180deg,color-mix(in srgb,var(--column-color) 18%,var(--kanban-card)),var(--kanban-card) 72%),var(--column-wash);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--column-color) 16%,transparent),0 1px 2px var(--kanban-shadow);cursor:pointer;padding:0}.collapsed-progress{position:absolute;inset:0 0 auto;height:var(--progress-height);border-radius:inherit;background:linear-gradient(180deg,var(--column-color),color-mix(in srgb,var(--column-color) 28%,var(--kanban-card)));opacity:.2}.collapsed-count{width:2.5rem;height:2.5rem}.collapsed-title{z-index:1;max-height:48dvh;padding-block:.25rem;font-size:.7rem;font-weight:950;text-transform:uppercase;white-space:nowrap;writing-mode:vertical-rl}
  .pins-corner{position:absolute;bottom:.4rem;left:.4rem;z-index:20;width:min(22rem,calc(100vw - 1rem));pointer-events:none}.pins-stack-toggle{position:relative;display:block;width:100%;min-height:5.25rem;border:0;background:transparent;color:var(--kanban-card-foreground);cursor:pointer;padding:0;pointer-events:auto;text-align:left}.pin-card{--pin-offset:calc(var(--pin-index)*-.45rem);display:grid;width:100%;translate:0 var(--pin-offset);gap:.25rem;border:1px solid color-mix(in srgb,var(--card-color) 16%,var(--kanban-border));border-radius:.3rem;background:color-mix(in srgb,var(--kanban-card) 92%,transparent);box-shadow:0 10px 28px var(--kanban-shadow);padding:.55rem .75rem}.pin-card:not(:first-child){margin-top:-3.6rem}.opens .pin-card{margin-top:.4rem;translate:0 0}.pin-card strong{overflow:hidden;font-size:.95rem;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.pin-card>span:last-child{overflow:hidden;color:var(--kanban-muted);font-size:.78rem;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.pin-board{display:inline-flex;width:fit-content;align-items:center;gap:.3rem;border-radius:.14rem;background:var(--card-color);color:white;font-size:.68rem;font-weight:950;padding:.22rem .45rem;text-transform:uppercase}.pin-board :global(svg){width:.75rem;height:.75rem}
  @media(min-width:768px){.application-kanban-column.is-expanded{width:28rem}}
</style>
