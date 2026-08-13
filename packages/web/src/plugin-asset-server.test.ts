import {
  WEB_PLUGIN_ASSET_CACHE_NAME,
  sha256Hex,
  type InstalledPluginRecord,
} from "@lapis-notes/api/plugin-assets";
import { describe, expect, it } from "vitest";

import {
  WebCachePluginAssetServer,
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
      ".obsidian/installed-plugins.json": JSON.stringify({
        schemaVersion: 1,
        updatedAt: "2026-01-01T00:00:00.000Z",
        plugins: { "plugin-a": installedPlugin },
      }),
      ".obsidian/plugins/plugin-a/main.mjs": mainBytes,
      ".obsidian/plugins/plugin-a/chunk.mjs": chunkBytes,
    });
    const cacheStorage = new MemoryCacheStorage();
    const server = new WebCachePluginAssetServer({
      adapter,
      cacheStorage: cacheStorage as unknown as CacheStorage,
    });

    const url = await server.getPluginAssetUrl({
      pluginId: "plugin-a",
      pluginPath: ".obsidian/plugins/plugin-a",
      relativePath: "main.mjs",
      version: "1.2.3",
    });

    expect(url).toBe(
      `/__lapis/plugins/test-vault/plugin-a/1.2.3/${mainSha256}/main.mjs`,
    );
    const cache = cacheStorage.caches.get(WEB_PLUGIN_ASSET_CACHE_NAME);
    expect(await cache?.entries.get(url)?.text()).toBe("import './chunk.mjs';");
    expect(
      await cache?.entries
        .get(
          `/__lapis/plugins/test-vault/plugin-a/1.2.3/${chunkSha256}/chunk.mjs`,
        )
        ?.text(),
    ).toBe("export const value = 1;");
  });

  it("rejects traversal and asset-version mismatches", async () => {
    const adapter = createAdapter({
      ".obsidian/installed-plugins.json": JSON.stringify({
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
        pluginPath: ".obsidian/plugins/plugin-a",
        relativePath: "../main.mjs",
        version: "1.0.0",
      }),
    ).rejects.toMatchObject({ code: "invalid-path" });
    await expect(
      server.getPluginAssetUrl({
        pluginId: "plugin-a",
        pluginPath: ".obsidian/plugins/plugin-a",
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
