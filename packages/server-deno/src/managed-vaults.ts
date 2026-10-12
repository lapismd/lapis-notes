import { dirname, join } from "node:path";

import { ServerHostError } from "@lapis-notes/api/server-host";
import {
  mkdirWhenPathExists,
  normalizeVaultPath,
} from "@lapis-notes/deno-host-services/paths";

import { VaultEventHub } from "./events.ts";

const VAULT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type ManagedVaultPaths = {
  root: string;
  content: string;
  state: string;
  database: string;
};

function invalidPath(message = "Invalid vault path"): never {
  throw new ServerHostError("INVALID_PATH", message);
}

function contained(root: string, target: string): boolean {
  return target === root || target.startsWith(`${root}/`);
}

export function managedVaultPaths(
  dataRoot: string,
  vaultId: string,
): ManagedVaultPaths {
  if (!VAULT_ID.test(vaultId)) invalidPath("Invalid vault id");
  const root = join(dataRoot, "vaults", vaultId);
  return {
    root,
    content: join(root, "content"),
    state: join(root, "state"),
    database: join(root, "state", "app.turso"),
  };
}

export function normalizeManagedPath(value: string): string {
  if (
    value.includes("\0") ||
    value.startsWith("/") ||
    /^[a-z]:[/\\]/iu.test(value)
  ) {
    invalidPath();
  }
  try {
    const normalized = normalizeVaultPath(value);
    if (!normalized) invalidPath();
    return normalized;
  } catch {
    invalidPath();
  }
}

export async function resolveManagedPath(
  contentRoot: string,
  relativePath: string,
  mode: "read" | "write",
): Promise<string> {
  const normalized = normalizeManagedPath(relativePath);
  const canonicalRoot = await Deno.realPath(contentRoot);
  const target = join(canonicalRoot, normalized);
  try {
    const canonicalTarget = await Deno.realPath(target);
    if (!contained(canonicalRoot, canonicalTarget))
      invalidPath("Vault symlink escape");
    return canonicalTarget;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound) || mode === "read")
      throw error;
    let ancestor = dirname(target);
    let canonicalParent: string | undefined;
    while (!canonicalParent) {
      try {
        canonicalParent = await Deno.realPath(ancestor);
      } catch (parentError) {
        if (!(parentError instanceof Deno.errors.NotFound)) throw parentError;
        const parent = dirname(ancestor);
        if (parent === ancestor) invalidPath("Vault parent is unavailable");
        ancestor = parent;
      }
    }
    if (!contained(canonicalRoot, canonicalParent))
      invalidPath("Vault symlink escape");
    return target;
  }
}

export function strongEtag(bytes: Uint8Array): Promise<string> {
  return crypto.subtle
    .digest(
      "SHA-256",
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    )
    .then((digest) => {
      const hex = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      return `"${hex}"`;
    });
}

export class ManagedVaultStore {
  readonly #queues = new Map<string, Promise<unknown>>();

  constructor(
    readonly dataRoot: string,
    readonly events: VaultEventHub,
  ) {}

  async initialize(): Promise<void> {
    await Deno.mkdir(join(this.dataRoot, "control"), { recursive: true });
    await Deno.mkdir(join(this.dataRoot, "vaults"), { recursive: true });
    await Deno.mkdir(join(this.dataRoot, "imports"), { recursive: true });
  }

  async create(vaultId: string): Promise<ManagedVaultPaths> {
    const paths = managedVaultPaths(this.dataRoot, vaultId);
    await Deno.mkdir(paths.content, { recursive: true });
    await Deno.mkdir(paths.state, { recursive: true });
    return paths;
  }

