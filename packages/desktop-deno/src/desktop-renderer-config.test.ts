import { describe, expect, it } from "vitest";

import {
  rendererPluginImportMap,
  rendererOptimizeDependencyExclusions,
  rendererOptimizeDependencyInclusions,
  rendererSingletonPackages,
  rendererSvelteOptions,
} from "../vite.config";

describe("Deno desktop renderer configuration", () => {
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

  it("deduplicates the API state shared with packed plugins", () => {
    expect(rendererSingletonPackages).toContain("@lapis-notes/api");
  });

  it("maps packed plugin shared API imports to desktop host modules", () => {
    expect(rendererPluginImportMap).toEqual({
      imports: {
        "@lapis-notes/api": "/plugin-host-api.js",
        "@lapis-notes/api/workspace-host": "/plugin-host-workspace-host.js",
      },
    });
  });

  it("keeps registry Svelte component CSS in its compiled module", () => {
    expect(rendererSvelteOptions).toEqual({ emitCss: false });
  });
});
