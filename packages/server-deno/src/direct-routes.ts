import { extname } from "node:path";

import { ServerHostError } from "@lapis-notes/api/server-host";

import type { ControlSession, ServerVaultRole } from "./control-database.ts";
import type { ServerServices } from "./context.ts";
import { assertCsrf } from "./auth.ts";

const roleRank: Record<ServerVaultRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

const MAX_FILE_WRITE_BYTES = 64 * 1024 * 1024;

function contentType(path: string): string {
  const types: Record<string, string> = {
    ".avif": "image/avif",
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wasm": "application/wasm",
    ".webm": "video/webm",
    ".webp": "image/webp",
  };
  return types[extname(path).toLowerCase()] ?? "application/octet-stream";
}

function decodePath(parts: string[]): string {
  try {
    return parts.map((part) => decodeURIComponent(part)).join("/");
  } catch {
    throw new ServerHostError("INVALID_PATH", "Malformed vault path encoding");
  }
}

function range(
  value: string | null,
  length: number,
): { start: number; end: number } | undefined {
  if (!value) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(value);
  if (!match)
    throw new ServerHostError("PRECONDITION_FAILED", "Invalid byte range");
  let start = match[1] ? Number(match[1]) : NaN;
  let end = match[2] ? Number(match[2]) : NaN;
  if (Number.isNaN(start)) {
    const suffix = end;
    if (!Number.isSafeInteger(suffix) || suffix <= 0) {
      throw new ServerHostError("PRECONDITION_FAILED", "Invalid byte range");
    }
    start = Math.max(0, length - suffix);
    end = length - 1;
  } else {
    if (Number.isNaN(end)) end = length - 1;
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      end < start ||
      start >= length
    ) {
      throw new ServerHostError("PRECONDITION_FAILED", "Invalid byte range");
    }
    end = Math.min(end, length - 1);
  }
  return { start, end };
}

async function requireRole(
  services: ServerServices,
  session: ControlSession | undefined,
  vaultId: string,
  minimum: ServerVaultRole,
): Promise<void> {
  if (!session)
    throw new ServerHostError("UNAUTHENTICATED", "Authentication required");
  const role = await services.control.membership(vaultId, session.userId);
  if (!role || roleRank[role] < roleRank[minimum]) {
    throw new ServerHostError("FORBIDDEN", "Vault access denied");
  }
}

function bytesBody(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function readBody(request: Request): Promise<Uint8Array> {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_FILE_WRITE_BYTES) {
    throw new ServerHostError("PRECONDITION_FAILED", "File body is too large");
  }
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_FILE_WRITE_BYTES) {
    throw new ServerHostError("PRECONDITION_FAILED", "File body is too large");
  }
  return body;
}

export async function handleDirectRoute(
  request: Request,
  services: ServerServices,
  session?: ControlSession,
): Promise<Response | null> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "api" || parts[1] !== "vaults" || !parts[2]) return null;
  const vaultId = parts[2];
  const route = parts[3];
  if (route !== "files" && route !== "resources") return null;
  const path = decodePath(parts.slice(4));
  const isResource = route === "resources";

  if (request.method === "GET" || request.method === "HEAD") {
    await requireRole(services, session, vaultId, "viewer");
    const file = await services.store.read(vaultId, path);
    if (request.headers.get("if-none-match") === file.etag) {
      return new Response(null, { status: 304, headers: { ETag: file.etag } });
    }
    const requestedRange = range(
      request.headers.get("range"),
      file.bytes.byteLength,
    );
    const body = requestedRange
      ? file.bytes.slice(requestedRange.start, requestedRange.end + 1)
      : file.bytes;
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": isResource
        ? "private, max-age=0, must-revalidate"
        : "no-store",
      "Content-Length": String(body.byteLength),
      "Content-Type": contentType(path),
      ETag: file.etag,
      "X-Content-Type-Options": "nosniff",
    });
    if (requestedRange) {
      headers.set(
        "Content-Range",
        `bytes ${requestedRange.start}-${requestedRange.end}/${file.bytes.byteLength}`,
      );
    }
    return new Response(request.method === "HEAD" ? null : bytesBody(body), {
      status: requestedRange ? 206 : 200,
      headers,
    });
  }

  await requireRole(services, session, vaultId, "editor");
  assertCsrf(request, session!, services.config.origin);
  if (request.method === "PUT") {
    const etag = await services.store.replace(
      vaultId,
      path,
      await readBody(request),
      {
        ifMatch: request.headers.get("if-match") ?? undefined,
        ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
      },
    );
    return new Response(null, { status: 204, headers: { ETag: etag } });
  }
  if (
    request.method === "POST" &&
    url.searchParams.get("operation") === "append"
  ) {
    const etag = await services.store.append(
      vaultId,
      path,
      await readBody(request),
    );
    return new Response(null, { status: 204, headers: { ETag: etag } });
  }
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "GET, HEAD, PUT, POST" },
  });
}

export function directRouteError(error: unknown): Response {
  if (error instanceof Deno.errors.NotFound) {
    return new Response("Not found", { status: 404 });
  }
  if (error instanceof ServerHostError) {
    const status: Record<string, number> = {
      UNAUTHENTICATED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      PRECONDITION_FAILED: 412,
      INVALID_PATH: 400,
      PROTOCOL_MISMATCH: 409,
      RESYNC_REQUIRED: 409,
      RATE_LIMITED: 429,
      INTERNAL: 500,
    };
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: status[error.code] ?? 500 },
    );
  }
  return Response.json(
    { error: { code: "INTERNAL", message: "Internal server error" } },
    { status: 500 },
  );
}

export { contentType };
