<script lang="ts">
  import LegacyApplicationCard from "./legacy-application-card.svelte";
  import { buildRoleActivityEvents, groupRoleActivityByDay, type RoleActivityEvent } from "./roles/activity";
  import type { RoleRecord, RoleStatus } from "./roles/types";

  let { roles = [], onSelect }: { roles?: readonly RoleRecord[]; onSelect?: (role: RoleRecord) => void } = $props();
  const days = $derived(groupRoleActivityByDay(buildRoleActivityEvents(roles)));
  const colors: Record<RoleStatus,string> = {saved:"#2563eb",applied:"#0891b2",screening:"#ca8a04",interview:"#059669",offer:"#db2777",rejected:"#6b7280"};
  const buckets = [
    {id:"added",title:"Added",test:(event:RoleActivityEvent)=>event.kind==="added"},
    {id:"updated",title:"Updated",test:(event:RoleActivityEvent)=>["updated","applied"].includes(event.kind)},
    {id:"follow-up",title:"Follow-up / Closed",test:(event:RoleActivityEvent)=>!["added","updated","applied"].includes(event.kind)},
  ];
  function dayLabel(value:string){return new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"});}
  function gapRange(date:string,gap:number){const end=new Date(`${date}T12:00:00`);end.setDate(end.getDate()+gap);return `${dayLabel(date)} – ${dayLabel(end.toISOString().slice(0,10))}`;}
  function time(value:string){return new Date(value).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}
  function displayNumber(role:RoleRecord){const columnIndex=["saved","applied","screening","interview","offer","rejected"].indexOf(role.status);const itemIndex=roles.filter((item)=>item.status===role.status).sort((a,b)=>a.sortOrder-b.sortOrder).findIndex((item)=>item.id===role.id);return columnIndex*100+itemIndex+1;}
</script>

<div class="application-activity-view" data-ui-component="role-activity" aria-label="Application activity">
  <section class="events">
    {#each days as day (day.date)}
      {#if day.gapDays>0}<div class="events__gap" aria-label={`${day.gapDays} days without activity`}><time class="events__gap-range" datetime={day.date}>{gapRange(day.date,day.gapDays)}</time><p>No activity for {day.gapDays} {day.gapDays===1?"day":"days"}</p></div>{/if}
      <div class="events__day">
        <header class="events__day-header"><time class="events__day-time" datetime={day.date}>{dayLabel(day.date)}</time></header>
        <div class="events__columns">
          {#each buckets as bucket}
            {@const items=day.events.filter(bucket.test)}
            <div class="events__column" aria-label={`${bucket.title} activity for ${dayLabel(day.date)}`}>
              <h2 class="events__column-header"><span>{bucket.title}</span><time datetime={day.date}>{dayLabel(day.date).replace(/^\w+\s/,"")}</time><span>({items.length})</span></h2>
              <div class="events__time-block">
                {#each items as event (event.id)}<article class="activity-event"><header><span>{event.kind.replace("-"," ")}</span><time datetime={event.occurredAt}>{time(event.occurredAt)}</time></header><LegacyApplicationCard role={event.role} columnColor={colors[event.role.status]} displayNumber={displayNumber(event.role)} onSelect={()=>onSelect?.(event.role)} onOpen={()=>onSelect?.(event.role)} /></article>
                {:else}<div class="events__none">No {bucket.title.toLowerCase()} activity</div>{/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}<div class="application-board-alert" role="status">No application activity</div>{/each}
  </section>
</div>

<style>
  .application-activity-view{min-height:0;flex:1;overflow:auto}.events{--events-gap:1ch;--events-border:1px solid var(--kanban-border);--events-day-header-height:1.75rem;padding:0 clamp(.75rem,2vw,1.5rem) 1.5rem}.events__day+.events__gap,.events__gap+.events__day,.events__day+.events__day{margin-block-start:2rem}
  .events__gap{display:grid;justify-items:center;gap:.45rem;color:var(--kanban-muted);padding:1.35rem clamp(.75rem,2vw,1.5rem);text-align:center;text-transform:uppercase}.events__gap-range,.events__day-time{display:inline-flex;min-height:var(--events-day-header-height);align-items:center;border-radius:.25rem;background:var(--kanban-foreground);color:var(--kanban-background);font-size:.72rem;font-weight:950;padding-inline:1.5ch}.events__gap p{margin:0;font-size:.75rem;font-weight:900}
  .events__day-header{block-size:0;margin-block-start:calc(var(--events-day-header-height)/2);position:relative;z-index:3}.events__day-time{position:absolute;inset:0 auto auto 50%;translate:-50% -50%;text-transform:uppercase}.events__columns{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:var(--events-border)}.events__columns::before,.events__columns::after{position:absolute;inset-block:0;border-inline-start:var(--events-border);content:""}.events__columns::before{inset-inline-start:calc(100%/3)}.events__columns::after{inset-inline-end:calc(100%/3)}
  .events__column{display:grid;min-width:0;grid-template-rows:auto minmax(0,1fr)}.events__column-header{position:sticky;top:0;z-index:45;display:flex;min-height:2.4rem;align-items:center;justify-content:center;gap:.35rem;border-bottom:var(--events-border);background:linear-gradient(180deg,var(--kanban-card),color-mix(in srgb,var(--kanban-card) 94%,var(--kanban-background)));color:var(--kanban-muted);margin:0 0 var(--events-gap);padding:calc(.4rem + var(--events-day-header-height)*.5) calc(var(--events-gap)*1.5) .4rem;font-size:.72rem;font-weight:900;text-align:center;text-transform:uppercase;white-space:nowrap}
  .events__time-block{display:grid;align-content:start;gap:var(--events-gap);padding:0 calc(var(--events-gap)*2) calc(var(--events-gap)*3)}.activity-event{display:grid;gap:.4rem;min-width:0}.activity-event>header{display:flex;min-height:.9rem;align-items:center;justify-content:space-between;gap:.75rem;color:var(--kanban-muted);font-size:.7rem;font-weight:950;line-height:1;text-transform:uppercase}.events__none{display:grid;min-height:8rem;place-items:center;margin-top:1.3rem;border:1px dashed var(--kanban-border);border-radius:.5rem;background:color-mix(in srgb,var(--kanban-card) 56%,transparent);color:var(--kanban-muted);font-size:.75rem;font-weight:900;padding:1.5rem;text-align:center;text-transform:uppercase}.application-board-alert{margin:.6rem 1rem;border:1px solid var(--kanban-border);padding:.7rem}
  @media(max-width:639.98px){.events__columns{grid-template-columns:1fr}.events__columns::before,.events__columns::after{display:none}}
</style>
