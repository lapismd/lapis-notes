import { describe, expect, it, vi } from "vitest";

import {
  DenoPluginAssetService,
  parseDenoPluginAssetUrl,
} from "./plugin-assets";

const sha256 = "a".repeat(64);
const source = new TextEncoder().encode('export default "ok";\n');

describe("Deno plugin assets", () => {
  it("parses encoded same-origin plugin asset URLs", () => {
    expect(
      parseDenoPluginAssetUrl(
        `/__lapis/plugins/${encodeURIComponent("desktop-folder:/vault")}/plugin-a/1.0.0/${sha256}/nested/main.mjs`,
      ),
    ).toEqual({
      vaultId: "desktop-folder:/vault",
      pluginId: "plugin-a",
      version: "1.0.0",
      sha256,
      path: "nested/main.mjs",
    });
    expect(parseDenoPluginAssetUrl("/index.html")).toBeNull();
  });

  it("serves only registered files whose size and hash still match", async () => {
    const stat = vi.fn(async (path: string) => ({
      isDirectory: path.endsWith("/plugin-a"),
      isFile: path.endsWith("/main.mjs"),
      size: source.byteLength,
    }));
    const service = new DenoPluginAssetService({
      stat,
      readFile: vi.fn(async () => source),
      sha256: vi.fn(async () => sha256),
    });
    await service.register({
      vaultId: "desktop-folder:/vault",
      rootPath: "/vault",
      pluginId: "plugin-a",
      version: "1.0.0",
      pluginsPath: ".obsidian/plugins",
      installedPlugin: {
        pluginId: "plugin-a",
        installedVersion: "1.0.0",
        files: [{ path: "main.mjs", size: source.byteLength, sha256 }],
      },
    });

    const response = await service.respond(
      `http://127.0.0.1/__lapis/plugins/${encodeURIComponent("desktop-folder:/vault")}/plugin-a/1.0.0/${sha256}/main.mjs`,
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-type")).toMatch(/^text\/javascript/u);
    expect(await response?.text()).toBe('export default "ok";\n');
    expect(stat).toHaveBeenLastCalledWith(
      "/vault/.obsidian/plugins/plugin-a/main.mjs",
    );
  });

  it("rejects traversal and unregistered assets", async () => {
    expect(() =>
      parseDenoPluginAssetUrl(
        `/__lapis/plugins/vault/plugin-a/1.0.0/${sha256}/..%2Fsecret.js`,
      ),
    ).toThrow("plugin asset path");

    const service = new DenoPluginAssetService({
      stat: vi.fn(),
      readFile: vi.fn(),
      sha256: vi.fn(),
    });
    const response = await service.respond(
      `http://127.0.0.1/__lapis/plugins/vault/plugin-a/1.0.0/${sha256}/main.mjs`,
    );
    expect(response?.status).toBe(404);
  });
});
