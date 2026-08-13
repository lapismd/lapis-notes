<script lang="ts">
  import ActivityIcon from "@lucide/svelte/icons/activity";
  import BellIcon from "@lucide/svelte/icons/bell";
  import Columns3Icon from "@lucide/svelte/icons/columns-3";
  import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";
  import type { ColumnCanvasLayoutV1 } from "@lapismd/design-core/shadcn/column-canvas";
  import { untrack } from "svelte";
  import ApplicationsBoard from "./applications-board.svelte";
  import RoleActionsBoard from "./role-actions-board.svelte";
  import RoleActivityTimeline from "./role-activity-timeline.svelte";
  import { moveRoleAction, transitionRoleStatus, buildRoleActions, type RoleAction, type RoleActionColumnId } from "./roles/actions";
  import { RolesManager } from "./roles/roles-manager";
  import type { RoleRecord, RoleStatus, RolesMode, RolesPresentationState, RolesSnapshot } from "./roles/types";

  let { manager, presentation, onPresentationChange, onOpenRole }: {manager:RolesManager;presentation:RolesPresentationState;onPresentationChange?:(state:RolesPresentationState)=>void|Promise<void>;onOpenRole?:(role:RoleRecord)=>void|Promise<void>}=$props();
  const initial=untrack(()=>presentation);
  let presentationState = $state<RolesPresentationState>({ ...initial, collapsedColumnIds: [...initial.collapsedColumnIds], columnWidths: { ...initial.columnWidths } });
  let snapshot = $state<RolesSnapshot>(untrack(() => manager.getSnapshot()));
  let mode = $state<RolesMode>(initial.mode);
  let query = $state(initial.query);
  let selectedRoleId = $state<string | undefined>(initial.selectedRoleId);
  let createOpen = $state(false);
  let company = $state("");
  let title = $state("");
  let operationError = $state<string | null>(null);
  const filteredRoles=$derived(snapshot.roles.filter((role)=>{const needle=query.trim().toLowerCase();return !needle||[role.company,role.title,role.location,...role.tags].filter(Boolean).some((value)=>value!.toLowerCase().includes(needle))}));
  const layout=$derived<ColumnCanvasLayoutV1>({version:1,columns:Object.fromEntries(["saved","applied","screening","interview","offer","rejected"].map((id)=>[id,{collapsed:presentationState.collapsedColumnIds.includes(id),...(presentationState.columnWidths[id]?{width:presentationState.columnWidths[id]}:{})}]))});
  const modeTitle=$derived(mode==="applications"?"Applications":mode==="activity"?"Activity":"Actions");
  const attentionCount=$derived(buildRoleActions(filteredRoles).filter((action)=>["overdue","today"].includes(action.columnId)).length);
  $effect(()=>manager.subscribe((next)=>snapshot=next));
  function persist(patch:Partial<RolesPresentationState>){const next={...presentationState,mode,query,selectedRoleId,...patch};presentationState=next;void onPresentationChange?.(next)}
  function setMode(next:RolesMode){mode=next;persist({mode:next})}function setQuery(next:string){query=next;persist({query:next})}
  async function openRole(role:RoleRecord){selectedRoleId=role.id;persist({selectedRoleId:role.id});await onOpenRole?.(role)}
  async function createRole(){operationError=null;if(!company.trim()||!title.trim()){operationError="Company and title are required.";return}try{const role=await manager.createRole({company:company.trim(),title:title.trim()});company="";title="";createOpen=false;await openRole(role)}catch(error){operationError=error instanceof Error?error.message:String(error)}}
  async function moveApplication(role:RoleRecord,status:RoleStatus,sortOrder:number){try{await manager.updateRole(role.sourcePath,{status,sortOrder,...(status==="applied"&&!role.appliedAt?{appliedAt:new Date().toISOString()}:{})})}catch(error){operationError=error instanceof Error?error.message:String(error)}}
  async function moveAction(action:RoleAction,target:Exclude<RoleActionColumnId,"overdue">){try{await manager.updateRole(action.role.sourcePath,moveRoleAction(action,target))}catch(error){operationError=error instanceof Error?error.message:String(error)}}
  async function changeActionStatus(action:RoleAction,status:RoleStatus){try{await manager.updateRole(action.role.sourcePath,transitionRoleStatus(action.role,status))}catch(error){operationError=error instanceof Error?error.message:String(error)}}
  function persistLayout(next:ColumnCanvasLayoutV1){persist({collapsedColumnIds:Object.entries(next.columns).filter(([,value])=>value.collapsed).map(([id])=>id),columnWidths:Object.fromEntries(Object.entries(next.columns).flatMap(([id,value])=>typeof value.width==="number"?[[id,value.width]]:[]))})}
