<script lang="ts">
  import BellIcon from "@lucide/svelte/icons/bell";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ClockIcon from "@lucide/svelte/icons/clock";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
  import PhoneCallIcon from "@lucide/svelte/icons/phone-call";
  import SendIcon from "@lucide/svelte/icons/send";
  import { buildRoleActionColumns, type RoleAction, type RoleActionColumnId } from "./roles/actions";
  import type { RoleRecord, RoleStatus } from "./roles/types";

  let { roles=[], now=new Date(), onSelect, onMove, onStatusChange }: {roles?:readonly RoleRecord[];now?:Date;onSelect?:(role:RoleRecord)=>void;onMove?:(action:RoleAction,target:Exclude<RoleActionColumnId,"overdue">)=>void;onStatusChange?:(action:RoleAction,status:RoleStatus)=>void}=$props();
  const colors:Record<RoleActionColumnId,string>={overdue:"#dc2626",today:"#0891b2",upcoming:"#2563eb",waiting:"#ca8a04",done:"#059669"};
  const columns=$derived(buildRoleActionColumns(roles,now));
  let expanded=$state<RoleActionColumnId[]>(["overdue","today","upcoming","waiting","done"]);
  let dragged=$state<RoleAction|null>(null);
  function toggle(id:RoleActionColumnId){if(expanded.includes(id)){if(expanded.length===1)return;expanded=expanded.filter((item)=>item!==id)}else expanded=[...expanded,id]}
  function dateLabel(value:string|undefined){if(!value)return "No date";const date=new Date(value);return Number.isNaN(date.valueOf())?value:date.toLocaleDateString(undefined,{month:"short",day:"numeric"})}
  function snooze(action:RoleAction){onMove?.(action,"upcoming")}
</script>

