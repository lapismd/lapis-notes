import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("packaged class helper", () => {
  it("declares its external imports as runtime dependencies", () => {
    const source = readFileSync(new URL("./utils.ts", import.meta.url), "utf8");
    const manifest = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    );
    const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)];
    expect(imports.length).toBeGreaterThan(0);
    for (const [, name] of imports) {
      expect(
        manifest.dependencies[name],
        `${name} must install for consumers`,
      ).toBeTruthy();
    }
  });
});
