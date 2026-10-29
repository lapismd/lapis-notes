import { describe, expect, it } from "vitest";
import type { PluginManifest } from "../plugin";
import { selectPluginRuntimeEntry } from "../plugin-runtime-entry";
import { createEsmWorkspaceRuntimeManifest } from "./lapis-runtime-manifest";

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
  it.each(["commonjs", "node-esm"] as const)(
    "rejects %s on Tauri before any fallback",
    (format) => {
      expect(
        selectPluginRuntimeEntry({
          manifest: createManifest({
            id: "unsupported-tauri",
            lapis: {
              manifestVersion: 1,
              runtime: {
                entries: {
                  workspace: {
                    path: "main.js",
                    format,
                    fallbackPath: "fallback.js",
                  },
                },
              },
            },
          }),
          requestedHost: "tauri-desktop",
          supportsEsm: true,
          supportsNodeEsm: false,
          hasMainJs: true,
        }),
      ).toBeNull();
    },
  );

  it("rejects legacy CommonJS main on Tauri", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({ id: "legacy-tauri" }),
        requestedHost: "tauri-desktop",
        supportsEsm: true,
        supportsNodeEsm: false,
        hasMainJs: true,
      }),
    ).toBeNull();
  });

  it("does not fall back from missing Tauri ESM support to CommonJS", () => {
    expect(
      selectPluginRuntimeEntry({
        manifest: createManifest({
          id: "fallback-tauri",
          lapis: {
            manifestVersion: 1,
            runtime: {
              entries: {
                workspace: {
                  path: "main.mjs",
                  format: "esm",
                  fallbackPath: "main.js",
                },
              },
            },
          },
        }),
        requestedHost: "tauri-desktop",
        supportsEsm: false,
        supportsNodeEsm: false,
        hasMainJs: true,
      }),
    ).toBeNull();
  });

  it("selects portable ESM on Tauri without inheriting a CommonJS fallback", () => {
    const manifest = createEsmWorkspaceRuntimeManifest();
    manifest.lapis!.runtime!.entries!.workspace!.fallbackPath = "main.js";
    const result = selectPluginRuntimeEntry({
      manifest,
      requestedHost: "tauri-desktop",
      supportsEsm: true,
      supportsNodeEsm: false,
      hasMainJs: true,
    });
    expect(result).toMatchObject({
      host: "tauri-desktop",
      path: "main.mjs",
      format: "esm",
    });
    expect(result?.fallbackPath).toBeUndefined();
  });

  it("rejects Electron-only and native service entries on Tauri", () => {
    const manifest = createManifest({
      id: "native-only",
      lapis: {
        manifestVersion: 1,
        runtime: {
          entries: {
            electronRenderer: { path: "electron.mjs", format: "esm" },
            trustedDesktop: { path: "service.mjs", format: "node-esm" },
          },
        },
      },
    });
    expect(
      selectPluginRuntimeEntry({
        manifest,
        requestedHost: "tauri-desktop",
        supportsEsm: true,
        supportsNodeEsm: true,
        hasMainJs: true,
      }),
    ).toBeNull();
  });

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

  it("selects a structured ESM workspace entry without a CommonJS fallback", () => {
    const manifest = createEsmWorkspaceRuntimeManifest();

    expect(
      selectPluginRuntimeEntry({
        manifest,
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
        manifest,
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
