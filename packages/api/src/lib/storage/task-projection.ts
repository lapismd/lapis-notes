export const TASK_PROJECTION_VERSION = 1;

export type AppDatabaseTaskKind = "task" | "task-list";
export type AppDatabaseTaskStatus =
  | "open"
  | "completed"
  | "canceled"
  | "active"
  | "archived";
export type AppDatabaseTaskStartKind = "anytime" | "someday" | "date";
export type AppDatabaseTaskPlanKind = "anytime" | "all-day" | "evening" | "time";
export type AppDatabaseLinkKind = "subtask" | "list-item" | "reference";
export type AppDatabaseTaskView =
  | "inbox"
  | "today"
  | "anytime"
  | "upcoming"
  | "someday"
  | "completed"
  | "review";

export interface AppDatabaseTaskRecord {
  documentPath: string;
  documentId: string;
  kind: AppDatabaseTaskKind;
  title: string;
  status: AppDatabaseTaskStatus;
  inbox: boolean;
  startKind: AppDatabaseTaskStartKind;
  startDate?: string | null;
  planDate?: string | null;
  planKind?: AppDatabaseTaskPlanKind | null;
  planTime?: string | null;
  durationMinutes?: number | null;
  deadline?: string | null;
  completedAt?: string | null;
  repeatStrategy?: string | null;
  repeatFrequency?: string | null;
  repeatInterval?: number | null;
  repeatAnchor?: string | null;
  checklistTotal: number;
  checklistCompleted: number;
  commentCount: number;
  projectionVersion: number;
}

export interface AppDatabaseTaskQuery {
  view?: AppDatabaseTaskView;
  today?: string;
  documentId?: string;
  documentPath?: string;
  kind?: AppDatabaseTaskKind;
  limit?: number;
}

export interface AppDatabaseTaskChildQuery {
  sourcePath: string;
  kind?: AppDatabaseLinkKind;
}

export function structuralLinkKind(heading?: string | null): AppDatabaseLinkKind {
  const normalized = heading?.trim().toLowerCase();
  if (normalized === "subtasks") return "subtask";
  if (normalized === "items") return "list-item";
  return "reference";
}

function isOpenTask(row: AppDatabaseTaskRecord): boolean {
  return row.kind === "task" && row.status === "open";
}

function startIsActionable(row: AppDatabaseTaskRecord, today: string): boolean {
  if (row.startKind === "anytime") return true;
  if (row.startKind === "date") {
    return Boolean(row.startDate && row.startDate <= today);
  }
  return false;
}

export function matchesTaskQuery(
  row: AppDatabaseTaskRecord,
  query: AppDatabaseTaskQuery,
): boolean {
  if (query.documentPath && row.documentPath !== query.documentPath) return false;
  if (query.documentId && row.documentId !== query.documentId) return false;
  if (query.kind && row.kind !== query.kind) return false;
  if (!query.view) return true;
  const today = query.today ?? new Date().toISOString().slice(0, 10);
  switch (query.view) {
    case "inbox":
      return isOpenTask(row) && row.inbox;
    case "today":
      return (
        isOpenTask(row) &&
        ((Boolean(row.planDate) && row.planDate! <= today) ||
          (Boolean(row.deadline) && row.deadline! <= today))
      );
    case "anytime":
      return isOpenTask(row) && startIsActionable(row, today) && !row.planDate;
    case "upcoming":
      return (
        isOpenTask(row) &&
        ((Boolean(row.startDate) && row.startDate! > today) ||
          (Boolean(row.planDate) && row.planDate! > today) ||
          (Boolean(row.deadline) && row.deadline! > today))
      );
    case "someday":
      return isOpenTask(row) && row.startKind === "someday";
    case "completed":
      return row.status === "completed";
    case "review":
      return isOpenTask(row) && Boolean(row.planDate) && row.planDate! < today;
    default:
      return false;
  }
}
