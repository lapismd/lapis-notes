import { readdirSync, readFileSync } from "node:fs";
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

  it("declares every retained UI source import for package consumers", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    );
    const declared = {
      ...manifest.dependencies,
      ...manifest.peerDependencies,
      ...manifest.optionalDependencies,
    };
    const missing = new Set<string>();
    function inspect(directory: URL) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = new URL(entry.name, directory);
        if (entry.isDirectory()) {
          inspect(new URL(`${entry.name}/`, directory));
          continue;
        }
        if (
          !/\.(?:ts|js|svelte)$/.test(entry.name) ||
          /\.(?:test|spec|stories)\./.test(entry.name)
        )
          continue;
        const source = readFileSync(file, "utf8");
        for (const [, specifier] of source.matchAll(
          /(?:from|import)\s*(?:\(\s*)?["']([^"']+)["']/g,
        )) {
          if (/^(?:\.|\/|\$|node:)/.test(specifier)) continue;
          const name = specifier
            .split("/")
            .slice(0, specifier.startsWith("@") ? 2 : 1)
            .join("/");
          if (!declared[name]) missing.add(name);
        }
      }
    }
    inspect(new URL("./", import.meta.url));
    expect([...missing].sort()).toEqual([]);
  });
});
