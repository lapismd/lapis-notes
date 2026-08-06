import type { App } from "./context.svelte";
import { TFile, type VaultIdentityAdapter } from "./storage/fs";
import {
  NativeDesktopVaultAdapter,
  resolveNativeDesktopVaultPathToRelative,
} from "./storage/desktop-native";
import { getAdapterVaultId } from "./storage/vault-state";
import type { PaneType } from "./workspace.svelte";

export type AppUrlHandlerParams = Record<string, string>;
export type AppUrlHandler = (params: AppUrlHandlerParams) => unknown;

export interface ParsedAppUrl {
  scheme: string;
  action: string;
  params: AppUrlHandlerParams;
}

export interface CreateLapisOpenUrlOptions {
  vault: string;
  file?: string;
  path?: string;
  paneType?: PaneType;
}

const SUPPORTED_APP_URL_SCHEMES = new Set([
  "lapis",
  "lapis-notes",
  "web+lapis",
  "obsidian",
]);

function looseDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodePathname(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => looseDecode(segment))
    .join("/");
}

function normalizeScheme(protocol: string): string {
  return protocol.replace(/:$/u, "").toLowerCase();
}

function normalizeParamValue(
  value: string | null | undefined,
): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function createParams(url: URL): AppUrlHandlerParams {
  const params: AppUrlHandlerParams = {};
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

function stripFileSubpath(path: string): string {
  return path.split(/[|#]/u, 1)[0] ?? path;
}

function normalizeVaultFilePath(path: string): string {
  return stripFileSubpath(path).replace(/^\/+/u, "").replace(/\/+$/u, "");
}

function encodeAppUrlParam(value: string): string {
  return encodeURIComponent(value).replace(/%2F/giu, "%2F");
}

function createUrl(rawUrl: string): URL {
  try {
    return new URL(rawUrl);
  } catch {
    return new URL(rawUrl.replace(/ /gu, "%20"));
  }
}

function currentVaultAliases(app: App): Set<string> {
  const adapter = app.vault.adapter as typeof app.vault.adapter &
    Partial<VaultIdentityAdapter>;
  const values = [
    app.vault.getName(),
    app.session?.profile?.id,
    app.session?.profile?.name,
    app.session ? getAdapterVaultId(app.session.vaultAdapter) : undefined,
    adapter.getVaultId?.(),
    app.appDatabase.vaultId,
  ];
  return new Set(values.filter((value): value is string => Boolean(value)));
}

function matchesCurrentVault(app: App, vault: string | undefined): boolean {
  if (!vault) {
    return true;
  }
  return currentVaultAliases(app).has(vault);
}

function resolveFile(app: App, rawFile: string): TFile | null {
  const filePath = normalizeVaultFilePath(rawFile);
  if (!filePath) {
    return null;
  }

  const candidates = [filePath, `${filePath}.md`, `${filePath}.markdown`];
  for (const candidate of candidates) {
    const file = app.vault.getFileByPath(candidate);
    if (file instanceof TFile) {
      return file;
    }
  }

  if (!filePath.includes("/")) {
    return (
      app.vault
        .getAllLoadedFiles()
        .filter((file): file is TFile => file instanceof TFile)
        .find(
          (file) =>
            file.baseName === filePath ||
            file.basename === filePath ||
            file.path === filePath,
        ) ?? null
    );
  }

  return null;
}

function paneTypeFromParams(params: AppUrlHandlerParams): PaneType | undefined {
  const paneType = params["paneType"];
  if (paneType === "tab" || paneType === "split" || paneType === "window") {
    return paneType;
  }
  return undefined;
}

export function createLapisOpenUrl(options: CreateLapisOpenUrlOptions): string {
  const params = new URLSearchParams();
  params.set("vault", options.vault);
  if (options.path) {
    params.set("path", options.path);
  } else if (options.file) {
    params.set("file", options.file);
  }
  if (options.paneType) {
    params.set("paneType", options.paneType);
  }
  return `lapis://open?${params.toString()}`;
}

export function createLapisFileUrl(vault: string, file: string): string {
  return `lapis://open?vault=${encodeAppUrlParam(vault)}&file=${encodeAppUrlParam(file)}`;
}

/**
 * Parses `lapis://` app URLs and dispatches registered protocol handlers.
 *
 * @public
 */
export class AppUrlService {
  readonly #handlers = new Map<string, Set<AppUrlHandler>>();

  constructor(private readonly app: App) {}

  /**
   * Register a handler for a custom app URL action.
   *
   * @param action - Action name to match after the app URL scheme.
   * @param handler - Callback invoked when a matching URL is dispatched.
   * @returns A cleanup function that unregisters the handler.
   * @public
   */
  registerProtocolHandler(action: string, handler: AppUrlHandler): () => void {
    const normalizedAction = action.trim();
    if (!normalizedAction) {
      throw new Error("Protocol handler action is required");
    }

    const handlers = this.#handlers.get(normalizedAction) ?? new Set();
    handlers.add(handler);
    this.#handlers.set(normalizedAction, handlers);

    return () => {
      handlers.delete(handler);
      if (!handlers.size) {
        this.#handlers.delete(normalizedAction);
      }
    };
  }

  /**
   * Parse an app URL into its normalized action and parameter map.
   *
   * @param rawUrl - Raw `lapis://`, `lapis-notes://`, or compatible app URL.
   * @returns The normalized URL request.
   * @public
   */
  parse(rawUrl: string): ParsedAppUrl {
    const url = createUrl(rawUrl);
    const scheme = normalizeScheme(url.protocol);
    if (!SUPPORTED_APP_URL_SCHEMES.has(scheme)) {
      throw new Error(`Unsupported app URL scheme: ${scheme}`);
    }

    const params = createParams(url);
    const hostAction = looseDecode(url.hostname);

    if (!hostAction && url.pathname) {
      return {
        scheme,
        action: "open",
        params: {
          ...params,
          action: "open",
          path: decodePathname(url.pathname),
        },
      };
    }

    if (hostAction === "vault") {
      const segments = url.pathname
        .split("/")
        .filter(Boolean)
        .map((segment) => looseDecode(segment));
      const [vault, ...fileParts] = segments;
      return {
        scheme,
        action: "open",
        params: {
          ...params,
          action: "open",
          ...(vault ? { vault } : {}),
          ...(fileParts.length ? { file: fileParts.join("/") } : {}),
        },
      };
    }

    const action = hostAction || "open";
    return {
      scheme,
      action,
      params: {
        ...params,
        action,
      },
    };
  }

  /**
   * Dispatch an app URL through the built-in open handler or a registered
   * custom action.
   *
   * @param rawUrl - Raw app URL to parse and execute.
   * @returns `true` when the URL was handled successfully.
   * @public
   */
  async dispatch(rawUrl: string): Promise<boolean> {
    const request = this.parse(rawUrl);
    if (request.action === "open") {
      return this.open(request.params);
    }

    const handlers = this.#handlers.get(request.action);
    if (!handlers?.size) {
      return false;
    }

    await Promise.all([...handlers].map((handler) => handler(request.params)));
    return true;
  }

  private async open(params: AppUrlHandlerParams): Promise<boolean> {
    const vault = normalizeParamValue(params["vault"]);
    if (!matchesCurrentVault(this.app, vault)) {
      return false;
    }

    let targetFile = normalizeParamValue(params["file"]);
    const absolutePath = normalizeParamValue(params["path"]);
    if (absolutePath) {
      const adapter = this.app.vault.adapter;
      if (!(adapter instanceof NativeDesktopVaultAdapter)) {
        return false;
      }
      targetFile =
        (await resolveNativeDesktopVaultPathToRelative(
          adapter.rootPath,
          absolutePath,
        )) ?? undefined;
      if (!targetFile) {
        return false;
      }
    }

    if (!targetFile) {
      return true;
    }

    const file = resolveFile(this.app, targetFile);
    if (!file) {
      return false;
    }

    const paneType = paneTypeFromParams(params);
    if (!paneType) {
      await this.app.openFile(file);
      return true;
    }

    try {
      const leaf = this.app.workspace.getLeaf(paneType);
      this.app.workspace.activeLeaf = leaf;
      await leaf.openFile(file);
      return true;
    } catch {
      return false;
    }
  }
}
