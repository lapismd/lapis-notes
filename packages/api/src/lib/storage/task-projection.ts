import {
  PUBLIC_TASKS_PROJECTION_ID,
  and,
  eq,
  gt,
  isNull,
  lt,
  lte,
  or,
  type IndexFieldDefinition,
  type IndexFilter,
  type IndexQuery,
} from "./index-projection";

export const TASK_PROJECTION_VERSION = 2;
export { PUBLIC_TASKS_PROJECTION_ID };

export const TASK_PROJECTION_FIELDS: Record<string, IndexFieldDefinition> = {
  documentPath: { type: "path", indexed: true, sortable: true },
  documentId: { type: "string", indexed: true, unique: true },
  kind: { type: "string", indexed: true },
  title: { type: "string", indexed: true, sortable: true },
  status: { type: "string", indexed: true, sortable: true },
  inbox: { type: "boolean", indexed: true },
  startKind: { type: "string", indexed: true },
  startDate: { type: "date", indexed: true, sortable: true },
  planDate: { type: "date", indexed: true, sortable: true },
  planKind: { type: "string", indexed: true },
  planTime: { type: "string", indexed: true, sortable: true },
  durationMinutes: { type: "number", indexed: true, sortable: true },
  deadline: { type: "date", indexed: true, sortable: true },
  completedAt: { type: "string", indexed: true },
  checklistTotal: { type: "number" },
  checklistCompleted: { type: "number" },
  commentCount: { type: "number", indexed: true },
  structure: { type: "json" },
};

export type AppDatabaseTaskKind = "task" | "task-list";
export type AppDatabaseTaskStatus =
  | "open"
  | "completed"
  | "canceled"
  | "active"
  | "archived";
export type AppDatabaseTaskStartKind = "anytime" | "someday" | "date";
export type AppDatabaseTaskPlanKind =
  | "anytime"
  | "morning"
  | "afternoon"
  | "evening"
  | "time";
export type AppDatabaseLinkKind =
  | "reference"
  | "task-entry"
  | "list-entry"
  | "navigation-item";
export type AppDatabaseTaskStructuralKind = "task-entry" | "list-entry";

export interface AppDatabaseTaskStructuralEntry {
  sourceDocumentId: string;
  sourceDocumentPath: string;
  targetDocumentId: string;
  targetDocumentPath: string;
  kind: AppDatabaseTaskStructuralKind;
  headingPath: string[];
  headingLevel: number | null;
  headingText: string | null;
  runId: string;
  positionInRun: number;
  sourceStart: number;
  sourceEnd: number;
  authoredLabel: string;
  authoredHref: string;
}

export interface AppDatabaseTaskRun {
  id: string;
  documentId: string;
  documentPath: string;
  headingPath: string[];
  headingLevel: number | null;
  headingText: string | null;
  listDepth: number;
  startOffset: number;
  endOffset: number;
  entryCount: number;
}

export interface AppDatabaseTaskStructureDiagnostic {
  code: string;
  message: string;
  sourceStart?: number;
  sourceEnd?: number;
  target?: string;
}

export interface AppDatabaseTaskStructure {
  version: number;
  sourceHash: string;
  entries: AppDatabaseTaskStructuralEntry[];
  runs: AppDatabaseTaskRun[];
  diagnostics: AppDatabaseTaskStructureDiagnostic[];
}
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
  structure?: AppDatabaseTaskStructure | null;
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

export function taskQueryToIndexQuery(query: AppDatabaseTaskQuery = {}): IndexQuery {
  const clauses: IndexFilter[] = [];
  if (query.documentPath) clauses.push(eq("documentPath", query.documentPath));
  if (query.documentId) clauses.push(eq("documentId", query.documentId));
  if (query.kind) clauses.push(eq("kind", query.kind));
  if (query.view) {
    const today = query.today ?? new Date().toISOString().slice(0, 10);
    const openTask = and(eq("kind", "task"), eq("status", "open"));
    switch (query.view) {
      case "inbox":
        clauses.push(and(openTask, eq("inbox", true)));
        break;
      case "today":
        clauses.push(
          and(openTask, or(lte("planDate", today), lte("deadline", today))),
        );
        break;
      case "anytime":
        clauses.push(
          and(
            openTask,
            isNull("planDate"),
            or(eq("startKind", "anytime"), and(eq("startKind", "date"), lte("startDate", today))),
          ),
        );
        break;
      case "upcoming":
        clauses.push(
          and(
            openTask,
            or(gt("startDate", today), gt("planDate", today), gt("deadline", today)),
          ),
        );
        break;
      case "someday":
        clauses.push(and(openTask, eq("startKind", "someday")));
        break;
      case "completed":
        clauses.push(eq("status", "completed"));
        break;
      case "review":
        clauses.push(and(openTask, lt("planDate", today)));
        break;
      default:
        break;
    }
  }
  return {
    where: clauses.length === 1 ? clauses[0] : clauses.length ? and(...clauses) : undefined,
    limit: query.limit,
  };
}
