import { appStatePath } from "@lapis-notes/api/path";
import { extname } from "node:path";

import { ServerHostError } from "@lapis-notes/api/server-host";
import {
  getInstalledPluginAssetHash,
  getInstalledPluginAssetVersion,
  getPluginAssetContentType,
  parseWebPluginAssetUrl,
  readInstalledPluginAsset,
  type InstalledPluginRecord,
} from "@lapis-notes/api/plugin-assets";

import type { ControlSession, ServerVaultRole } from "./control-database.ts";
import type { ServerServices } from "./context.ts";
import { assertCsrf } from "./auth.ts";
import { isOfficialPluginBundleSource } from "./plugin-bundle-source.ts";

const roleRank: Record<ServerVaultRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

const MAX_FILE_WRITE_BYTES = 64 * 1024 * 1024;
const MAX_PLUGIN_BUNDLE_BYTES = 64 * 1024 * 1024;

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

function boundedBody(
  body: ReadableStream<Uint8Array>,
  maximumBytes: number,
): ReadableStream<Uint8Array> {
  let received = 0;
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > maximumBytes) {
          controller.error(new Error("Plugin bundle response is too large"));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );
}

export async function handlePluginBundleDownloadRoute(
  request: Request,
  services: ServerServices,
  session?: ControlSession,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<Response | null> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (
    parts[0] !== "api" ||
    parts[1] !== "vaults" ||
    !parts[2] ||
    parts[3] !== "plugin-bundles" ||
    parts[4] !== "download" ||
    parts.length !== 5
  ) {
    return null;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }
  await requireRole(services, session, parts[2], "editor");
  const source = url.searchParams.get("source") ?? "";
  if (!isOfficialPluginBundleSource(source)) {
    throw new ServerHostError(
      "PRECONDITION_FAILED",
      "Plugin bundle source is not permitted",
    );
  }

  let upstream: Response;
  try {
    upstream = await fetchImpl(source, {
      method: request.method,
      redirect: "follow",
      signal: request.signal,
      headers: { Accept: "application/octet-stream" },
    });
  } catch {
    throw new ServerHostError("NOT_FOUND", "Plugin bundle download failed");
  }
  if (!upstream.ok) {
    upstream.body?.cancel().catch(() => undefined);
    throw new ServerHostError(
      "NOT_FOUND",
      `Plugin bundle download failed (${upstream.status})`,
    );
  }
  const contentLengthHeader = upstream.headers.get("content-length");
  const contentLength =
    contentLengthHeader === null ? undefined : Number(contentLengthHeader);
  if (
    contentLength !== undefined &&
    Number.isFinite(contentLength) &&
    (contentLength < 0 || contentLength > MAX_PLUGIN_BUNDLE_BYTES)
  ) {
    upstream.body?.cancel().catch(() => undefined);
    throw new ServerHostError(
      "PRECONDITION_FAILED",
      "Plugin bundle response is too large",
    );
  }

  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Type": "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (contentLength !== undefined && Number.isSafeInteger(contentLength)) {
    headers.set("Content-Length", String(contentLength));
  }
  return new Response(
    request.method === "HEAD" || !upstream.body
      ? null
      : boundedBody(upstream.body, MAX_PLUGIN_BUNDLE_BYTES),
    { status: 200, headers },
  );
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

export async function handlePluginAssetRoute(
  request: Request,
  services: ServerServices,
  session?: ControlSession,
): Promise<Response | null> {
  let parsed;
  try {
    parsed = parseWebPluginAssetUrl(request.url);
  } catch {
    return null;
  }
  if (!new URL(request.url).pathname.startsWith("/__lapis/plugins/"))
    return null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  await requireRole(services, session, parsed.vaultId, "viewer");
  const metadata = JSON.parse(
    new TextDecoder().decode(
      (
        await services.store.read(
          parsed.vaultId,
          appStatePath("installed-plugins.json"),
        )
      ).bytes,
    ),
  ) as { plugins?: Record<string, InstalledPluginRecord> };
  const installed = metadata.plugins?.[parsed.pluginId];
  if (
    !installed ||
    getInstalledPluginAssetVersion(installed) !== parsed.version ||
    getInstalledPluginAssetHash(installed, parsed.path) !== parsed.sha256
  ) {
    throw new ServerHostError("NOT_FOUND", "Plugin asset not found");
  }
  const asset = await readInstalledPluginAsset({
    adapter: {
      readBinary: async (path) =>
        bytesBody((await services.store.read(parsed.vaultId, path)).bytes),
    },
    installedPlugin: installed,
    relativePath: parsed.path,
    expectedSha256: parsed.sha256,
  });
  const etag = `"${asset.sha256}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }
  const requestedRange = range(
    request.headers.get("range"),
    asset.bytes.byteLength,
  );
  const body = requestedRange
    ? asset.bytes.slice(requestedRange.start, requestedRange.end + 1)
    : asset.bytes;
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
    "Content-Length": String(body.byteLength),
    "Content-Type": getPluginAssetContentType(asset.path),
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
    "X-Lapis-Plugin-Asset-Sha256": asset.sha256,
  });
  if (requestedRange) {
    headers.set(
      "Content-Range",
      `bytes ${requestedRange.start}-${requestedRange.end}/${asset.bytes.byteLength}`,
    );
  }
  return new Response(request.method === "HEAD" ? null : bytesBody(body), {
    status: requestedRange ? 206 : 200,
    headers,
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
