import * as fs from "node:fs/promises";
import { join } from "node:path";

import { unzipSync, zipSync } from "fflate";

import { ServerHostError } from "@lapis-notes/api/server-host";

import { assertCsrf } from "./auth.ts";
import type { ControlSession } from "./control-database.ts";
import type { ServerServices } from "./context.ts";
import { managedVaultPaths, normalizeManagedPath } from "./managed-vaults.ts";

const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 100_000;

async function requireSession(
  session?: ControlSession,
): Promise<ControlSession> {
  if (!session) {
    throw new ServerHostError("UNAUTHENTICATED", "Authentication required");
  }
  return session;
}

async function readUpload(
  request: Request,
  importsRoot: string,
): Promise<{ bytes: Uint8Array; cleanup(): Promise<void> }> {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_ARCHIVE_BYTES) {
    throw new ServerHostError("PRECONDITION_FAILED", "ZIP upload is too large");
  }
  await fs.mkdir(importsRoot, { recursive: true });
  const path = join(importsRoot, `${crypto.randomUUID()}.zip.part`);
  const file = await fs.open(path, "wx");
  let size = 0;
  try {
    if (!request.body) {
      throw new ServerHostError("PRECONDITION_FAILED", "ZIP upload is empty");
    }
    const reader = request.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_ARCHIVE_BYTES) {
        await reader.cancel();
        throw new ServerHostError(
          "PRECONDITION_FAILED",
          "ZIP upload is too large",
        );
      }
      await file.writeFile(value);
    }
  } catch (error) {
    await file.close();
    await fs.rm(path).catch(() => undefined);
    throw error;
  }
  await file.close();
  if (!size) {
    await fs.rm(path).catch(() => undefined);
    throw new ServerHostError("PRECONDITION_FAILED", "ZIP upload is empty");
  }
  return {
    bytes: await fs.readFile(path),
    cleanup: () => fs.rm(path).catch(() => undefined),
  };
}

export function safeArchiveEntries(bytes: Uint8Array): Map<string, Uint8Array> {
  let archive: Record<string, Uint8Array>;
  try {
    archive = unzipSync(bytes);
  } catch {
    throw new ServerHostError("PRECONDITION_FAILED", "Invalid ZIP archive");
  }
  const entries = Object.entries(archive);
  if (entries.length > MAX_ARCHIVE_ENTRIES) {
    throw new ServerHostError(
      "PRECONDITION_FAILED",
      "ZIP has too many entries",
    );
  }
  const files = new Map<string, Uint8Array>();
  let expanded = 0;
  for (const [rawPath, contents] of entries) {
    if (rawPath.endsWith("/")) continue;
    const path = normalizeManagedPath(rawPath.replace(/\\/gu, "/"));
    expanded += contents.byteLength;
    if (expanded > MAX_EXPANDED_BYTES) {
      throw new ServerHostError(
        "PRECONDITION_FAILED",
        "ZIP expands beyond the limit",
      );
    }
    files.set(path, contents);
  }
  return files;
}

async function walkFiles(
  root: string,
  relative = "",
): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = {};
  for (const entry of await fs.readdir(join(root, relative), {
    withFileTypes: true,
  })) {
    const path = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) {
      throw new ServerHostError(
        "INVALID_PATH",
        "Vault export contains a symlink",
      );
    }
    if (entry.isDirectory()) Object.assign(files, await walkFiles(root, path));
    else if (entry.isFile()) files[path] = await fs.readFile(join(root, path));
  }
  return files;
}

export async function handleTransferRoute(
  request: Request,
  services: ServerServices,
  session?: ControlSession,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/vaults/import") {
    if (request.method !== "POST")
      return new Response("Method not allowed", { status: 405 });
    const active = await requireSession(session);
    assertCsrf(request, active, services.config.origin);
    const name = url.searchParams.get("name")?.trim();
    if (!name || name.length > 200) {
      throw new ServerHostError(
        "PRECONDITION_FAILED",
        "Vault name is required",
      );
    }
    const upload = await readUpload(
      request,
      join(services.config.dataRoot, "imports"),
    );
    const vaultId = crypto.randomUUID();
    try {
      const files = safeArchiveEntries(upload.bytes);
      await services.store.create(vaultId);
      for (const [path, contents] of files) {
        await services.store.replace(vaultId, path, contents);
      }
      await services.control.createVault({
        id: vaultId,
        name,
        ownerId: active.userId,
        now: Date.now(),
      });
      return Response.json({ vaultId }, { status: 201 });
    } catch (error) {
      await services.store.removeCreated(vaultId);
      throw error;
    } finally {
      await upload.cleanup();
    }
  }

  const match = /^\/api\/vaults\/([^/]+)\/export$/u.exec(url.pathname);
  if (!match) return null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  const active = await requireSession(session);
  const vaultId = decodeURIComponent(match[1]);
  if (!(await services.control.membership(vaultId, active.userId))) {
    throw new ServerHostError("FORBIDDEN", "Vault access denied");
  }
  const files = await walkFiles(
    managedVaultPaths(services.config.dataRoot, vaultId).content,
  );
  const bytes = zipSync(files, { level: 6 });
  return new Response(request.method === "HEAD" ? null : bytes, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="lapis-${vaultId}.zip"`,
      "Content-Length": String(bytes.byteLength),
      "Content-Type": "application/zip",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const transferLimits = {
  archiveBytes: MAX_ARCHIVE_BYTES,
  expandedBytes: MAX_EXPANDED_BYTES,
  entries: MAX_ARCHIVE_ENTRIES,
} as const;
