<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { buildRoleActivityEvents, groupRoleActivityByDay } from "./roles/activity";
  import type { RoleRecord } from "./roles/types";

  let {
    roles = [],
    onSelect,
  }: {
    roles?: readonly RoleRecord[];
    onSelect?: (role: RoleRecord) => void;
  } = $props();

  const days = $derived(groupRoleActivityByDay(buildRoleActivityEvents(roles)));
</script>

<section class="role-activity" data-ui-component="role-activity" aria-label="Role activity">
  {#if days.length === 0}
    <p class="role-activity__empty">Role changes will appear here.</p>
  {/if}
  {#each days as day (day.date)}
    {#if day.gapDays > 0}
      <div class="role-activity__gap" aria-label={`${day.gapDays} days without activity`}>
        <span>{day.gapDays} quiet {day.gapDays === 1 ? "day" : "days"}</span>
      </div>
    {/if}
    <section class="role-activity__day" aria-labelledby={`role-activity-${day.date}`}>
      <h2 id={`role-activity-${day.date}`}>{day.date}</h2>
      <ol>
        {#each day.events as event (event.id)}
          <li>
            <button type="button" onclick={() => onSelect?.(event.role)}>
              <span class="role-activity__event-title">{event.title}</span>
              <span>{event.role.title} · {event.company}</span>
              <Badge variant="outline">{event.kind}</Badge>
              <time datetime={event.occurredAt}>{new Date(event.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
            </button>
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</section>

<style>
  .role-activity {
    min-height: 0;
    flex: 1 1 auto;
    overflow: auto;
    padding: 1rem;
    background: var(--ui-workspace-view-background, var(--background));
  }

  .role-activity__empty {
    color: var(--muted-foreground);
  }

  .role-activity__gap {
    display: grid;
    place-items: center;
    min-height: 3rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }

  .role-activity__day h2 {
    margin: 0 0 0.5rem;
    font-size: 0.875rem;
  }

  .role-activity__day ol {
    display: grid;
    gap: 0.5rem;
    margin: 0 0 1rem;
    padding: 0;
    list-style: none;
  }

  .role-activity__day button {
    display: grid;
    width: 100%;
    grid-template-columns: minmax(8rem, auto) 1fr auto auto;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--card);
    color: var(--card-foreground);
    padding: 0.75rem;
    text-align: left;
  }

  .role-activity__event-title {
    font-weight: 600;
  }

  .role-activity time {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
</style>