  async removeCreated(vaultId: string): Promise<void> {
    const paths = managedVaultPaths(this.dataRoot, vaultId);
    await Deno.remove(paths.root, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }

  async read(
    vaultId: string,
    relativePath: string,
  ): Promise<{
    bytes: Uint8Array;
    etag: string;
    mtime: number;
  }> {
    const paths = managedVaultPaths(this.dataRoot, vaultId);
    const absolute = await resolveManagedPath(
      paths.content,
      relativePath,
      "read",
    );
    const [bytes, stat] = await Promise.all([
      Deno.readFile(absolute),
      Deno.stat(absolute),
    ]);
    if (!stat.isFile)
      throw new ServerHostError("NOT_FOUND", "Vault file not found");
    return {
      bytes,
      etag: await strongEtag(bytes),
      mtime: stat.mtime?.getTime() ?? 0,
    };
  }

  async stat(
    vaultId: string,
    relativePath: string,
  ): Promise<{
    type: "file" | "folder";
    size: number;
    mtime: number;
    etag?: string;
  } | null> {
    const paths = managedVaultPaths(this.dataRoot, vaultId);
    try {
      const absolute =
        !relativePath || relativePath === "/"
          ? await Deno.realPath(paths.content)
          : await resolveManagedPath(paths.content, relativePath, "read");
      const stat = await Deno.stat(absolute);
      if (stat.isDirectory) {
        return { type: "folder", size: 0, mtime: stat.mtime?.getTime() ?? 0 };
      }
      if (!stat.isFile) return null;
      const bytes = await Deno.readFile(absolute);
      return {
        type: "file",
        size: stat.size,
        mtime: stat.mtime?.getTime() ?? 0,
        etag: await strongEtag(bytes),
      };
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return null;
      throw error;
    }
  }

  async list(
    vaultId: string,
    relativePath: string,
  ): Promise<{ files: string[]; folders: string[] }> {
    const paths = managedVaultPaths(this.dataRoot, vaultId);
    const absolute =
      !relativePath || relativePath === "/"
        ? await Deno.realPath(paths.content)
        : await resolveManagedPath(paths.content, relativePath, "read");
    const files: string[] = [];
    const folders: string[] = [];
    for await (const entry of Deno.readDir(absolute)) {
      if (entry.isDirectory) folders.push(entry.name);
      else if (entry.isFile) files.push(entry.name);
    }
    files.sort((left, right) => left.localeCompare(right));
    folders.sort((left, right) => left.localeCompare(right));
    return { files, folders };
  }

  async replace(
    vaultId: string,
    relativePath: string,
    bytes: Uint8Array,
    precondition: { ifMatch?: string; ifNoneMatch?: string } = {},
  ): Promise<string> {
    return this.mutate(vaultId, async () => {
      const paths = managedVaultPaths(this.dataRoot, vaultId);
      const absolute = await resolveManagedPath(
        paths.content,
        relativePath,
        "write",
      );
      let current: { etag: string } | undefined;
      try {
        current = await this.read(vaultId, relativePath);
      } catch (error) {
        if (
          !(error instanceof Deno.errors.NotFound) &&
          !(error instanceof ServerHostError && error.code === "NOT_FOUND")
        ) {
          throw error;
        }
      }
      if (precondition.ifMatch && current?.etag !== precondition.ifMatch) {
        throw new ServerHostError(
          "PRECONDITION_FAILED",
          "File ETag does not match",
        );
      }
      if (precondition.ifNoneMatch === "*" && current) {
        throw new ServerHostError("PRECONDITION_FAILED", "File already exists");
      }
      await Deno.mkdir(dirname(absolute), { recursive: true });
      const temp = join(dirname(absolute), `.${crypto.randomUUID()}.lapis-tmp`);
      try {
        await Deno.writeFile(temp, bytes, { createNew: true });
        await Deno.rename(temp, absolute);
      } finally {
        await Deno.remove(temp).catch(() => undefined);
      }
      const etag = await strongEtag(bytes);
      this.events.publish(vaultId, "file", {
        type: current ? "modify" : "create",
        path: normalizeManagedPath(relativePath),
        etag,
      });
      return etag;
    });
  }

  async append(
    vaultId: string,
    relativePath: string,
    bytes: Uint8Array,
  ): Promise<string> {
    return this.mutate(vaultId, async () => {
      const paths = managedVaultPaths(this.dataRoot, vaultId);
      const absolute = await resolveManagedPath(
        paths.content,
        relativePath,
        "write",
      );
      await Deno.mkdir(dirname(absolute), { recursive: true });
      const file = await Deno.open(absolute, {
        append: true,
        create: true,
        write: true,
      });
      try {
        await file.write(bytes);
      } finally {
        file.close();
      }
      const value = await this.read(vaultId, relativePath);
      this.events.publish(vaultId, "file", {
        type: "modify",
        path: normalizeManagedPath(relativePath),
        etag: value.etag,
      });
      return value.etag;
    });
  }

  async mkdir(
    vaultId: string,
    relativePath: string,
    recursive = false,
  ): Promise<void> {
    await this.mutate(vaultId, async () => {
      const paths = managedVaultPaths(this.dataRoot, vaultId);
      const absolute = await resolveManagedPath(
        paths.content,
        relativePath,
        "write",
      );
      const existing = await Deno.stat(absolute)
        .then((stat) => ({ isDirectory: stat.isDirectory }))
        .catch((error) => {
          if (error instanceof Deno.errors.NotFound) return null;
          throw error;
        });
      const action = mkdirWhenPathExists(existing);
      if (action === "skip") return;
      if (action === "eexist") {
        throw new ServerHostError(
          "CONFLICT",
          "A file already exists at this path",
        );
      }
      try {
        await Deno.mkdir(absolute, { recursive });
      } catch (error) {
        if (error instanceof Deno.errors.AlreadyExists) {
          const raced = await Deno.stat(absolute)
            .then((stat) => ({ isDirectory: stat.isDirectory }))
            .catch((statError) => {
              if (statError instanceof Deno.errors.NotFound) return null;
              throw statError;
            });
          if (mkdirWhenPathExists(raced) === "skip") return;
          throw new ServerHostError(
            "CONFLICT",
            "A file already exists at this path",
          );
        }
        throw error;
      }
      this.events.publish(vaultId, "file", {
        type: "create",
        path: normalizeManagedPath(relativePath),
      });
    });
  }

  async rename(vaultId: string, from: string, to: string): Promise<void> {
    await this.mutate(vaultId, async () => {
      const paths = managedVaultPaths(this.dataRoot, vaultId);
      const source = await resolveManagedPath(paths.content, from, "read");
      const destination = await resolveManagedPath(paths.content, to, "write");
      await Deno.mkdir(dirname(destination), { recursive: true });
      await Deno.rename(source, destination);
      this.events.publish(vaultId, "file", {
        type: "rename",
        from: normalizeManagedPath(from),
        to: normalizeManagedPath(to),
      });
    });
  }

  async copy(vaultId: string, from: string, to: string): Promise<void> {
    await this.mutate(vaultId, async () => {
      const paths = managedVaultPaths(this.dataRoot, vaultId);
      const source = await resolveManagedPath(paths.content, from, "read");
      const destination = await resolveManagedPath(paths.content, to, "write");
      if (!(await Deno.stat(source)).isFile) {
        throw new ServerHostError(
          "PRECONDITION_FAILED",
          "Only files can be copied",
        );
      }
      await Deno.mkdir(dirname(destination), { recursive: true });
      await Deno.copyFile(source, destination);
      this.events.publish(vaultId, "file", {
        type: "create",
        path: normalizeManagedPath(to),
      });
    });
  }

  async remove(
    vaultId: string,
    relativePath: string,
    recursive = false,
  ): Promise<void> {
    await this.mutate(vaultId, async () => {
      const paths = managedVaultPaths(this.dataRoot, vaultId);
      const absolute = await resolveManagedPath(
        paths.content,
        relativePath,
        "read",
      );
      await Deno.remove(absolute, { recursive });
      this.events.publish(vaultId, "file", {
        type: "delete",
        path: normalizeManagedPath(relativePath),
      });
    });
  }

  async trash(vaultId: string, relativePath: string): Promise<string> {
    const normalized = normalizeManagedPath(relativePath);
    const name = normalized.slice(normalized.lastIndexOf("/") + 1);
    const destination = `.trash/${Date.now()}-${crypto.randomUUID()}-${name}`;
    await this.rename(vaultId, normalized, destination);
    return destination;
  }

  async mutate<T>(vaultId: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.#queues.get(vaultId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(operation);
    this.#queues.set(vaultId, next);
    try {
      return await next;
    } finally {
      if (this.#queues.get(vaultId) === next) this.#queues.delete(vaultId);
    }
  }
}
