import { describe, expect, it } from "vitest";

import {
  rendererOptimizeDependencyExclusions,
  rendererSvelteOptions,
} from "./renderer-config";

describe("web renderer configuration", () => {
  it("keeps WASM and Svelte-source dependencies outside Vite optimization", () => {
    expect(rendererOptimizeDependencyExclusions).toEqual([
      "harper.js",
      "ghostty-web",
      "@lapismd/design-core",
    ]);
  });

  it("keeps registry Svelte component CSS in its compiled module", () => {
    expect(rendererSvelteOptions).toEqual({ emitCss: false });
  });
});
