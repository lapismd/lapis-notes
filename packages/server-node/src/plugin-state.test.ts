import { describe, expect, it, vi } from "vitest";
import { createWebPluginAssetUrl } from "@lapis-notes/api/plugin-assets";
import {
  createServerPluginAssetServer,
  type ServerVaultAdapter,
} from "./browser.ts";
import { handlePluginAssetRoute } from "./direct-routes.ts";
import type { ServerServices } from "./context.ts";
import type { ControlSession } from "./control-database.ts";

const request = {
  pluginId: "word-count",
  pluginPath: ".lapis/plugins/word-count",
  version: "0.1.0",
  relativePath: "main.js",
};

describe("Node server shared state directory", () => {
  it("resolves browser plugin assets from .lapis installed state", async () => {
    const read = vi.fn(async () => JSON.stringify({ plugins: {} }));
    const assets = createServerPluginAssetServer({
      read,
    } as unknown as ServerVaultAdapter);
    await expect(assets.getPluginAssetUrl(request)).rejects.toThrow(
      "not installed",
    );
    expect(read).toHaveBeenCalledExactlyOnceWith(
      ".lapis/installed-plugins.json",
    );
  });

  it("authorizes asset requests against .lapis state on the server", async () => {
    const read = vi.fn(async () => ({
      bytes: new TextEncoder().encode('{"plugins":{}}'),
    }));
    const membership = vi.fn(async () => "owner");
    const services = {
      control: { membership },
      store: { read },
    } as unknown as ServerServices;
    const session = { userId: "owner" } as ControlSession;
    const url = createWebPluginAssetUrl({
      vaultId: "vault-one",
      pluginId: request.pluginId,
      version: request.version,
      sha256: "a".repeat(64),
      path: request.relativePath,
    });
    await expect(
      handlePluginAssetRoute(
        new Request(new URL(url, "https://notes.test")),
        services,
        session,
      ),
    ).rejects.toThrow("not found");
    expect(membership).toHaveBeenCalledExactlyOnceWith("vault-one", "owner");
    expect(read).toHaveBeenCalledExactlyOnceWith(
      "vault-one",
      ".lapis/installed-plugins.json",
    );
  });
});
