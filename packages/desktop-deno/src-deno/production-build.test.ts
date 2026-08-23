import { describe, expect, it } from "vitest";

import {
  TURSO_WASM_BUNDLE_ESM,
  rendererDistRoot,
} from "./production-build";

describe("Deno desktop production build", () => {
  it("identifies Turso's published ESM bundle on supported path formats", () => {
    expect(
      TURSO_WASM_BUNDLE_ESM.test(
        "/workspace/node_modules/@tursodatabase/database-wasm/bundle/main.es.js",
      ),
    ).toBe(true);
    expect(
      TURSO_WASM_BUNDLE_ESM.test(
        "C:\\workspace\\node_modules\\@tursodatabase\\database-wasm\\bundle\\main.es.js",
      ),
    ).toBe(true);
  });

  it("does not bypass CommonJS conversion for other dependency files", () => {
    expect(
      TURSO_WASM_BUNDLE_ESM.test(
        "/workspace/node_modules/@tursodatabase/database-wasm/dist/index.js",
      ),
    ).toBe(false);
    expect(
      TURSO_WASM_BUNDLE_ESM.test(
        "/workspace/node_modules/example/bundle/main.es.js",
      ),
    ).toBe(false);
  });

  it("serves production assets from the launch directory", () => {
    expect(rendererDistRoot("/workspace/packages/desktop-deno")).toBe(
      "/workspace/packages/desktop-deno/dist",
    );
    expect(rendererDistRoot("/workspace/packages/desktop-deno/")).toBe(
      "/workspace/packages/desktop-deno/dist",
    );
    expect(rendererDistRoot("C:\\workspace\\desktop-deno\\")).toBe(
      "C:\\workspace\\desktop-deno\\dist",
    );
  });
});
