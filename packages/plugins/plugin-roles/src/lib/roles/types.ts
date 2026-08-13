export const ROLE_STATUSES = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
] as const;

export type RoleStatus = (typeof ROLE_STATUSES)[number];

export interface RoleReaction {
  id: string;
  emoji: string;
  author: string;
  body?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RoleComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  reactions?: RoleReaction[];
}

export interface RolePrepStage {
  id: string;
  type: string;
  name: string;
  status?: "planned" | "scheduled" | "completed" | "cancelled" | "deferred";
  quickBrief?: string;
  mustDo?: string[];
  niceToDo?: string[];
  parkingLot?: string[];
  [key: string]: unknown;
}

export interface RolePrep {
  version: number;
  schemaVersion: number;
  updatedAt?: string;
  stages: RolePrepStage[];
  comments: { items: RoleComment[]; [key: string]: unknown };
  [key: string]: unknown;
}

export interface RoleRecord {
  schemaVersion: number;
  id: string;
  company: string;
  title: string;
  status: RoleStatus;
  sortOrder: number;
  sourcePath: string;
  url?: string;
  location?: string;
  salary?: string;
  salaryCurrency?: string;
  salaryMin?: number;
  salaryMax?: number;
  source?: string;
  tags: string[];
  contacts: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string;
  followUpAt?: string;
  lastContactedAt?: string;
  postponedAt?: string;
  postponedBy?: string;
  closedAt?: string;
  closedBy?: string;
  cvFile?: string;
  tailoredCvFile?: string;
  reactions: RoleReaction[];
  prep: RolePrep;
  description: string;
}

export interface RoleDiagnostic {
  path: string;
  code:
    | "missing-frontmatter"
    | "invalid-frontmatter"
    | "missing-field"
    | "invalid-status"
    | "duplicate-id";
  message: string;
  field?: string;
}

export interface RoleDocument {
  path: string;
  content: string;
  frontmatter: Record<string, unknown> | null;
  body: string;
  role: RoleRecord | null;
  diagnostics: RoleDiagnostic[];
}

export interface RolesSnapshot {
  roles: readonly RoleRecord[];
  diagnostics: readonly RoleDiagnostic[];
  refreshedAt: number;
}

export type RolesMode = "applications" | "activity" | "actions";

export interface RolesPresentationState {
  mode: RolesMode;
  query: string;
  selectedRoleId?: string;
  collapsedColumnIds: string[];
  columnWidths: Record<string, number>;
}

export type RolePatch = Partial<
  Omit<RoleRecord, "sourcePath" | "description" | "prep">
> & {
  prep?: Partial<RolePrep>;
};

