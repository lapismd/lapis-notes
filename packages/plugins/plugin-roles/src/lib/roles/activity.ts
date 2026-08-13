import type { RoleRecord } from "./types";

export type RoleActivityKind =
  | "added"
  | "updated"
  | "applied"
  | "follow-up"
  | "contacted"
  | "postponed"
  | "closed";

export interface RoleActivityEvent {
  id: string;
  roleId: string;
  kind: RoleActivityKind;
  title: string;
  company: string;
  occurredAt: string;
  role: RoleRecord;
}

export interface RoleActivityDay {
  date: string;
  gapDays: number;
  events: RoleActivityEvent[];
}

const definitions: Array<{
  kind: RoleActivityKind;
  field: keyof RoleRecord;
  title: string;
}> = [
  { kind: "added", field: "createdAt", title: "Role added" },
  { kind: "updated", field: "updatedAt", title: "Role updated" },
  { kind: "applied", field: "appliedAt", title: "Application submitted" },
  { kind: "follow-up", field: "followUpAt", title: "Follow-up scheduled" },
  { kind: "contacted", field: "lastContactedAt", title: "Contacted" },
  { kind: "postponed", field: "postponedAt", title: "Postponed" },
  { kind: "closed", field: "closedAt", title: "Closed" },
];

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).valueOf());
}

function localDate(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(later: string, earlier: string): number {
  const oneDay = 86_400_000;
  const laterDate = new Date(`${later}T00:00:00`);
  const earlierDate = new Date(`${earlier}T00:00:00`);
  return Math.max(0, Math.round((laterDate.getTime() - earlierDate.getTime()) / oneDay) - 1);
}

export function buildRoleActivityEvents(roles: readonly RoleRecord[]): RoleActivityEvent[] {
  return roles
    .flatMap((role) =>
      definitions.flatMap((definition) => {
        const occurredAt = role[definition.field];
        if (!validDate(occurredAt)) return [];
        if (definition.kind === "updated" && occurredAt === role.createdAt) return [];
        return [
          {
            id: `${role.id}:${definition.kind}:${occurredAt}`,
            roleId: role.id,
            kind: definition.kind,
            title: definition.title,
            company: role.company,
            occurredAt,
            role,
          },
        ];
      }),
    )
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

export function groupRoleActivityByDay(
  events: readonly RoleActivityEvent[],
): RoleActivityDay[] {
  const groups = new Map<string, RoleActivityEvent[]>();
  for (const event of events) {
    const date = localDate(event.occurredAt);
    groups.set(date, [...(groups.get(date) ?? []), event]);
  }
  const dates = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  return dates.map((date, index) => ({
    date,
    gapDays: index === 0 ? 0 : daysBetween(dates[index - 1]!, date),
    events: groups.get(date) ?? [],
  }));
}

