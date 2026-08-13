import type { App } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import { createRoleDocument, parseRoleDocument } from "./role-document";
import { RolesManager } from "./roles-manager";

async function setup(seed: Record<string, string>) {
  const vault = new TestVault(seed);
  await vault.load();
  const manager = new RolesManager({ vault } as App);
  await manager.start();
  return { vault, manager };
}

type TestEvent = "create" | "modify" | "delete" | "rename";
type TestFile = { path: string; baseName: string; extension: string };

class TestVault {
  private readonly files = new Map<string, string>();
  private readonly listeners = new Map<TestEvent, Set<(...args: any[]) => void>>();

  constructor(seed: Record<string, string>) {
    for (const [path, content] of Object.entries(seed)) this.files.set(path, content);
  }

  private file(path: string): TestFile {
    const baseName = path.split("/").at(-1) ?? path;
    return { path, baseName, extension: baseName.split(".").at(-1) ?? "" };
  }

  private emit(event: TestEvent, ...args: any[]) {
    for (const listener of this.listeners.get(event) ?? []) listener(...args);
  }

  load() {
    return Promise.resolve();
  }

  getFiles() {
    return [...this.files.keys()].map((path) => this.file(path));
  }

  getFileByPath(path: string) {
    return this.files.has(path) ? this.file(path) : null;
  }

  cachedRead(file: TestFile) {
    return Promise.resolve(this.files.get(file.path) ?? "");
  }

  read(file: TestFile) {
    return this.cachedRead(file);
  }

  exists(path: string) {
    return Promise.resolve(this.files.has(path));
  }

  mkpath(_path: string) {
    return Promise.resolve({});
  }

  create(path: string, content: string) {
    this.files.set(path, content);
    const file = this.file(path);
    this.emit("create", file);
    return Promise.resolve(file);
  }

  modify(file: TestFile, content: string) {
    this.files.set(file.path, content);
    this.emit("modify", this.file(file.path));
    return Promise.resolve();
  }

  process(file: TestFile, patch: (content: string) => string) {
    const content = patch(this.files.get(file.path) ?? "");
    this.files.set(file.path, content);
    this.emit("modify", this.file(file.path));
    return Promise.resolve(content);
  }

  copy(file: TestFile, target: string) {
    this.files.set(target, this.files.get(file.path) ?? "");
    const copy = this.file(target);
    this.emit("create", copy);
    return Promise.resolve(copy);
  }

  rename(file: TestFile, target: string) {
    const content = this.files.get(file.path) ?? "";
    this.files.delete(file.path);
    this.files.set(target, content);
    this.emit("rename", this.file(target), file.path);
    return Promise.resolve();
  }

  delete(file: TestFile) {
    this.files.delete(file.path);
    this.emit("delete", file);
    return Promise.resolve();
  }

  trash(file: TestFile) {
    return this.delete(file);
  }

  on(event: TestEvent, listener: (...args: any[]) => void) {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return { eventName: event, callback: listener };
  }

  offref(ref: { eventName: TestEvent; callback: (...args: any[]) => void }) {
    this.listeners.get(ref.eventName)?.delete(ref.callback);
  }
}

function source(id: string, company = "Atlas") {
  return createRoleDocument({
    id,
    company,
    title: "Lead",
    now: new Date("2026-08-13T09:00:00.000Z"),
  });
}

describe("RolesManager", () => {
  it("scans exact role.md files and excludes duplicate ids", async () => {
    const { manager } = await setup({
      "Roles/a/role.md": source("same", "A"),
      "Roles/b/role.md": source("same", "B"),
      "Roles/c/not-role.md": source("other", "C"),
      "Roles/d/Role.md": source("capitalized", "D"),
    });

    expect(manager.getSnapshot().roles).toEqual([]);
    expect(manager.getSnapshot().diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "duplicate-id",
      "duplicate-id",
    ]);
    manager.dispose();
  });

  it("reacts to create, modify, rename, and delete events", async () => {
    const { vault, manager } = await setup({ "Roles/a/role.md": source("a") });
    const listener = vi.fn();
    manager.subscribe(listener);

    await vault.mkpath("Roles/b");
    const created = await vault.create("Roles/b/role.md", source("b"));
    await vi.waitFor(() => expect(manager.getSnapshot().roles).toHaveLength(2));
    await vault.modify(created, source("b", "Beta"));
    await vi.waitFor(() =>
      expect(manager.getSnapshot().roles.find((role) => role.id === "b")?.company).toBe("Beta"),
    );
    await vault.rename(vault.getFileByPath("Roles/b/role.md")!, "Roles/b/archive.md");
    await vi.waitFor(() => expect(manager.getSnapshot().roles).toHaveLength(1));
    await vault.delete(vault.getFileByPath("Roles/a/role.md")!);
    await vi.waitFor(() => expect(manager.getSnapshot().roles).toHaveLength(0));
    expect(listener).toHaveBeenCalled();
    manager.dispose();
  });

  it("creates deterministic paths and serializes body-safe patches", async () => {
    const { vault, manager } = await setup({
      "Roles/atlas-lead/role.md": source("atlas-lead"),
    });
    const created = await manager.createRole({
      company: "Atlas",
      title: "Lead",
      description: "# Description\n",
      now: new Date("2026-08-13T09:00:00.000Z"),
    });
    expect(created.sourcePath).toBe("Roles/atlas-lead-2/role.md");
    expect(Object.isFrozen(manager.getSnapshot().roles[0]?.prep.stages)).toBe(true);

    await Promise.all([
      manager.updateRole(created.sourcePath, { status: "applied" }),
      manager.updateRole(created.sourcePath, { followUpAt: "2026-08-20" }),
    ]);
    const content = await vault.read(vault.getFileByPath(created.sourcePath)!);
    expect(parseRoleDocument(created.sourcePath, content).role).toMatchObject({
      status: "applied",
      followUpAt: "2026-08-20",
      description: "# Description\n",
    });
    manager.dispose();
  });

  it("creates a tailored CV once and never overwrites an existing target", async () => {
    const { vault, manager } = await setup({
      "Roles/atlas/role.md": source("atlas"),
      "CVs/base.cv.yml": "cv: base\n",
    });
    const role = manager.getSnapshot().roles[0]!;
    const target = await manager.createTailoredCv(role, "CVs/base.cv.yml");
    expect(target).toBe("Roles/atlas/atlas.cv.yml");
    await vault.modify(vault.getFileByPath(target)!, "cv: tailored\n");
    await manager.createTailoredCv(manager.getSnapshot().roles[0]!, "CVs/base.cv.yml");
    expect(await vault.read(vault.getFileByPath(target)!)).toBe("cv: tailored\n");
    expect(manager.getSnapshot().roles[0]).toMatchObject({
      cvFile: "CVs/base.cv.yml",
      tailoredCvFile: target,
    });
    manager.dispose();
  });
});