<div class="actions-board-scroll" data-ui-component="role-actions" aria-label="Role actions"><div class="actions-board-columns">
  {#each columns as column (column.id)}
    {#if expanded.includes(column.id)}
      <section class="actions-column" style={`--column-color:${colors[column.id]};--card-count:${Math.min(column.actions.length,15)}`} aria-label={`${column.title} actions`} ondragover={(event)=>{if(column.id!=="overdue")event.preventDefault()}} ondrop={(event)=>{event.preventDefault();if(dragged&&column.id!=="overdue")onMove?.(dragged,column.id);dragged=null}}>
        <header class="actions-column-header"><button type="button" class="column-pill" aria-label={`Collapse ${column.title}`} onclick={()=>toggle(column.id)}><span class="column-count">{column.actions.length}</span><h2>{column.title}</h2><ChevronDownIcon /></button><button type="button" class="column-menu" aria-label={`Column options for ${column.title} actions`}><MoreHorizontalIcon /></button><p>{column.description}</p></header>
        <div class="actions-column-body"><div class="actions-column-body__content">
          {#each column.actions as action (action.id)}
            <article class="action-card" draggable={column.id!=="done"} ondragstart={()=>dragged=action} ondragend={()=>dragged=null}>
              <header class="action-card-meta"><span>{#if action.kind==="waiting"}<ClockIcon />{:else}<BellIcon />{/if}{action.kind==="waiting"?"Waiting":"Follow-up"}</span><time>{action.completedAt?`Contacted ${dateLabel(action.completedAt)}`:action.dueAt?`Follow-up ${dateLabel(action.dueAt)}`:"Waiting for next action"}</time></header>
              <button type="button" class="action-title" title={`Open ${action.role.title} at ${action.role.company}`} onclick={()=>onSelect?.(action.role)}><strong>{action.title}</strong><span>{action.role.title} at {action.role.company}</span></button>
              <footer class="action-card-actions">
                <button type="button" title={`Log follow-up for ${action.role.title}`} onclick={()=>onSelect?.(action.role)}><MessageCircleIcon /><span>Log</span></button>
                <button type="button" title="Snooze action" onclick={()=>snooze(action)}><ClockIcon /><span>Snooze</span></button>
                <button type="button" title={`Mark ${action.role.title} contacted`} onclick={()=>onMove?.(action,"done")}><PhoneCallIcon /><span>Contacted</span></button>
                <button type="button" title={`Move ${action.role.title} to screening`} onclick={()=>onStatusChange?.(action,"screening")}><SendIcon /><span>Screening</span></button>
              </footer>
            </article>
          {:else}<div class="actions-empty">No {column.title.toLowerCase()} actions</div>{/each}
        </div></div>
      </section>
    {:else}<button type="button" class="collapsed-actions-column" style={`--column-color:${colors[column.id]};--card-count:${Math.min(column.actions.length,15)}`} aria-label={`Expand ${column.title}, ${column.actions.length} actions`} onclick={()=>toggle(column.id)}><span class="collapsed-progress"></span><span class="column-count">{column.actions.length}</span><span>{column.title}</span></button>{/if}
  {/each}
</div></div>

<style>
  .actions-board-scroll{min-height:0;flex:1;overflow:auto hidden}.actions-board-columns{display:flex;min-width:max-content;height:100%;align-items:stretch;gap:.5rem;padding:.75rem 1rem 1.25rem}.actions-column{display:grid;width:min(24rem,82vw);min-width:18rem;flex-shrink:0;grid-template-rows:auto minmax(0,1fr);gap:.65rem;border:1px solid color-mix(in srgb,var(--column-color) 18%,var(--kanban-border));border-radius:.65rem;background:color-mix(in srgb,var(--kanban-card) 82%,transparent);padding:.75rem}
  .actions-column-header{display:grid;grid-template-columns:minmax(0,1fr) 2.15rem;gap:.35rem .5rem;align-items:center;text-align:center}.actions-column-header p{grid-column:1/-1;margin:0;color:var(--kanban-muted);font-size:.72rem;font-weight:800}.column-pill{position:relative;display:inline-flex;width:100%;min-width:0;height:2.35rem;align-items:center;justify-content:center;gap:.45rem;overflow:hidden;border:0;border-radius:999px;color:var(--column-color);background:linear-gradient(90deg,color-mix(in srgb,var(--column-color) 18%,var(--kanban-card)),var(--kanban-card) 74%),color-mix(in srgb,var(--column-color) 6%,var(--kanban-card));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--column-color) 16%,transparent),0 1px 2px var(--kanban-shadow);cursor:pointer;padding:0 .75rem;text-transform:uppercase}.column-pill::before{position:absolute;inset:0 auto 0 0;width:calc(2.35rem + var(--card-count)*.35rem);max-width:58%;border-radius:inherit;background:linear-gradient(90deg,var(--column-color),color-mix(in srgb,var(--column-color) 55%,var(--kanban-card)));opacity:.13;content:""}.column-count{z-index:1;display:inline-grid;min-width:1.75rem;height:1.75rem;place-items:center;border-radius:999px;background:var(--column-color);color:white;font-size:.7rem;font-weight:950}.column-pill h2{z-index:1;min-width:0;overflow:hidden;font-size:.74rem;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.column-pill :global(svg),.column-menu :global(svg){z-index:1;width:1rem;height:1rem}.column-menu{display:grid;width:2.15rem;height:2.15rem;place-items:center;border:0;border-radius:999px;background:transparent;color:var(--column-color);cursor:pointer}
  .actions-column-body{min-height:0;overflow:auto}.actions-column-body__content{display:grid;align-content:start;gap:.65rem;padding-right:.85rem}.action-card{display:grid;gap:.65rem;border:1px solid color-mix(in srgb,var(--column-color) 18%,var(--kanban-border));border-radius:.45rem;background:color-mix(in srgb,var(--kanban-card) 94%,transparent);box-shadow:0 12px 28px color-mix(in srgb,var(--column-color) 8%,transparent);color:var(--kanban-card-foreground);padding:.7rem}.action-card-meta{display:flex;align-items:center;justify-content:space-between;gap:.4rem}.action-card-meta span,.action-card-meta time{display:inline-flex;align-items:center;gap:.3rem;color:var(--kanban-muted);font-size:.68rem;font-weight:950;text-transform:uppercase}.action-card-meta :global(svg){width:.875rem;height:.875rem}.action-title{display:grid;gap:.2rem;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;padding:0;text-align:left}.action-title strong{font-size:1rem;font-weight:950;line-height:1.1}.action-title span{color:var(--kanban-muted);font-size:.78rem;font-weight:800}
  .action-card-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem}.action-card-actions button{display:inline-flex;height:1.9rem;align-items:center;gap:.25rem;border:1px solid color-mix(in srgb,var(--column-color) 18%,var(--kanban-border));border-radius:999px;background:transparent;color:var(--column-color);cursor:pointer;font:inherit;font-size:.68rem;font-weight:950;padding:0 .55rem}.action-card-actions button:hover{background:color-mix(in srgb,var(--column-color) 10%,transparent)}.action-card-actions :global(svg){width:.875rem;height:.875rem}.actions-empty{display:block;width:min(100%,26rem);margin:.75rem auto;border:2px dashed color-mix(in srgb,var(--kanban-border) 78%,transparent);border-radius:.4rem;color:var(--kanban-muted);font-size:1.1875rem;padding:1.15rem 1.55rem;rotate:-3deg;text-align:center}
  .collapsed-actions-column{--progress-height:min(calc(2.5rem + var(--card-count)*1.35rem),50dvh);position:relative;display:flex;width:2.5rem;height:100%;flex-shrink:0;align-items:center;flex-direction:column;gap:.7rem;overflow:hidden;border:0;border-radius:999px;color:var(--column-color);background:linear-gradient(180deg,color-mix(in srgb,var(--column-color) 18%,var(--kanban-card)),var(--kanban-card) 72%);cursor:pointer;padding:0}.collapsed-progress{position:absolute;inset:0 0 auto;height:var(--progress-height);border-radius:inherit;background:linear-gradient(180deg,var(--column-color),color-mix(in srgb,var(--column-color) 28%,var(--kanban-card)));opacity:.2}.collapsed-actions-column .column-count{margin-top:.35rem}.collapsed-actions-column>span:last-child{z-index:1;font-size:.72rem;font-weight:950;text-transform:uppercase;writing-mode:vertical-rl}
</style>
