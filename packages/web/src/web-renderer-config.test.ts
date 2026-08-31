import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  rendererOptimizeDependencyExclusions,
  rendererOptimizeDependencyInclusions,
  rendererSvelteOptions,
} from "./renderer-config";

describe("web renderer configuration", () => {
  it("keeps WASM and Svelte-source dependencies outside Vite optimization", () => {
    expect(rendererOptimizeDependencyExclusions).toEqual([
      "@lapis-notes/api",
      "harper.js",
      "ghostty-web",
      "@lapismd/design-core",
    ]);
  });

  it("pre-bundles Mira's deep modules as one package boundary", () => {
    expect(rendererOptimizeDependencyInclusions).toEqual(["@lapismd/mira/**"]);
  });

  it("keeps registry Svelte component CSS in its compiled module", () => {
    expect(rendererSvelteOptions).toEqual({ emitCss: false });
  });

  it("keeps the Workbox plugin asset route self-contained", async () => {
    const viteConfig = await readFile(
      path.resolve(process.cwd(), "vite.config.ts"),
      "utf8",
    );

    expect(viteConfig).toContain(
      'url.pathname.startsWith("/__lapis/plugins/")',
    );
    expect(viteConfig).not.toContain(
      "url.pathname.startsWith(`${WEB_PLUGIN_ASSET_ROUTE_PREFIX}/`)",
    );
  });

  it("provides host-owned ESM modules to installed renderer plugins", async () => {
    const sessionSource = await readFile(
      path.resolve(process.cwd(), "src/WebWorkspaceSession.svelte"),
      "utf8",
    );

    expect(sessionSource).toContain("createNotesPluginDependencyResolver");
    expect(sessionSource).toContain(
      "createCommunityPluginDependencyResolver:\n          createNotesPluginDependencyResolver",
    );
    expect(sessionSource).not.toContain("globalThis.app");
  });
});
