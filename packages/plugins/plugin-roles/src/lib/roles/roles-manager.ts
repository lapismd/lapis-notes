import type { App, TAbstractFile, TFile } from "@lapis-notes/api";
import {
  createRoleDocument,
  isRolePath,
  parseRoleDocument,
  patchRoleDocument,
} from "./role-document";
import type {
  CreateRoleDocumentInput,
} from "./role-document";
import type {
  RoleDiagnostic,
  RolePatch,
  RoleRecord,
  RolesSnapshot,
} from "./types";

const EMPTY_SNAPSHOT: RolesSnapshot = Object.freeze({
  roles: Object.freeze([]),
  diagnostics: Object.freeze([]),
  refreshedAt: 0,
});

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value as Record<string, unknown>)) {
    deepFreeze(entry);
  }
  return Object.freeze(value);
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "role"
  );
}

function isRoleFile(file: TAbstractFile): file is TFile {
  return "extension" in file && isRolePath(file.path);
}

function duplicateDiagnostic(role: RoleRecord): RoleDiagnostic {
  return {
    path: role.sourcePath,
    code: "duplicate-id",
    field: "id",
    message: `Role id "${role.id}" is used by more than one role.md file.`,
  };
}

export class RolesManager {
  private snapshot: RolesSnapshot = EMPTY_SNAPSHOT;
  private readonly listeners = new Set<(snapshot: RolesSnapshot) => void>();
  private readonly eventDisposers: Array<() => void> = [];
  private readonly writeQueues = new Map<string, Promise<void>>();
  private refreshVersion = 0;

  constructor(readonly app: App) {}

  getSnapshot(): RolesSnapshot {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: RolesSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  async start(): Promise<void> {
    if (this.eventDisposers.length > 0) return;
    await this.app.vault.load();
    const refreshFile = (file: TAbstractFile) => {
      if (isRoleFile(file)) void this.refresh();
    };
    const refreshRename = (file: TAbstractFile, oldPath: string) => {
      if (isRoleFile(file) || isRolePath(oldPath)) void this.refresh();
    };
    const createRef = this.app.vault.on("create", refreshFile);
    const modifyRef = this.app.vault.on("modify", refreshFile);
    const deleteRef = this.app.vault.on("delete", refreshFile);
    const renameRef = this.app.vault.on("rename", refreshRename);
    this.eventDisposers.push(
      () => this.app.vault.offref(createRef),
      () => this.app.vault.offref(modifyRef),
      () => this.app.vault.offref(deleteRef),
      () => this.app.vault.offref(renameRef),
    );
    await this.refresh();
  }

  dispose(): void {
    for (const dispose of this.eventDisposers.splice(0)) dispose();
    this.listeners.clear();
  }

  async refresh(): Promise<RolesSnapshot> {
    const version = ++this.refreshVersion;
    const files = this.app.vault.getFiles().filter((file) => isRolePath(file.path));
    const documents = await Promise.all(
      files.map(async (file) =>
        parseRoleDocument(file.path, await this.app.vault.cachedRead(file)),
      ),
    );
    const diagnostics = documents.flatMap((document) => document.diagnostics);
    const parsedRoles = documents.flatMap((document) =>
      document.role ? [document.role] : [],
    );
    const idCounts = new Map<string, number>();
    for (const role of parsedRoles) {
      idCounts.set(role.id, (idCounts.get(role.id) ?? 0) + 1);
    }
    const roles = parsedRoles.filter((role) => {
      if ((idCounts.get(role.id) ?? 0) === 1) return true;
      diagnostics.push(duplicateDiagnostic(role));
      return false;
    });
    roles.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.company.localeCompare(right.company),
    );
    if (version !== this.refreshVersion) return this.snapshot;
    this.snapshot = Object.freeze({
      roles: Object.freeze(roles.map((role) => deepFreeze(role))),
      diagnostics: Object.freeze(diagnostics.map((diagnostic) => Object.freeze(diagnostic))),
      refreshedAt: Date.now(),
    });
    for (const listener of this.listeners) listener(this.snapshot);
    return this.snapshot;
  }

  private async enqueue<T>(path: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.writeQueues.get(path) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    const settled = current.then(
      () => undefined,
      () => undefined,
    );
    this.writeQueues.set(path, settled);
    try {
      return await current;
    } finally {
      if (this.writeQueues.get(path) === settled) this.writeQueues.delete(path);
    }
  }

  async updateRole(path: string, patch: RolePatch, body?: string): Promise<RoleRecord> {
    return this.enqueue(path, async () => {
      const file = this.app.vault.getFileByPath(path);
      if (!file) throw new Error(`Role file not found: ${path}`);
      const content = await this.app.vault.process(file, (current) =>
        patchRoleDocument(path, current, patch, body),
      );
      const document = parseRoleDocument(path, content);
      if (!document.role) {
        throw new Error(document.diagnostics[0]?.message ?? "Role update is invalid.");
      }
      await this.refresh();
      return document.role;
    });
  }

  async createRole(
    input: Omit<CreateRoleDocumentInput, "id" | "sortOrder"> & { id?: string },
  ): Promise<RoleRecord> {
    await this.app.vault.load();
    const baseSlug = slugify(input.id || `${input.company}-${input.title}`);
    const existingIds = new Set(
      (
        await Promise.all(
          this.app.vault
            .getFiles()
            .filter((file) => isRolePath(file.path))
            .map(async (file) =>
              parseRoleDocument(file.path, await this.app.vault.cachedRead(file)),
            ),
        )
      ).flatMap((document) => (document.role ? [document.role.id] : [])),
    );
    let id = baseSlug;
    let suffix = 2;
    while (
      existingIds.has(id) ||
      (await this.app.vault.exists(`Roles/${id}/role.md`))
    ) {
      id = `${baseSlug}-${suffix++}`;
    }
    await this.app.vault.mkpath(`Roles/${id}`);
    const sortOrder =
      Math.max(0, ...this.snapshot.roles.map((role) => role.sortOrder)) + 1000;
    const path = `Roles/${id}/role.md`;
    const file = await this.app.vault.create(
      path,
      createRoleDocument({ ...input, id, sortOrder }),
    );
    const document = parseRoleDocument(path, await this.app.vault.cachedRead(file));
    if (!document.role) throw new Error("Created role did not pass validation.");
    await this.refresh();
    return document.role;
  }

  async deleteRole(path: string): Promise<void> {
    const file = this.app.vault.getFileByPath(path);
    if (!file) return;
    await this.enqueue(path, () => this.app.vault.trash(file));
    await this.refresh();
  }

  async createTailoredCv(role: RoleRecord, sourcePath: string): Promise<string> {
    const source = this.app.vault.getFileByPath(sourcePath);
    if (!source) throw new Error(`CV file not found: ${sourcePath}`);
    const targetPath = `Roles/${role.id}/${role.id}.cv.yml`;
    await this.app.vault.mkpath(`Roles/${role.id}`);
    if (!(await this.app.vault.exists(targetPath))) {
      await this.app.vault.copy(source, targetPath);
    }
    await this.updateRole(role.sourcePath, {
      cvFile: sourcePath,
      tailoredCvFile: targetPath,
    });
    return targetPath;
  }
}
