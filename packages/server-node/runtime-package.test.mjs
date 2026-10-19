import { describe, expect, it } from "vitest";
import {
  createRuntimePackage,
  runtimeExternalDependencies,
} from "./runtime-package.mjs";

function fixture() {
  const dependencies = Object.fromEntries(
    runtimeExternalDependencies.map((name) => [name, "^1.0.0"]),
  );
  return {
    manifest: {
      name: "@lapis-notes/server-node",
      version: "0.0.0",
      dependencies: { ...dependencies, "@lapis-notes/api": "workspace:*" },
    },
    lock: {
      lockfileVersion: "9.0",
      settings: { autoInstallPeers: true },
      importers: {
        "packages/server-node": {
          dependencies: Object.fromEntries(
            runtimeExternalDependencies.map((name) => [
              name,
              { specifier: "^1.0.0", version: "1.2.3" },
            ]),
          ),
        },
        "packages/api": { dependencies: {} },
      },
      packages: {
        "native@1.2.3": { resolution: { integrity: "sha512-original" } },
      },
      snapshots: {},
      overrides: { native: "^1" },
      patchedDependencies: {
        "other@1.0.0": { hash: "original", path: "patches/other.patch" },
      },
    },
  };
}

describe("standalone runtime package", () => {
  it("rejects an absent or unpinned package manager", () => {
    const { manifest, lock } = fixture();
    expect(() => createRuntimePackage(manifest, lock)).toThrow(/pinned pnpm/);
    expect(() => createRuntimePackage(manifest, lock, "pnpm@latest")).toThrow(
      /pinned pnpm/,
    );
  });

  it("installs only bundled output externals with the original frozen resolutions", () => {
    const { manifest, lock } = fixture();
    const before = structuredClone(lock);
    const result = createRuntimePackage(manifest, lock, "pnpm@10.34.5");
    expect(Object.keys(result.manifest.dependencies)).toEqual(
      runtimeExternalDependencies,
    );
    expect(result.manifest.packageManager).toBe("pnpm@10.34.5");
    expect(result.manifest.dependencies).not.toHaveProperty("@lapis-notes/api");
    expect(result.lock.importers).toEqual({
      ".": {
        dependencies: lock.importers["packages/server-node"].dependencies,
      },
    });
    expect(result.lock.packages).toEqual(lock.packages);
    expect(result.workspace.overrides).toEqual(lock.overrides);
    expect(result.workspace.patchedDependencies).toEqual({
      "other@1.0.0": "patches/other.patch",
    });
    expect(lock).toEqual(before);
  });
  it("rejects an external missing from declared production dependencies", () => {
    const { manifest, lock } = fixture();
    delete manifest.dependencies[runtimeExternalDependencies[0]];
    expect(() => createRuntimePackage(manifest, lock, "pnpm@10.34.5")).toThrow(
      /declared registry dependency/,
    );
  });
  it("rejects an unfrozen or mismatched external dependency", () => {
    const { manifest, lock } = fixture();
    lock.importers["packages/server-node"].dependencies[
      runtimeExternalDependencies[0]
    ].specifier = "^2.0.0";
    expect(() => createRuntimePackage(manifest, lock, "pnpm@10.34.5")).toThrow(
      /frozen resolution/,
    );
  });
  it("rejects workspace resolutions in the deployable artifact", () => {
    const { manifest, lock } = fixture();
    lock.importers["packages/server-node"].dependencies[
      runtimeExternalDependencies[0]
    ].version = "link:../native";
    expect(() => createRuntimePackage(manifest, lock, "pnpm@10.34.5")).toThrow(
      /registry resolution/,
    );
  });
});
