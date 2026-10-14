import { describe, expect, it } from "vitest";

import { TURSO_WASM_BUNDLE_ESM, rendererDistRoot } from "./production-build";

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

  it("serves packaged assets relative to the embedded native module", () => {
    expect(
      rendererDistRoot("file:///embedded/Lapis%20Notes/src-deno/main.ts"),
    ).toBe("/embedded/Lapis Notes/dist/");
    expect(
      rendererDistRoot("file:///embedded/desktop-deno/src-deno/main.ts"),
    ).toBe("/embedded/desktop-deno/dist/");
  });
});
