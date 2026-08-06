import { describe, expect, it } from "vitest";
import {
  createElectronPluginAssetUrl,
  createWebPluginAssetUrl,
  getInstalledPluginAssetHash,
  getInstalledPluginAssetVersion,
  getPluginAssetContentType,
  parseElectronPluginAssetUrl,
  parseWebPluginAssetUrl,
  PluginAssetServerError,
  readInstalledPluginAsset,
} from "../plugin-asset-server";
import { sha256Hex, type InstalledPluginRecord } from "../plugin-distribution";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

describe("plugin asset server helpers", () => {
  it("builds and parses web plugin asset URLs", () => {
    const sha256 = "a".repeat(64);
    const url = createWebPluginAssetUrl({
      vaultId: "vault one",
      pluginId: "plugin-a",
      version: "1.2.3+build",
      sha256,
      path: "chunks/main.mjs",
    });

    expect(url).toBe(
      `/__lapis/plugins/vault%20one/plugin-a/1.2.3%2Bbuild/${sha256}/chunks/main.mjs`,
    );
    expect(parseWebPluginAssetUrl(url)).toEqual({
      vaultId: "vault one",
      pluginId: "plugin-a",
      version: "1.2.3+build",
      sha256,
      path: "chunks/main.mjs",
    });
  });

  it("builds and parses Electron plugin asset URLs", () => {
    const sha256 = "b".repeat(64);
    const url = createElectronPluginAssetUrl({
      vaultId: "desktop-vault",
      pluginId: "plugin-a",
      version: "2.0.0",
      sha256,
      path: "main.mjs",
    });

    expect(url).toBe(
      `lapis-plugin://desktop-vault/plugin-a/2.0.0/${sha256}/main.mjs`,
    );
    expect(parseElectronPluginAssetUrl(url)).toEqual({
      vaultId: "desktop-vault",
      pluginId: "plugin-a",
      version: "2.0.0",
      sha256,
      path: "main.mjs",
    });
  });

  it("rejects traversal in asset paths", () => {
    expect(() =>
      createWebPluginAssetUrl({
        vaultId: "vault",
        pluginId: "plugin-a",
        version: "1.0.0",
        sha256: "c".repeat(64),
        path: "../main.mjs",
      }),
    ).toThrow(PluginAssetServerError);
    expect(() =>
      parseWebPluginAssetUrl(
        `/__lapis/plugins/vault/plugin-a/1.0.0/${"c".repeat(64)}/../main.mjs`,
      ),
    ).toThrow(PluginAssetServerError);
  });

  it("rejects plugin asset URLs without a hash segment", () => {
    expect(() =>
      parseWebPluginAssetUrl("/__lapis/plugins/vault/plugin-a/1.0.0/main.mjs"),
    ).toThrow(PluginAssetServerError);
    expect(() =>
      parseElectronPluginAssetUrl(
        "lapis-plugin://vault/plugin-a/1.0.0/main.mjs",
      ),
    ).toThrow(PluginAssetServerError);
  });

  it("returns JavaScript, CSS, JSON, WASM, and fallback MIME types", () => {
    expect(getPluginAssetContentType("main.mjs")).toBe(
      "text/javascript; charset=utf-8",
    );
    expect(getPluginAssetContentType("styles.css")).toBe(
      "text/css; charset=utf-8",
    );
    expect(getPluginAssetContentType("manifest.json")).toBe(
      "application/json; charset=utf-8",
    );
    expect(getPluginAssetContentType("module.wasm")).toBe("application/wasm");
    expect(getPluginAssetContentType("assets/file.bin")).toBe(
      "application/octet-stream",
    );
  });

  it("reads installed plugin assets and verifies size plus SHA-256", async () => {
    const adapter = new InMemoryDataAdapter();
    const bytes = new TextEncoder().encode("export const value = 1;");
    const sha256 = await sha256Hex(bytes);
    await adapter.mkdir(".obsidian");
    await adapter.mkdir(".obsidian/plugins");
    await adapter.mkdir(".obsidian/plugins/plugin-a");
    await adapter.writeBinary(
      ".obsidian/plugins/plugin-a/main.mjs",
      bytes.buffer as ArrayBuffer,
    );

    const asset = await readInstalledPluginAsset({
      adapter,
      installedPlugin: createInstalledPluginRecord({
        path: "main.mjs",
        sha256,
        size: bytes.byteLength,
      }),
      relativePath: "main.mjs",
    });

    expect(new TextDecoder().decode(asset.bytes)).toBe(
      "export const value = 1;",
    );
    expect(asset.contentType).toBe("text/javascript; charset=utf-8");
  });

  it("returns installed plugin asset hashes from verified metadata", async () => {
    const sha256 = "d".repeat(64);
    expect(
      getInstalledPluginAssetHash(
        createInstalledPluginRecord({
          path: "main.mjs",
          sha256,
          size: 1,
        }),
        "main.mjs",
      ),
    ).toBe(sha256);
  });

  it("rejects undeclared installed assets", async () => {
    const adapter = new InMemoryDataAdapter();
    await expect(
      readInstalledPluginAsset({
        adapter,
        installedPlugin: createInstalledPluginRecord({
          path: "main.mjs",
          sha256: "0".repeat(64),
          size: 0,
        }),
        relativePath: "chunk.mjs",
      }),
    ).rejects.toMatchObject({ code: "asset-not-installed" });
  });

  it("rejects missing installed files", async () => {
    const adapter = new InMemoryDataAdapter();
    await expect(
      readInstalledPluginAsset({
        adapter,
        installedPlugin: createInstalledPluginRecord({
          path: "main.mjs",
          sha256: "0".repeat(64),
          size: 0,
        }),
        relativePath: "main.mjs",
      }),
    ).rejects.toMatchObject({ code: "asset-not-found" });
  });

  it("rejects unsupported installed asset file types", async () => {
    const adapter = new InMemoryDataAdapter();
    await expect(
      readInstalledPluginAsset({
        adapter,
        installedPlugin: createInstalledPluginRecord({
          path: "asset.bin",
          sha256: "0".repeat(64),
          size: 0,
        }),
        relativePath: "asset.bin",
      }),
    ).rejects.toMatchObject({ code: "unsupported-asset-type" });
  });

  it("rejects hash mismatches", async () => {
    const adapter = new InMemoryDataAdapter();
    const bytes = new TextEncoder().encode("changed");
    await adapter.mkdir(".obsidian");
    await adapter.mkdir(".obsidian/plugins");
    await adapter.mkdir(".obsidian/plugins/plugin-a");
    await adapter.writeBinary(
      ".obsidian/plugins/plugin-a/main.mjs",
      bytes.buffer as ArrayBuffer,
    );

    await expect(
      readInstalledPluginAsset({
        adapter,
        installedPlugin: createInstalledPluginRecord({
          path: "main.mjs",
          sha256: "0".repeat(64),
          size: bytes.byteLength,
        }),
        relativePath: "main.mjs",
      }),
    ).rejects.toMatchObject({ code: "asset-hash-mismatch" });
  });

  it("rejects URL hash segments that do not match installed metadata", async () => {
    const adapter = new InMemoryDataAdapter();
    const bytes = new TextEncoder().encode("export const value = 1;");
    const sha256 = await sha256Hex(bytes);
    await adapter.mkdir(".obsidian");
    await adapter.mkdir(".obsidian/plugins");
    await adapter.mkdir(".obsidian/plugins/plugin-a");
    await adapter.writeBinary(
      ".obsidian/plugins/plugin-a/main.mjs",
      bytes.buffer as ArrayBuffer,
    );

    await expect(
      readInstalledPluginAsset({
        adapter,
        installedPlugin: createInstalledPluginRecord({
          path: "main.mjs",
          sha256,
          size: bytes.byteLength,
        }),
        relativePath: "main.mjs",
        expectedSha256: "0".repeat(64),
      }),
    ).rejects.toMatchObject({ code: "asset-hash-mismatch" });
  });

  it("uses the installed plugin version as the default URL version", () => {
    expect(getInstalledPluginAssetVersion(createInstalledPluginRecord())).toBe(
      "1.0.0",
    );
  });
});

function createInstalledPluginRecord(
  file: { path: string; sha256: string; size: number } = {
    path: "main.mjs",
    sha256: "0".repeat(64),
    size: 0,
  },
): InstalledPluginRecord {
  return {
    pluginId: "plugin-a",
    installedVersion: "1.0.0",
    installedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    provenance: "official",
    files: [file],
  };
}
