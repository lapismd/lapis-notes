import YAML from "yaml";
import {
  ROLE_STATUSES,
  type RoleDiagnostic,
  type RoleDocument,
  type RolePatch,
  type RolePrep,
  type RoleRecord,
  type RoleStatus,
} from "./types";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalString(value: unknown): string | undefined {
  const result = stringValue(value).trim();
  return result || undefined;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function normalizePrep(value: unknown): RolePrep {
  const prep = isRecord(value) ? value : {};
  const comments = isRecord(prep.comments) ? prep.comments : {};
  return {
    ...prep,
    version: numberValue(prep.version, 3),
    schemaVersion: numberValue(prep.schemaVersion, 1),
    updatedAt: optionalString(prep.updatedAt),
    stages: Array.isArray(prep.stages) ? (prep.stages as RolePrep["stages"]) : [],
    comments: {
      ...comments,
      items: Array.isArray(comments.items)
        ? (comments.items as RolePrep["comments"]["items"])
        : [],
    },
  };
}

function normalizeRole(
  path: string,
  frontmatter: Record<string, unknown>,
  body: string,
): RoleRecord {
  return {
    schemaVersion: numberValue(frontmatter.schemaVersion, 1),
    id: stringValue(frontmatter.id).trim(),
    company: stringValue(frontmatter.company).trim(),
    title: stringValue(frontmatter.title).trim(),
    status: stringValue(frontmatter.status) as RoleStatus,
    sortOrder: numberValue(frontmatter.sortOrder),
    sourcePath: path,
    url: optionalString(frontmatter.url),
    location: optionalString(frontmatter.location),
    salary: optionalString(frontmatter.salary),
    salaryCurrency: optionalString(frontmatter.salaryCurrency),
    salaryMin:
      typeof frontmatter.salaryMin === "number" ? frontmatter.salaryMin : undefined,
    salaryMax:
      typeof frontmatter.salaryMax === "number" ? frontmatter.salaryMax : undefined,
    source: optionalString(frontmatter.source),
    tags: stringArray(frontmatter.tags),
    contacts: stringArray(frontmatter.contacts),
    pinned: frontmatter.pinned === true,
    createdAt: stringValue(frontmatter.createdAt),
    updatedAt: stringValue(frontmatter.updatedAt),
    appliedAt: optionalString(frontmatter.appliedAt),
    followUpAt: optionalString(frontmatter.followUpAt),
    lastContactedAt: optionalString(frontmatter.lastContactedAt),
    postponedAt: optionalString(frontmatter.postponedAt),
    postponedBy: optionalString(frontmatter.postponedBy),
    closedAt: optionalString(frontmatter.closedAt),
    closedBy: optionalString(frontmatter.closedBy),
    cvFile: optionalString(frontmatter.cvFile),
    tailoredCvFile: optionalString(frontmatter.tailoredCvFile),
    reactions: Array.isArray(frontmatter.reactions)
      ? (frontmatter.reactions as RoleRecord["reactions"])
      : [],
    prep: normalizePrep(frontmatter.prep),
    description: body,
  };
}

function validateRole(path: string, role: RoleRecord): RoleDiagnostic[] {
  const diagnostics: RoleDiagnostic[] = [];
  for (const field of ["id", "company", "title"] as const) {
    if (!role[field]) {
      diagnostics.push({
        path,
        code: "missing-field",
        field,
        message: `Role frontmatter requires a non-empty ${field}.`,
      });
    }
  }
  if (!ROLE_STATUSES.includes(role.status)) {
    diagnostics.push({
      path,
      code: "invalid-status",
      field: "status",
      message: `Role status must be one of: ${ROLE_STATUSES.join(", ")}.`,
    });
  }
  return diagnostics;
}

export function isRolePath(path: string): boolean {
  return path.split("/").at(-1) === "role.md";
}

export function parseRoleDocument(path: string, content: string): RoleDocument {
  const match = FRONTMATTER.exec(content);
  if (!match) {
    return {
      path,
      content,
      frontmatter: null,
      body: content,
      role: null,
      diagnostics: [
        {
          path,
          code: "missing-frontmatter",
          message: "Role files require YAML frontmatter at the top of the document.",
        },
      ],
    };
  }

  const body = content.slice(match[0].length);
  try {
    const parsed = YAML.parse(match[1] ?? "");
    if (!isRecord(parsed)) throw new Error("Frontmatter must be a YAML object.");
    const role = normalizeRole(path, parsed, body);
    const diagnostics = validateRole(path, role);
    return {
      path,
      content,
      frontmatter: parsed,
      body,
      role: diagnostics.length === 0 ? role : null,
      diagnostics,
    };
  } catch (error) {
    return {
      path,
      content,
      frontmatter: null,
      body,
      role: null,
      diagnostics: [
        {
          path,
          code: "invalid-frontmatter",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}

export function stringifyRoleDocument(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const yaml = YAML.stringify(frontmatter, { lineWidth: 100 }).trimEnd();
  return `---\n${yaml}\n---\n${body}`;
}

function patchEntries(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, entry ?? null]),
  );
}

export function patchRoleDocument(
  path: string,
  content: string,
  patch: RolePatch,
  body?: string,
): string {
  const document = parseRoleDocument(path, content);
  if (!document.frontmatter) {
    throw new Error(document.diagnostics[0]?.message ?? "Invalid role document.");
  }
  const nextPrep = patch.prep
    ? {
        ...(isRecord(document.frontmatter.prep)
          ? document.frontmatter.prep
          : {}),
        ...patchEntries(patch.prep as Record<string, unknown>),
      }
    : document.frontmatter.prep;
  const next = {
    ...document.frontmatter,
    ...patchEntries(patch as Record<string, unknown>),
    ...(patch.prep ? { prep: nextPrep } : {}),
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
  return stringifyRoleDocument(next, body ?? document.body);
}

export interface CreateRoleDocumentInput {
  id: string;
  company: string;
  title: string;
  description?: string;
  status?: RoleStatus;
  sortOrder?: number;
  now?: Date;
}

export function createRoleDocument(input: CreateRoleDocumentInput): string {
  const timestamp = (input.now ?? new Date()).toISOString();
  return stringifyRoleDocument(
    {
      schemaVersion: 1,
      id: input.id,
      company: input.company,
      title: input.title,
      status: input.status ?? "saved",
      sortOrder: input.sortOrder ?? 0,
      url: null,
      location: null,
      salary: null,
      salaryCurrency: null,
      salaryMin: null,
      salaryMax: null,
      source: null,
      tags: [],
      contacts: [],
      pinned: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      appliedAt: null,
      followUpAt: null,
      lastContactedAt: null,
      postponedAt: null,
      postponedBy: null,
      closedAt: null,
      closedBy: null,
      cvFile: null,
      tailoredCvFile: null,
      reactions: [],
      prep: {
        version: 3,
        schemaVersion: 1,
        updatedAt: timestamp,
        stages: [],
        comments: { items: [] },
      },
    },
    input.description ?? "",
  );
}
