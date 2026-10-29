import {
  TFile,
  TFolder,
  type ChangeEvent,
  type DataAdapter,
  type Stat,
  type TAbstractFile,
} from "./fs";
import { dirname } from "./path";
import type { Vault } from "./vault.svelte";

type Snapshot = Map<string, Stat>;
export type VaultTreeEvent = {
  type: "create" | "modify" | "delete" | "rename";
  file: TAbstractFile;
  oldPath?: string;
};
const limits = { entries: 100_000, bytes: 16 * 1024 * 1024 };

/** Scan privately; a failed or retired scan cannot mutate the live tree. */
export async function scanVaultTree(
  adapter: DataAdapter,
  current: () => boolean,
  bounds = limits,
): Promise<Snapshot | null> {
  const snapshot: Snapshot = new Map([
    ["/", { type: "folder", ctime: 0, mtime: 0, size: 0 }],
  ]);
  const folders = ["/"];
  let bytes = 96;
  const encoder = new TextEncoder();
  for (let index = 0; index < folders.length; index++) {
    if (!current()) return null;
    const parent = folders[index]!;
    const listed = await adapter.list(parent);
    for (const [type, names] of [
      ["file", listed.files],
      ["folder", listed.folders],
    ] as const) {
      for (const name of names) {
        if (!current()) return null;
        if (!name || name === "." || name === ".." || /[/\\\0]/u.test(name))
          throw new Error("Invalid vault snapshot child path");
        const path = parent === "/" ? name : `${parent}/${name}`;
        bytes += encoder.encode(path).byteLength + 96;
        if (
          snapshot.has(path) ||
          snapshot.size >= bounds.entries ||
          bytes > bounds.bytes
        )
          throw new Error(
            "Vault reconciliation snapshot exceeds its bounds or duplicates a path",
          );
        const stat = await adapter.stat(path);
        if (
          !stat ||
          stat.type !== type ||
          ![stat.ctime, stat.mtime, stat.size].every(Number.isFinite) ||
          stat.size < 0
        )
          throw new Error(`Incomplete vault reconciliation snapshot: ${path}`);
        snapshot.set(path, { ...stat });
        if (type === "folder") folders.push(path);
      }
    }
  }
  return current() ? snapshot : null;
}

function validPath(path: string): boolean {
  return (
    !!path &&
    !/[\\\0]/u.test(path) &&
    path.split("/").every((part) => !!part && part !== "." && part !== "..")
  );
}
function depth(path: string): number {
  return path.split("/").length;
}
function sameType(file: TAbstractFile | undefined, stat: Stat): boolean {
  return stat.type === "file" ? file instanceof TFile : file instanceof TFolder;
}

/** Prepare all identities/events before the synchronous tree commit. */
export function projectVaultTree(
  vault: Vault,
  previous: Record<string, TAbstractFile>,
  snapshot: Snapshot,
  hints: readonly ChangeEvent[],
): { files: Record<string, TAbstractFile>; events: VaultTreeEvent[] } {
  const renamed = new Map<string, string>();
  const forced = new Set<string>();
  for (const hint of hints) {
    if (
      !validPath(hint.path) ||
      (hint.previousPath !== undefined && !validPath(hint.previousPath))
    )
      throw new Error("Invalid vault reconciliation hint");
    if (hint.type === "modify") forced.add(hint.path);
    const old = hint.previousPath;
    if (!old || old === hint.path || snapshot.has(old) || previous[hint.path])
      continue;
    const source = previous[old],
      target = snapshot.get(hint.path);
    if (!source || !target || !sameType(source, target)) continue;
    for (const path of Object.keys(previous)) {
      if (
        path !== old &&
        !(source instanceof TFolder && path.startsWith(`${old}/`))
      )
        continue;
      const destination = hint.path + path.slice(old.length);
      const stat = snapshot.get(destination);
      if (
        stat &&
        !previous[destination] &&
        !snapshot.has(path) &&
        sameType(previous[path], stat)
      ) {
        const existing = renamed.get(destination);
        if (existing && existing !== path)
          throw new Error("Ambiguous vault rename hints");
        renamed.set(destination, path);
      }
    }
  }
  const files: Record<string, TAbstractFile> = Object.create(null);
  const events: VaultTreeEvent[] = [];
  const consumed = new Set<TAbstractFile>();
  const paths = [...snapshot.keys()].sort(
    (a, b) => depth(a) - depth(b) || a.localeCompare(b),
  );
  for (const path of paths) {
    const stat = snapshot.get(path)!;
    const oldPath = renamed.get(path) ?? path;
    const existing = previous[oldPath];
    const file = sameType(existing, stat)
      ? existing!
      : stat.type === "file"
        ? new TFile(path, { ...stat }, null, vault)
        : new TFolder(path, [], null, vault);
    if (consumed.has(file))
      throw new Error("Duplicate vault resource identity");
    consumed.add(file);
    files[path] = file;
    if (path === "/") continue;
    if (file !== existing) events.push({ type: "create", file });
    else if (oldPath !== path) events.push({ type: "rename", file, oldPath });
    else if (
      file instanceof TFile &&
      (forced.has(path) ||
        file.stat.mtime !== stat.mtime ||
        file.stat.ctime !== stat.ctime ||
        file.stat.size !== stat.size)
    )
      events.push({ type: "modify", file });
  }
  const deleted = Object.values(previous).filter((file) => !consumed.has(file));
  deleted.sort(
    (a, b) => depth(b.path) - depth(a.path) || a.path.localeCompare(b.path),
  );
  events.unshift(...deleted.map((file) => ({ type: "delete" as const, file })));
  // Nothing above mutates canonical nodes. Commit after all validation succeeds.
  for (const path of paths) {
    const file = files[path]!;
    file.path = path === "/" ? "" : path;
    file.parent = path === "/" ? null : (files[dirname(path)] as TFolder);
    if (file instanceof TFile) Object.assign(file.stat, snapshot.get(path));
    else if (file instanceof TFolder) file.children.splice(0);
  }
  for (const path of paths)
    if (path !== "/") files[path]!.parent!.children.push(files[path]!);
  return { files, events };
}
