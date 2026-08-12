import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  createDesktopTestState,
  launchDesktopApp,
  waitForDesktopWorkspace,
} from "./helpers";

test("registered plugin assets load while invalid requests fail closed", async () => {
  const state = await createDesktopTestState();
  const pluginDir = path.join(state.vaultA, ".obsidian/plugins/plugin-a");
  fs.mkdirSync(pluginDir, { recursive: true });
  const source = "export const desktopAsset = true;";
  const hash = createHash("sha256").update(source).digest("hex");
  fs.writeFileSync(path.join(pluginDir, "main.mjs"), source);
  fs.writeFileSync(
    path.join(state.vaultA, ".obsidian/installed-plugins.json"),
    JSON.stringify({
      schemaVersion: 1,
      updatedAt: "2026-08-12T00:00:00.000Z",
      plugins: {
        "plugin-a": {
          pluginId: "plugin-a",
          installedVersion: "1.0.0",
          installedAt: "2026-08-12T00:00:00.000Z",
          updatedAt: "2026-08-12T00:00:00.000Z",
          provenance: "community",
          files: [{ path: "main.mjs", sha256: hash, size: source.length }],
        },
      },
    }),
  );

  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(app.page);
    const result = await app.page.evaluate(async () => {
      const server = (
        globalThis as typeof globalThis & {
          app: {
            props: {
              pluginAssetServer?: {
                getPluginAssetUrl(request: {
                  pluginId: string;
                  version: string;
                  relativePath: string;
                }): Promise<string>;
              };
            };
          };
        }
      ).app.props.pluginAssetServer;
      if (!server) throw new Error("Plugin asset server unavailable");
      const url = await server.getPluginAssetUrl({
        pluginId: "plugin-a",
        version: "1.0.0",
        relativePath: "main.mjs",
      });
      const response = await fetch(url);
      let unregistered = false;
      let traversal = false;
      try {
        await server.getPluginAssetUrl({
          pluginId: "not-installed",
          version: "1.0.0",
          relativePath: "main.mjs",
        });
      } catch {
        unregistered = true;
      }
      try {
        await server.getPluginAssetUrl({
          pluginId: "plugin-a",
          version: "1.0.0",
          relativePath: "../main.mjs",
        });
      } catch {
        traversal = true;
      }
      return { body: await response.text(), status: response.status, unregistered, traversal };
    });
    expect(result).toEqual({ body: source, status: 200, unregistered: true, traversal: true });

    fs.writeFileSync(path.join(pluginDir, "main.mjs"), `${source}\nchanged`);
    const sizeRejected = await app.page.evaluate(async () => {
      const server = (
        globalThis as typeof globalThis & {
          app: {
            props: {
              pluginAssetServer: {
                getPluginAssetUrl(request: {
                  pluginId: string;
                  version: string;
                  relativePath: string;
                }): Promise<string>;
              };
            };
          };
        }
      ).app.props.pluginAssetServer;
      try {
        await server.getPluginAssetUrl({
          pluginId: "plugin-a",
          version: "1.0.0",
          relativePath: "main.mjs",
        });
        return false;
      } catch {
        return true;
      }
    });
    expect(sizeRejected).toBe(true);

    fs.writeFileSync(path.join(pluginDir, "main.mjs"), source.replace("true", "nope"));
    const hashRejected = await app.page.evaluate(async () => {
      const server = (
        globalThis as typeof globalThis & {
          app: {
            props: {
              pluginAssetServer: {
                getPluginAssetUrl(request: {
                  pluginId: string;
                  version: string;
                  relativePath: string;
                }): Promise<string>;
              };
            };
          };
        }
      ).app.props.pluginAssetServer;
      try {
        await server.getPluginAssetUrl({
          pluginId: "plugin-a",
          version: "1.0.0",
          relativePath: "main.mjs",
        });
        return false;
      } catch {
        return true;
      }
    });
    expect(hashRejected).toBe(true);
  } finally {
    await app.close();
    await state.cleanup();
  }
});
