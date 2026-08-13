import type { RolePatch, RoleRecord, RoleStatus } from "./types";

export type RoleActionColumnId =
  | "overdue"
  | "today"
  | "upcoming"
  | "waiting"
  | "done";
export type RoleActionKind = "follow_up" | "waiting" | "contacted";

export interface RoleAction {
  id: string;
  roleId: string;
  kind: RoleActionKind;
  columnId: RoleActionColumnId;
  title: string;
  dueAt?: string;
  completedAt?: string;
  role: RoleRecord;
}

export interface RoleActionColumn {
  id: RoleActionColumnId;
  title: string;
  description: string;
  actions: RoleAction[];
}

export const ROLE_ACTION_COLUMNS: ReadonlyArray<
  Omit<RoleActionColumn, "actions">
> = [
  { id: "overdue", title: "Overdue", description: "Follow-ups past their due date." },
  { id: "today", title: "Today", description: "Follow-ups due today." },
  { id: "upcoming", title: "Upcoming", description: "Scheduled follow-ups." },
  { id: "waiting", title: "Waiting", description: "Active roles without a follow-up." },
  { id: "done", title: "Done", description: "Contacted during the last seven days." },
];

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function dayOffset(value: string | undefined, now: Date): number | null {
  const parsed = parseDate(value);
  if (!parsed) return null;
  return Math.round(
    (startOfDay(parsed).getTime() - startOfDay(now).getTime()) / 86_400_000,
  );
}

function dueColumn(value: string | undefined, now: Date): RoleActionColumnId {
  const offset = dayOffset(value, now);
  if (offset === null) return "waiting";
  if (offset < 0) return "overdue";
  if (offset === 0) return "today";
  return "upcoming";
}

function recent(value: string | undefined, now: Date, days: number): boolean {
  const parsed = parseDate(value);
  if (!parsed) return false;
  const age = Math.floor(
    (startOfDay(now).getTime() - startOfDay(parsed).getTime()) / 86_400_000,
  );
  return age >= 0 && age <= days;
}

export function buildRoleActions(
  roles: readonly RoleRecord[],
  now = new Date(),
  doneWindowDays = 7,
): RoleAction[] {
  const actions: RoleAction[] = [];
  for (const role of roles) {
    if (role.followUpAt) {
      actions.push({
        id: `follow-up:${role.id}`,
        roleId: role.id,
        kind: "follow_up",
        columnId: dueColumn(role.followUpAt, now),
        title: "Follow up",
        dueAt: role.followUpAt,
        role,
      });
    }
    const contactedRecently = recent(role.lastContactedAt, now, doneWindowDays);
    if (contactedRecently) {
      actions.push({
        id: `contacted:${role.id}`,
        roleId: role.id,
        kind: "contacted",
        columnId: "done",
        title: "Contacted",
        completedAt: role.lastContactedAt,
        role,
      });
    }
    const active = !role.closedAt && role.status !== "rejected";
    if (active && !role.followUpAt && !contactedRecently) {
      actions.push({
        id: `waiting:${role.id}`,
        roleId: role.id,
        kind: "waiting",
        columnId: "waiting",
        title: "No follow-up scheduled",
        role,
      });
    }
  }
  return actions.sort((left, right) => {
    const leftDue = parseDate(left.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDue = parseDate(right.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftDue - rightDue || right.role.updatedAt.localeCompare(left.role.updatedAt);
  });
}

export function buildRoleActionColumns(
  roles: readonly RoleRecord[],
  now = new Date(),
): RoleActionColumn[] {
  const actions = buildRoleActions(roles, now);
  return ROLE_ACTION_COLUMNS.map((column) => ({
    ...column,
    actions: actions.filter((action) => action.columnId === column.id),
  }));
}

function localDate(offset: number, now: Date): string {
  const date = startOfDay(now);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function moveRoleAction(
  action: RoleAction,
  target: Exclude<RoleActionColumnId, "overdue">,
  now = new Date(),
): RolePatch {
  const updatedAt = now.toISOString();
  if (target === "today") {
    return {
      followUpAt: localDate(0, now),
      postponedAt: undefined,
      postponedBy: undefined,
      updatedAt,
    };
  }
  if (target === "upcoming") {
    return {
      followUpAt: localDate(7, now),
      postponedAt: undefined,
      postponedBy: undefined,
      updatedAt,
    };
  }
  if (target === "waiting") {
    return {
      followUpAt: undefined,
      postponedAt: updatedAt,
      postponedBy: "roles:actions",
      updatedAt,
    };
  }
  return {
    followUpAt: undefined,
    lastContactedAt: updatedAt,
    postponedAt: undefined,
    postponedBy: undefined,
    updatedAt,
  };
}

export function transitionRoleStatus(
  role: RoleRecord,
  status: RoleStatus,
  now = new Date(),
): RolePatch {
  const updatedAt = now.toISOString();
  return {
    status,
    updatedAt,
    ...(status === "applied" && !role.appliedAt ? { appliedAt: updatedAt } : {}),
    ...(status === "rejected"
      ? { closedAt: updatedAt, closedBy: "roles:actions" }
      : role.status === "rejected"
        ? { closedAt: undefined, closedBy: undefined }
        : {}),
  };
}
