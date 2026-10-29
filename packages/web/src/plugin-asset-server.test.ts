import {
  getInstalledPluginAssetFingerprintSha256,
  WEB_PLUGIN_ASSET_CACHE_NAME,
  sha256Hex,
  type InstalledPluginRecord,
} from "@lapis-notes/api/plugin-assets";
import { describe, expect, it, vi } from "vitest";

import {
  WebCachePluginAssetServer,
  waitForWebPluginAssetController,
  type WebPluginAssetDataAdapter,
} from "./plugin-asset-server";

class MemoryCache {
  readonly entries = new Map<string, Response>();

  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    const url =
      typeof request === "string"
        ? request
        : request instanceof URL
          ? request.pathname
          : new URL(request.url).pathname;
    this.entries.set(url, response.clone());
  }
}

class MemoryCacheStorage {
  readonly caches = new Map<string, MemoryCache>();

  async open(name: string): Promise<MemoryCache> {
    const existing = this.caches.get(name);
    if (existing) return existing;
    const cache = new MemoryCache();
    this.caches.set(name, cache);
    return cache;
  }
}

describe("WebCachePluginAssetServer", () => {
  it("waits for a controlling service worker before returning an installed asset URL", async () => {
    const bytes = new TextEncoder().encode("export default class Plugin {}");
    const installedPlugin: InstalledPluginRecord = {
      pluginId: "plugin-a",
      installedVersion: "1.2.3",
      installedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      provenance: "official",
      files: [
        {
          path: "main.mjs",
          sha256: await sha256Hex(bytes),
          size: bytes.byteLength,
        },
      ],
    };
    const adapter = createAdapter({
      ".lapis/installed-plugins.json": JSON.stringify({
        plugins: { "plugin-a": installedPlugin },
      }),
      ".lapis/plugins/plugin-a/main.mjs": bytes,
    });
    const cacheStorage = new MemoryCacheStorage();
    const serviceWorker = new EventTarget() as EventTarget & {
      controller: ServiceWorker | null;
    };
    serviceWorker.controller = null;
    const removeListener = vi.spyOn(serviceWorker, "removeEventListener");
    const options = {
      adapter,
      cacheStorage: cacheStorage as unknown as CacheStorage,
      serviceWorker,
    };
    const server = new WebCachePluginAssetServer(options);
    let returned = false;
    const pending = server
      .getPluginAssetUrl({
        pluginId: "plugin-a",
        pluginPath: ".lapis/plugins/plugin-a",
        relativePath: "main.mjs",
        version: "1.2.3",
      })
      .then((url) => {
        returned = true;
        return url;
      });
    await vi.waitFor(() =>
      expect(
        cacheStorage.caches.get(WEB_PLUGIN_ASSET_CACHE_NAME)?.entries.size,
      ).toBe(1),
    );
    expect(returned).toBe(false);
    serviceWorker.controller = {} as ServiceWorker;
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(await pending).toMatch(/\/main\.mjs$/u);
    expect(removeListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
    );
  });

  it("mirrors only hash-verified installed plugin assets into Cache Storage", async () => {
    const mainBytes = new TextEncoder().encode("import './chunk.mjs';");
    const chunkBytes = new TextEncoder().encode("export const value = 1;");
    const mainSha256 = await sha256Hex(mainBytes);
    const chunkSha256 = await sha256Hex(chunkBytes);
    const installedPlugin: InstalledPluginRecord = {
      pluginId: "plugin-a",
      installedVersion: "1.2.3",
      installedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      provenance: "official",
      files: [
        { path: "main.mjs", sha256: mainSha256, size: mainBytes.byteLength },
        { path: "chunk.mjs", sha256: chunkSha256, size: chunkBytes.byteLength },
      ],
    };
    const adapter = createAdapter({
      ".lapis/installed-plugins.json": JSON.stringify({
        schemaVersion: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
        plugins: { "plugin-a": installedPlugin },
      }),
      ".lapis/plugins/plugin-a/main.mjs": mainBytes,
      ".lapis/plugins/plugin-a/chunk.mjs": chunkBytes,
    });
    const cacheStorage = new MemoryCacheStorage();
    const server = new WebCachePluginAssetServer({
      adapter,
      cacheStorage: cacheStorage as unknown as CacheStorage,
      serviceWorker: {
        controller: {} as ServiceWorker,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    const url = await server.getPluginAssetUrl({
      pluginId: "plugin-a",
      pluginPath: ".lapis/plugins/plugin-a",
      relativePath: "main.mjs",
      version: "1.2.3",
    });
    const fingerprintSha256 =
      await getInstalledPluginAssetFingerprintSha256(installedPlugin);

    expect(url).toBe(
      `/__lapis/plugins/test-vault/plugin-a/1.2.3/${fingerprintSha256}/main.mjs`,
    );
    const cache = cacheStorage.caches.get(WEB_PLUGIN_ASSET_CACHE_NAME);
    expect(await cache?.entries.get(url)?.text()).toBe("import './chunk.mjs';");
    expect(
      cache?.entries.get(url)?.headers.get("Cross-Origin-Embedder-Policy"),
    ).toBe("require-corp");
    const relativeChunkUrl = new URL("./chunk.mjs", `https://lapis.local${url}`)
      .pathname;
    expect(await cache?.entries.get(relativeChunkUrl)?.text()).toBe(
      "export const value = 1;",
    );
    expect(
      cache?.entries
        .get(relativeChunkUrl)
        ?.headers.get("Cross-Origin-Resource-Policy"),
    ).toBe("same-origin");
    expect(relativeChunkUrl).toBe(
      `/__lapis/plugins/test-vault/plugin-a/1.2.3/${fingerprintSha256}/chunk.mjs`,
    );
  });

  it("rejects traversal and asset-version mismatches", async () => {
    const adapter = createAdapter({
      ".lapis/installed-plugins.json": JSON.stringify({
        schemaVersion: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
        plugins: {
          "plugin-a": {
            pluginId: "plugin-a",
            installedVersion: "1.0.0",
            installedAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: "official",
            files: [],
          },
        },
      }),
    });
    const server = new WebCachePluginAssetServer({
      adapter,
      cacheStorage: new MemoryCacheStorage() as unknown as CacheStorage,
    });

    await expect(
      server.getPluginAssetUrl({
        pluginId: "plugin-a",
        pluginPath: ".lapis/plugins/plugin-a",
        relativePath: "../main.mjs",
        version: "1.0.0",
      }),
    ).rejects.toMatchObject({ code: "invalid-path" });
    await expect(
      server.getPluginAssetUrl({
        pluginId: "plugin-a",
        pluginPath: ".lapis/plugins/plugin-a",
        relativePath: "main.mjs",
        version: "2.0.0",
      }),
    ).rejects.toMatchObject({ code: "asset-version-mismatch" });
  });
});

function createAdapter(
  files: Record<string, string | Uint8Array>,
): WebPluginAssetDataAdapter {
  const normalizedFiles = new Map(
    Object.entries(files).map(([path, value]) => [normalize(path), value]),
  );
  return {
    getName: () => "memory",
    getVaultId: () => "test-vault",
    read: async (path: string) => {
      const value = normalizedFiles.get(normalize(path));
      if (typeof value === "string") return value;
      if (isUint8Array(value)) return new TextDecoder().decode(value);
      throw Object.assign(new Error(`ENOENT: ${path}`), { code: "ENOENT" });
    },
    readBinary: async (path: string): Promise<ArrayBuffer> => {
      const value = normalizedFiles.get(normalize(path));
      if (isUint8Array(value)) {
        return value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength,
        ) as ArrayBuffer;
      }
      if (typeof value === "string") {
        return new TextEncoder().encode(value).buffer as ArrayBuffer;
      }
      throw Object.assign(new Error(`ENOENT: ${path}`), { code: "ENOENT" });
    },
  };
}

function normalize(path: string): string {
  return path.replace(/^\/+/, "");
}

function isUint8Array(value: unknown): value is Uint8Array {
  return (
    ArrayBuffer.isView(value) &&
    (value as { constructor?: { name?: string } }).constructor?.name ===
      "Uint8Array"
  );
}

describe("plugin asset controller readiness", () => {
  it("bounds startup and removes its listener when control never arrives", async () => {
    vi.useFakeTimers();
    try {
      const serviceWorker = {
        controller: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const pending = waitForWebPluginAssetController(serviceWorker);
      const failure = expect(pending).rejects.toMatchObject({
        code: "asset-server-unavailable",
      });
      await vi.advanceTimersByTimeAsync(30_000);
      await failure;
      expect(serviceWorker.removeEventListener).toHaveBeenCalledWith(
        "controllerchange",
        expect.any(Function),
      );
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
