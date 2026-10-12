// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { pluginHostModuleRegistry } from "../generated/plugin-host-modules.schema.generated";

it("publishes an isolated registry contract and keeps build tooling out of renderers", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
  );
  expect(manifest.exports["./registry/schema"].import).toBe(
    "./dist/registry-schema/index.js",
  );
  expect(manifest.exports["./build/vite"].import).toBe(
    "./dist/build-tools/vite.js",
  );
  for (const field of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
  ])
    expect(manifest[field] ?? {}).not.toHaveProperty(
      "@lapismd/lapis-community",
    );
  expect(
    pluginHostModuleRegistry["@lapis-notes/api/build/vite"].platforms,
  ).toEqual([]);
  expect(
    pluginHostModuleRegistry["@lapis-notes/api/registry/schema"].platforms,
  ).toContain("web");
});
