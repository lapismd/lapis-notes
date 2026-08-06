import { describe, expect, it } from "vitest";
import telemetryManifestSpec from "../../../../plugins/plugin-telemetry/manifest.json";
import type { PluginManifest } from "../plugin";
import { selectPluginRuntimeEntry } from "../plugin-runtime-entry";

function createManifest(
  manifest: Partial<PluginManifest> & Pick<PluginManifest, "id">,
): PluginManifest {
  return {
    name: manifest.id,
    author: "test",
    version: "1.0.0",
    minAppVersion: "0.0.0",
    description: "",
    ...manifest,
  };
}

describe("selectPluginRuntimeEntry", () => {
  it("selects Obsidian main.js for non-Lapis compatibility plugins", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({ id: "obsidian-basic" }),
        requestedHost: "workspace",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: true,
      }),
    ).toMatchObject({
      host: "workspace",
      path: "main.js",
      format: "commonjs",
      source: "obsidian-main",
    });
  });

  it("returns null for non-Lapis compatibility plugins without main.js", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({ id: "missing-main" }),
        requestedHost: "workspace",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: false,
      }),
    ).toBeNull();
  });

  it("prefers legacy Lapis workspace entries over hybrid main.js fallback", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({
          id: "legacy-hybrid",
          lapis: {
            manifestVersion: 1,
            runtime: {
              workspace: "workspace-entry.js",
            },
          },
        }),
        requestedHost: "workspace",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: true,
      }),
    ).toMatchObject({
      path: "workspace-entry.js",
      format: "commonjs",
      source: "lapis-legacy-runtime",
    });
  });

  it("selects legacy Lapis workspace entries when there is no main.js", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({
          id: "legacy-workspace",
          lapis: {
            manifestVersion: 1,
            runtime: {
              workspace: "workspace-entry.js",
            },
          },
        }),
        requestedHost: "workspace",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: false,
      }),
    ).toMatchObject({
      path: "workspace-entry.js",
      format: "commonjs",
      source: "lapis-legacy-runtime",
    });
  });

  it("selects structured ESM fallback when the host has no ESM support yet", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({
          id: "structured-esm",
          lapis: {
            manifestVersion: 1,
            runtime: {
              entries: {
                workspace: {
                  path: "main.mjs",
                  format: "esm",
                  fallbackPath: "main.js",
                  sharedDependencies: ["obsidian"],
                },
              },
            },
          },
        }),
        requestedHost: "workspace",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: true,
      }),
    ).toMatchObject({
      path: "main.js",
      format: "commonjs",
      fallbackPath: "main.js",
      sharedDependencies: ["obsidian"],
      source: "lapis-runtime-entry",
    });
  });

  it("falls back from electron renderer to structured workspace entries", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({
          id: "electron-renderer-workspace",
          lapis: {
            manifestVersion: 1,
            runtime: {
              entries: {
                workspace: {
                  path: "main.mjs",
                  format: "esm",
                  sharedDependencies: ["@lapis-notes/api"],
                },
              },
            },
          },
        }),
        requestedHost: "electron-renderer",
        supportsEsm: true,
        supportsNodeEsm: false,
        hasMainJs: false,
      }),
    ).toMatchObject({
      host: "electron-renderer",
      path: "main.mjs",
      format: "esm",
      sharedDependencies: ["@lapis-notes/api"],
    });
  });

  it("selects the Telemetry ESM entry without a CommonJS fallback", () => {
    const telemetryManifest = telemetryManifestSpec as PluginManifest;

    expect(
      selectPluginRuntimeEntry({
        manifest: telemetryManifest,
        requestedHost: "workspace",
        supportsEsm: true,
        supportsNodeEsm: false,
        hasMainJs: false,
      }),
    ).toMatchObject({
      host: "workspace",
      path: "main.mjs",
      format: "esm",
      sharedDependencies: ["@lapis-notes/api", "svelte", "clsx"],
      source: "lapis-runtime-entry",
    });
    expect(
      selectPluginRuntimeEntry({
        manifest: telemetryManifest,
        requestedHost: "workspace",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: false,
      }),
    ).toBeNull();
  });

  it("prefers trusted desktop before electron sidecar and desktop entries", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({
          id: "sidecar-order",
          lapis: {
            manifestVersion: 1,
            runtime: {
              entries: {
                desktop: {
                  path: "desktop.cjs",
                  format: "commonjs",
                },
                electronSidecar: {
                  path: "electron-sidecar.cjs",
                  format: "commonjs",
                },
                trustedDesktop: {
                  path: "trusted-desktop.cjs",
                  format: "commonjs",
                },
              },
            },
          },
        }),
        requestedHost: "electron-sidecar",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: false,
      }),
    ).toMatchObject({
      host: "electron-sidecar",
      path: "trusted-desktop.cjs",
      format: "commonjs",
    });
  });

  it("returns null for unsupported ESM entries without a fallback", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({
          id: "esm-only",
          lapis: {
            manifestVersion: 1,
            runtime: {
              entries: {
                workspace: {
                  path: "main.mjs",
                  format: "esm",
                },
              },
            },
          },
        }),
        requestedHost: "workspace",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: false,
      }),
    ).toBeNull();
  });
});
