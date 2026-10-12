import { describe, expect, it } from "vitest";

import { unwrapTursoBundleDataUrl } from "./vite.js";

describe("unwrapTursoBundleDataUrl", () => {
  it("unwraps the redundant URL constructor in Turso's generated bundle", () => {
    const source =
      'const worker = new Worker(url); const wasm = new URL("data:application/wasm;base64,AAAA", import.meta.url).href;';

    expect(
      unwrapTursoBundleDataUrl(
        source,
        "/workspace/node_modules/@tursodatabase/database-wasm/bundle/main.es.js",
      ),
    ).toBe(
      'const worker = new globalThis.Worker(url); const wasm = "data:application/wasm;base64,AAAA";',
    );
  });

  it("does not alter application modules", () => {
    const source =
      'const asset = new URL("./worker.js", import.meta.url).href;';

    expect(unwrapTursoBundleDataUrl(source, "/workspace/src/app.ts")).toBe(
      source,
    );
  });
});
