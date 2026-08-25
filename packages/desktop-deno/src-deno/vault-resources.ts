import {
  makeFsError,
  normalizeRootPath,
  normalizeVaultPath,
  resolveAbsolutePath,
} from "./paths.ts";

export const DENO_VAULT_RESOURCE_ROUTE_PREFIX = "/__lapis/vault-resources";

type VaultResourceIo = {
  stat(path: string): Promise<{
    isFile: boolean;
    size: number;
  }>;
  readFile(path: string): Promise<Uint8Array>;
};

type RegisteredRoot = {
  rootPath: string;
};

function invalid(label: string): Error & { code: string } {
  return makeFsError("EINVAL", label);
}

function requiredString(value: unknown, label: string, limit = 8_192): string {
  if (typeof value !== "string") throw invalid(label);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > limit || trimmed.includes("\0")) {
    throw invalid(label);
  }
  return trimmed;
}

function decode(value: string, label: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw invalid(label);
  }
}

function contentType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".apng")) return "image/apng";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (lower.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  return "application/octet-stream";
}

function parseVaultResourceUrl(value: string): {
  token: string;
  normalizedPath: string;
} | null {
  const url = new URL(value, "http://lapis.local");
  const prefix = DENO_VAULT_RESOURCE_ROUTE_PREFIX.split("/").filter(Boolean);
  const parts = url.pathname.split("/").filter(Boolean);
  if (
    parts.length < prefix.length + 2 ||
    !prefix.every((part, index) => parts[index] === part)
  ) {
    return null;
  }
  const [encodedToken, ...encodedPath] = parts.slice(prefix.length);
  const token = requiredString(
    decode(encodedToken, "vault resource token"),
    "vault resource token",
    200,
  );
  if (!/^[0-9a-f-]{36}$/u.test(token)) {
    throw invalid("vault resource token");
  }
  const normalizedPath = normalizeVaultPath(
    encodedPath.map((part) => decode(part, "vault resource path")).join("/"),
  );
  if (!normalizedPath) throw invalid("vault resource path");
  return { token, normalizedPath };
}

const defaultIo: VaultResourceIo = {
  stat: async (path) => {
    const stat = await Deno.stat(path);
    return { isFile: stat.isFile, size: stat.size };
  },
  readFile: (path) => Deno.readFile(path),
};

export class DenoVaultResourceService {
  readonly #rootsByToken = new Map<string, RegisteredRoot>();
  readonly #tokensByRoot = new Map<string, string>();

  constructor(private readonly io: VaultResourceIo = defaultIo) {}

  getUrl(payload: Record<string, unknown>): string {
    const rootPath = normalizeRootPath(
      requiredString(payload.rootPath, "vault resource root", 4_000),
    );
    resolveAbsolutePath(rootPath, "");
    const normalizedPath = normalizeVaultPath(
      requiredString(payload.normalizedPath, "vault resource path", 4_000),
    );
    if (!normalizedPath) throw invalid("vault resource path");
    resolveAbsolutePath(rootPath, normalizedPath);

    let token = this.#tokensByRoot.get(rootPath);
    if (!token) {
      token = crypto.randomUUID();
      this.#tokensByRoot.set(rootPath, token);
      this.#rootsByToken.set(token, { rootPath });
    }
    const encodedPath = normalizedPath
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    return `${DENO_VAULT_RESOURCE_ROUTE_PREFIX}/${token}/${encodedPath}`;
  }

  async respond(request: Request): Promise<Response | null> {
    let parsed: ReturnType<typeof parseVaultResourceUrl>;
    try {
      parsed = parseVaultResourceUrl(request.url);
    } catch (error) {
      const code =
        (error as { code?: string }).code ?? "Invalid vault resource";
      return new Response(code, { status: 400 });
    }
    if (!parsed) return null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    try {
      const context = this.#rootsByToken.get(parsed.token);
      if (!context) {
        return new Response("Vault resource not found", { status: 404 });
      }
      const absolutePath = resolveAbsolutePath(
        context.rootPath,
        parsed.normalizedPath,
      );
      const stat = await this.io.stat(absolutePath);
      if (!stat.isFile) {
        return new Response("Vault resource not found", { status: 404 });
      }
      const headers = {
        "Cache-Control": "no-store",
        "Content-Length": String(stat.size),
        "Content-Type": contentType(parsed.normalizedPath),
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      };
      if (request.method === "HEAD") {
        return new Response(null, { headers });
      }
      const bytes = await this.io.readFile(absolutePath);
      if (bytes.byteLength !== stat.size) {
        return new Response("Vault resource changed while reading", {
          status: 409,
        });
      }
      return new Response(bytes, { headers });
    } catch (error) {
      const code = (error as { code?: string }).code;
      return new Response(code ?? "Invalid vault resource", {
        status: code === "ENOENT" || code === "EISDIR" ? 404 : 400,
      });
    }
  }

  clear(): void {
    this.#rootsByToken.clear();
    this.#tokensByRoot.clear();
  }
}