</script>

<div class="application-board-root" data-ui-component="roles-workspace" data-kanban-theme="light" aria-label="Interactive applications kanban board. Use arrow keys to navigate, Enter to open an application, Shift plus left or right to move a selected application.">
  <header class="application-board-topbar">
    <div class="topbar-actions"><button type="button" aria-label="Application board settings"><SlidersHorizontalIcon /></button>{#if mode==="applications"}<button type="button" aria-label="Create application" onclick={()=>createOpen=!createOpen}><PlusIcon /></button>{/if}</div>
    <div class="board-title"><div class="board-title__row"><h1>{modeTitle}</h1>{#if mode==="applications"}<span class="board-title__count" aria-label={`${filteredRoles.length} applications`}>{filteredRoles.length}</span>{/if}</div></div>
    <div class="topbar-actions end">
      {#if mode!=="applications"}<button type="button" aria-label="Show board" onclick={()=>setMode("applications")}><LayoutDashboardIcon /></button>{/if}
      {#if mode!=="activity"}<button type="button" aria-label="Show activity" onclick={()=>setMode("activity")}><ActivityIcon /></button>{/if}
      {#if mode!=="actions"}<button type="button" aria-label={`Show actions, ${attentionCount} due`} onclick={()=>setMode("actions")}><BellIcon />{#if attentionCount}<span class="topbar-badge">{attentionCount}</span>{/if}</button>{/if}
      {#if mode==="applications"}<button type="button" aria-label="Show all columns" onclick={() => persist({collapsedColumnIds:[]})}><Columns3Icon /></button>{/if}<button type="button" aria-label="Use dark kanban theme"><MoonIcon /></button>
    </div>
  </header>
  <div class="application-filter-row"><label class="application-filter"><SearchIcon /><input type="search" value={query} placeholder="Filter applications [F]" aria-label="Search applications" oninput={(event)=>setQuery(event.currentTarget.value)} /><SlidersHorizontalIcon /></label></div>

  {#if createOpen}<form class="application-create-card" onsubmit={(event)=>{event.preventDefault();void createRole()}}><strong>New application</strong><input bind:value={company} placeholder="Company" aria-label="Company"/><input bind:value={title} placeholder="Role title" aria-label="Role title"/><button type="submit">Create</button><button type="button" onclick={()=>createOpen=false}>Cancel</button></form>{/if}
  {#if operationError}<div class="application-board-alert" role="alert"><strong>Roles action failed</strong> {operationError}</div>{/if}
  {#if snapshot.diagnostics.length}<div class="application-board-alert" role="alert"><strong>{snapshot.diagnostics.length} role {snapshot.diagnostics.length===1?"file needs":"files need"} attention.</strong> {snapshot.diagnostics.map((item)=>`${item.path}: ${item.message}`).join(" ")}</div>{/if}

  <div class="application-mode-content">
    {#if mode==="applications"}<ApplicationsBoard roles={filteredRoles} {selectedRoleId} {layout} onSelect={openRole} onMove={moveApplication} onLayoutChange={persistLayout}/>
    {:else if mode==="activity"}<RoleActivityTimeline roles={filteredRoles} onSelect={openRole}/>
    {:else}<RoleActionsBoard roles={filteredRoles} onSelect={openRole} onMove={moveAction} onStatusChange={changeActionStatus}/>{/if}
  </div>
</div>

<style>
  .application-board-root{--kanban-background:oklch(100% 0 0);--kanban-foreground:oklch(15% .05 295);--kanban-card:oklch(100% 0 0);--kanban-card-foreground:oklch(15% .05 295);--kanban-muted:oklch(50% .05 295);--kanban-muted-surface:oklch(96.5% .015 295);--kanban-border:oklch(92.5% .02 295);--kanban-accent:oklch(96.5% .015 295);--kanban-accent-foreground:oklch(20% .05 295);--kanban-shadow:rgb(15 23 42/.1);--board-canvas:color-mix(in oklch,var(--kanban-background) 74%,var(--sidebar) 26%);position:relative;display:flex;width:100%;height:100%;min-height:0;flex-direction:column;overflow:hidden;background:linear-gradient(180deg,color-mix(in srgb,var(--kanban-card) 86%,transparent),transparent 5.5rem),radial-gradient(circle at 18% 0%,color-mix(in srgb,var(--primary) 10%,transparent),transparent 26rem),radial-gradient(circle at 78% 8%,color-mix(in srgb,var(--chart-2) 8%,transparent),transparent 24rem),var(--board-canvas);color:var(--kanban-foreground);font-family:var(--font-sans,sans-serif)}
  .application-board-topbar{display:flex;flex-shrink:0;align-items:center;gap:.75rem;border-bottom:1px solid var(--kanban-border);background:color-mix(in srgb,var(--kanban-card) 74%,transparent);overflow-x:auto;padding:.75rem clamp(.75rem,2vw,1.25rem);backdrop-filter:blur(18px);scrollbar-width:none}.topbar-actions{display:flex;flex:0 0 auto;align-items:center;gap:.5rem}.topbar-actions.end{margin-left:auto}.topbar-actions button{position:relative;display:grid;width:2rem;height:2rem;place-items:center;border:0;border-radius:999px;background:transparent;color:var(--kanban-foreground);cursor:pointer}.topbar-actions button:hover{background:var(--kanban-accent)}.topbar-actions :global(svg){width:1rem;height:1rem}.topbar-badge{position:absolute;top:-.25rem;right:-.25rem;display:inline-grid;min-width:1rem;height:1rem;place-items:center;border-radius:999px;background:#dc2626;color:white;font-size:.62rem;font-weight:950;padding:0 .2rem}
  .board-title{display:grid;flex:1 0 auto;justify-items:center;min-width:6rem}.board-title__row{display:inline-flex;align-items:center;gap:.45rem}.board-title h1{margin:0;font-size:1.05rem;font-weight:950}.board-title__count{display:inline-grid;min-width:1.25rem;height:1.25rem;place-items:center;border:1px solid color-mix(in srgb,var(--primary) 24%,transparent);border-radius:999px;background:color-mix(in srgb,var(--primary) 12%,var(--kanban-card));color:var(--primary);font-size:.72rem;font-weight:950;padding:0 .38rem}
  .application-filter-row{display:grid;flex:0 0 auto;place-items:center;padding:.7rem 1rem .35rem}.application-filter{display:flex;width:min(15rem,70vw);height:2.15rem;align-items:center;gap:.45rem;border:1px solid color-mix(in srgb,var(--kanban-foreground) 45%,var(--kanban-border));border-radius:999px;background:color-mix(in srgb,var(--kanban-card) 84%,transparent);padding:0 .65rem;box-shadow:0 1px 2px var(--kanban-shadow)}.application-filter :global(svg){width:.85rem;height:.85rem;color:var(--kanban-muted)}.application-filter input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--kanban-foreground);font:inherit;font-size:.78rem}.application-mode-content{display:flex;min-width:0;min-height:0;flex:1;overflow:hidden}
  .application-board-alert{z-index:50;margin:.6rem 1rem 0;border:1px solid var(--kanban-border);border-radius:.45rem;background:color-mix(in srgb,var(--kanban-card) 94%,transparent);color:var(--kanban-muted);font-size:.8rem;font-weight:800;padding:.55rem .7rem}.application-create-card{position:absolute;top:7.4rem;left:50%;z-index:60;display:grid;width:min(32rem,calc(100% - 2rem));grid-template-columns:1fr 1fr auto auto;gap:.5rem;translate:-50% 0;border:1px solid var(--kanban-border);border-radius:.55rem;background:var(--kanban-card);box-shadow:0 18px 46px var(--kanban-shadow);padding:.75rem}.application-create-card strong{grid-column:1/-1}.application-create-card input,.application-create-card button{height:2.1rem;border:1px solid var(--kanban-border);border-radius:.35rem;background:var(--kanban-card);color:var(--kanban-foreground);padding:0 .6rem}.application-create-card button{cursor:pointer;font-weight:800}
</style>
