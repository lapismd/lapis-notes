import { describe, expect, it } from "vitest";

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
});
