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
      "@tursodatabase/database-wasm/vite",
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
    expect(rendererPluginImportMap.imports["@lapis-notes/api"]).toBe(
      "/plugin-host-api.js",
    );
    expect(
      rendererPluginImportMap.imports["@lapis-notes/api/workspace-host"],
    ).toBe("/plugin-host-workspace-host.js");
    for (const specifier of [
      "@lapis-notes/api/editor",
      "@lapis-notes/api/editor/core",
      "@lapis-notes/api/editor/extensions/class-highlighter",
      "@lapis-notes/api/agent-tools",
      "@lapis-notes/api/vault",
      "@lapis-notes/markdown/embed",
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/language",
      "@codemirror/autocomplete",
      "@codemirror/commands",
      "@codemirror/lint",
      "@codemirror/search",
      "@lezer/common",
      "@lezer/highlight",
      "@lezer/lr",
      "svelte/renderer/5.56.10",
      "svelte/renderer/5.56.10/internal/client",
      "svelte/renderer/5.56.10/store",
    ]) {
      expect(rendererPluginImportMap.imports[specifier], specifier).toMatch(
        /^\/plugin-host-[a-z0-9-]+\.js$/u,
      );
    }
    expect(
      rendererPluginImportMap.imports["svelte/internal/client"],
    ).toBeUndefined();
    expect(
      rendererPluginImportMap.imports["svelte/renderer/99.0.0/internal/client"],
    ).toBeUndefined();
    expect(
      rendererPluginImportMap.imports["@lapis-notes/api/private"],
    ).toBeUndefined();
  });

  it("keeps registry Svelte component CSS in its compiled module", () => {
    expect(rendererSvelteOptions).toEqual({ emitCss: false });
  });
});
