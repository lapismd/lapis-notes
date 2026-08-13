<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
  import CheckIcon from "@lucide/svelte/icons/check";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import PinIcon from "@lucide/svelte/icons/pin";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import TagIcon from "@lucide/svelte/icons/tag";
  import ZapIcon from "@lucide/svelte/icons/zap";
  import type { RoleRecord } from "./roles/types";

  let {
    role,
    columnColor,
    displayNumber,
    selected = false,
    canMoveLeft = false,
    canMoveRight = false,
    onMoveLeft,
    onMoveRight,
    onSelect,
    onOpen,
    onDragStart,
    onDragEnd,
  }: {
    role: RoleRecord;
    columnColor: string;
    displayNumber: number;
    selected?: boolean;
    canMoveLeft?: boolean;
    canMoveRight?: boolean;
    onMoveLeft?: () => void;
    onMoveRight?: () => void;
    onSelect?: () => void;
    onOpen?: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
  } = $props();

  const initials = $derived((role.contacts[0] ?? role.company).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""));
  const completedStages = $derived(role.prep.stages.filter((stage) => stage.status === "completed").length);
  const excerpt = $derived(role.description.replace(/^#+\s+/gm, "").replace(/\s+/g, " ").trim());
  const salary = $derived(role.salary || (role.salaryMin || role.salaryMax ? `${role.salaryCurrency ?? ""} ${role.salaryMin ?? ""}${role.salaryMin && role.salaryMax ? "–" : ""}${role.salaryMax ?? ""}`.trim() : ""));

  function compactDate(value: string | undefined) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return value;
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      (event.key === "ArrowLeft" ? onMoveLeft : onMoveRight)?.();
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen?.();
  }
</script>

<div
  class="application-ticket-card"
  class:is-selected={selected}
  style={`--card-color: ${columnColor}`}
  role="group"
  aria-label={`Open application ${displayNumber}: ${role.title} at ${role.company}`}
  draggable="true"
  data-testid={`application-card-${role.id}`}
  onpointerdown={() => onSelect?.()}
  ondragstart={(event) => {
    event.dataTransfer?.setData("text/plain", role.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    onDragStart?.();
  }}
  ondragend={() => onDragEnd?.()}
>
  <button class="card-open-button" type="button" tabindex={selected ? 0 : -1} aria-label={`Open application ${displayNumber}: ${role.title} at ${role.company}`} onfocus={() => onSelect?.()} onclick={() => onOpen?.()} onkeydown={handleKeydown}></button>
  <div class="card-actions">
    <button type="button" aria-label={`Move ${role.title} left`} disabled={!canMoveLeft} onclick={(event) => { event.stopPropagation(); onMoveLeft?.(); }}><ArrowLeftIcon /></button>
    <button type="button" aria-label={`Move ${role.title} right`} disabled={!canMoveRight} onclick={(event) => { event.stopPropagation(); onMoveRight?.(); }}><ArrowRightIcon /></button>
  </div>

  <header class="ticket-header" aria-hidden="true">
    <div class="card-board"><span>No. {displayNumber}</span><span>{role.company}</span></div>
    {#if role.tags.length}
      <div class="tag-row"><TagIcon /><div>{#each role.tags.slice(0, 3) as tag}<span>{tag}</span>{/each}</div></div>
    {/if}
  </header>

  {#if role.pinned}<div class="pin-corner" aria-hidden="true"><PinIcon /></div>{/if}

  <section class="ticket-content" aria-hidden="true">
    <div class="ticket-title-wrap">
      <h3>{role.title}</h3>
      {#if role.location}<p>{role.location}</p>{/if}
      {#if excerpt}<blockquote>{excerpt}</blockquote>{/if}
      {#if salary}<span class="salary-line">{salary}</span>{/if}
    </div>
    {#if role.prep.stages.length}<div class="step-count"><CheckIcon /><span>{completedStages}/{role.prep.stages.length}</span></div>{/if}
  </section>

  <footer class="ticket-footer" aria-hidden="true">
    <div class="card-meta">
      <span class="card-avatar">{initials}</span>
      <span class="meta-cell meta-rule-block meta-rule-inline">Added <strong>{compactDate(role.createdAt)}</strong></span>
      <span class="meta-cell meta-rule-block"><RefreshCwIcon /><strong>{compactDate(role.updatedAt)}</strong></span>
      <span class="meta-cell meta-rule-inline">{role.source ?? "Tracked"}</span>
      <span class="meta-cell truncate">{role.contacts.join(" / ") || "No contact"}</span>
    </div>
    <div class="ticket-counts"><span><ZapIcon />{role.reactions.length}</span><span><MessageCircleIcon />{role.prep.comments.items.length}</span></div>
  </footer>

  {#if role.followUpAt}
    <div class="application-stamp" aria-hidden="true"><span>Follow Up</span><strong>{compactDate(role.followUpAt)}</strong></div>
  {:else if role.closedAt}
    <div class="application-stamp is-closed" aria-hidden="true"><span>Closed</span><strong>{compactDate(role.closedAt)}</strong>{#if role.closedBy}<small>{role.closedBy}</small>{/if}</div>
  {/if}
</div>

<style>
  .application-ticket-card { --card-bg: color-mix(in srgb, var(--card-color) 6%, var(--kanban-card)); --card-content: color-mix(in srgb, var(--card-color) 46%, var(--kanban-card-foreground)); --card-border: color-mix(in srgb, var(--card-color) 22%, transparent); position: relative; display: flex; min-height: 11rem; flex-direction: column; gap: 0; overflow: hidden; border: 0; border-radius: .3rem; background: linear-gradient(180deg,color-mix(in srgb,var(--kanban-card) 62%,transparent),transparent 52%),var(--card-bg); color: var(--card-content); box-shadow: 0 8px 20px var(--kanban-shadow),0 0 0 1px var(--kanban-border); cursor: grab; outline: 0 solid transparent; transition: box-shadow 160ms ease,outline-color 160ms ease,transform 160ms ease; }
  .application-ticket-card::after { position:absolute; inset:0; z-index:0; border-radius:inherit; box-shadow:inset 0 0 0 1px var(--card-border); content:""; pointer-events:none; }
  .application-ticket-card:hover { transform:translateY(-1px); box-shadow:0 12px 26px var(--kanban-shadow); }
  .application-ticket-card.is-selected,.application-ticket-card:has(.card-open-button:focus-visible) { outline:3px solid color-mix(in srgb,var(--card-color) 72%,var(--kanban-background)); outline-offset:3px; }
  .card-open-button { position:absolute; inset:0; z-index:23; border:0; background:transparent; cursor:pointer; }
  .card-actions { position:absolute; top:.5rem; right:.5rem; z-index:30; display:flex; gap:.25rem; opacity:0; transition:opacity 160ms ease; }
  .application-ticket-card:hover .card-actions,.card-actions:focus-within { opacity:1; }
  .card-actions button { display:grid; width:1.5rem; height:1.5rem; place-items:center; border:0; border-radius:999px; background:color-mix(in srgb,var(--kanban-card) 82%,transparent); color:var(--card-color); box-shadow:0 1px 4px var(--kanban-shadow); cursor:pointer; backdrop-filter:blur(5px); }
  .card-actions button:disabled { cursor:default; opacity:.4; }
  .card-actions :global(svg),.tag-row :global(svg),.step-count :global(svg),.meta-cell :global(svg),.ticket-counts :global(svg),.pin-corner :global(svg) { width:.875rem; height:.875rem; }
  .ticket-header { position:relative; z-index:20; display:flex; align-items:center; gap:.5rem; }
  .card-board { display:inline-flex; max-width:62%; align-items:center; gap:.5rem; border-radius:.3rem 0 .3rem 0; background:var(--card-color); padding:.34rem .7rem .34rem 1rem; color:white; font-size:.68rem; font-weight:900; line-height:1; }
  .card-board span:last-child { min-width:0; overflow:hidden; border-left:1px solid rgb(255 255 255/.35); padding-left:.5rem; text-overflow:ellipsis; text-transform:uppercase; white-space:nowrap; }
  .tag-row { display:flex; min-width:0; flex:1; align-items:center; gap:.25rem; padding-top:.35rem; padding-right:2.8rem; color:var(--card-color); }
  .tag-row>div { display:flex; min-width:0; gap:.25rem; overflow:hidden; }
  .tag-row span { max-width:6rem; overflow:hidden; border-radius:.15rem; padding:.18rem .4rem; font-size:.63rem; font-weight:900; line-height:1; text-overflow:ellipsis; text-transform:uppercase; white-space:nowrap; }
  .pin-corner { position:absolute; top:.45rem; right:.45rem; z-index:25; display:grid; width:1.65rem; height:1.65rem; place-items:center; border-radius:999px; background:#111a32; color:white; box-shadow:0 6px 14px rgb(15 23 42/.18); }
  .ticket-content { position:relative; z-index:20; display:flex; flex:1; gap:.75rem; padding:.8rem 1rem .75rem; }
  .ticket-title-wrap { min-width:0; flex:1; }
  .ticket-title-wrap h3 { display:-webkit-box; margin:0; overflow:hidden; color:var(--card-content); font-size:1.28rem; font-weight:950; letter-spacing:0; line-height:1.05; line-clamp:3; -webkit-box-orient:vertical; -webkit-line-clamp:3; }
  .ticket-title-wrap p { margin:.45rem 0 0; overflow:hidden; color:color-mix(in srgb,var(--card-color) 46%,var(--kanban-muted)); font-size:.72rem; font-weight:800; text-overflow:ellipsis; text-transform:uppercase; white-space:nowrap; }
  .ticket-title-wrap blockquote { display:-webkit-box; margin:.55rem 0 0; overflow:hidden; border-left:3px solid color-mix(in srgb,var(--card-color) 42%,transparent); color:color-mix(in srgb,var(--card-color) 52%,var(--kanban-card-foreground)); font-size:.72rem; font-weight:750; line-height:1.25; line-clamp:2; padding-left:.55rem; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
  .salary-line { display:inline-flex; margin-top:.45rem; color:var(--card-color); font-size:.68rem; font-weight:950; text-transform:uppercase; }
  .step-count { display:flex; flex-shrink:0; align-items:flex-start; gap:.25rem; padding-top:.25rem; color:var(--card-color); font-size:.75rem; font-weight:950; }
  .ticket-footer { position:relative; z-index:20; display:flex; align-items:end; gap:.5rem; padding:0 1rem 1rem; }
  .card-meta { display:grid; min-width:0; flex:1; grid-template-columns:auto auto minmax(0,1fr); align-items:center; color:color-mix(in srgb,var(--card-color) 42%,var(--kanban-muted)); font-size:.62rem; font-weight:800; line-height:1; text-transform:uppercase; }
  .card-avatar { grid-row:span 2; display:grid; width:1.75rem; height:1.75rem; place-items:center; border-radius:999px; background:var(--card-color); color:white; font-size:.62rem; font-weight:900; }
  .meta-cell { min-width:0; border-color:color-mix(in srgb,var(--card-color) 17%,transparent); padding:.28rem .45rem; white-space:nowrap; }
  .meta-cell strong { font-weight:950; } .meta-cell.truncate { overflow:hidden; text-overflow:ellipsis; } .meta-rule-block { border-bottom:1px solid color-mix(in srgb,var(--card-color) 17%,transparent); } .meta-rule-inline { border-right:1px solid color-mix(in srgb,var(--card-color) 17%,transparent); }
  .meta-cell :global(svg) { display:inline; margin-right:.25rem; vertical-align:-.12em; }
  .ticket-counts { display:flex; flex-shrink:0; align-items:end; gap:.5rem; color:var(--card-color); font-size:.72rem; font-weight:950; } .ticket-counts span { display:inline-flex; align-items:center; gap:.2rem; }
  .application-stamp { position:absolute; right:.9rem; bottom:2.9rem; z-index:24; display:flex; min-width:6.8rem; rotate:5deg; flex-direction:column; align-items:center; border:.28rem solid rgb(34 197 94/.58); border-radius:.18rem; background:color-mix(in srgb,var(--kanban-card) 78%,transparent); color:var(--kanban-card-foreground); padding:.35rem .45rem; pointer-events:none; text-transform:uppercase; backdrop-filter:blur(2px); }
  .application-stamp span { color:rgb(22 163 74/.8); font-size:.78rem; font-weight:950; line-height:1; } .application-stamp strong,.application-stamp small { font-size:.55rem; font-weight:950; line-height:1.2; }
  .application-stamp.is-closed { border-color:rgb(107 114 128/.58); }.application-stamp.is-closed span{color:rgb(75 85 99/.8)}
</style>
