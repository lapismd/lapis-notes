import telemetryManifestSpec from "../../../../plugins/plugin-telemetry/manifest.json";
import { describe, expect, it } from "vitest";
import {
  validatePluginReleaseRuntime,
  type PluginReleaseManifest,
} from "../plugin-distribution";
import type { PluginManifest } from "../plugin";

const telemetryManifest = telemetryManifestSpec as PluginManifest;

describe("plugin release runtime validation", () => {
  it("accepts the Telemetry ESM-only runtime metadata", () => {
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(telemetryManifest),
      pluginManifest: telemetryManifest,
      files: filesFor(telemetryManifest),
      provenance: "official",
    });

    expect(result.errors).toEqual([]);
  });

  it("rejects official structured runtime entries whose files are missing", () => {
    const files = filesFor(telemetryManifest);
    files.delete("main.mjs");
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(telemetryManifest),
      pluginManifest: telemetryManifest,
      files,
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-entry-file-missing" }),
    );
  });

  it("rejects official ESM externals that are not declared as shared dependencies", () => {
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(telemetryManifest),
      pluginManifest: telemetryManifest,
      files: filesFor(telemetryManifest, {
        "main.mjs": `import { z } from "zod"; export default class TelemetryPlugin {}`,
      }),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-dependency-undeclared" }),
    );
  });

  it("rejects renderer entries that declare sidecar-only dependencies", () => {
    const manifest = manifestWithRuntime({
      entries: {
        workspace: {
          path: "main.mjs",
          format: "esm",
          sharedDependencies: ["lapis"],
        },
      },
    });
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(manifest),
      pluginManifest: manifest,
      files: filesFor(manifest, {
        "main.mjs": `import { Plugin } from "lapis"; export default class TelemetryPlugin extends Plugin {}`,
      }),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "runtime-dependency-platform-unsupported",
      }),
    );
  });

  it("rejects sidecar entries that import renderer-only dependencies", () => {
    const manifest = manifestWithRuntime({
      entries: {
        trustedDesktop: {
          path: "sidecar.mjs",
          format: "node-esm",
          sharedDependencies: ["svelte"],
        },
      },
    });
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(manifest),
      pluginManifest: manifest,
      files: filesFor(manifest, {
        "sidecar.mjs": `import { mount } from "svelte"; export default class SidecarPlugin {}`,
      }),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "runtime-dependency-platform-unsupported",
      }),
    );
  });

  it("rejects sidecar entries that declare the renderer Obsidian compatibility facade", () => {
    const manifest = manifestWithRuntime({
      entries: {
        trustedDesktop: {
          path: "sidecar.cjs",
          format: "commonjs",
          sharedDependencies: ["obsidian"],
        },
      },
    });
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(manifest),
      pluginManifest: manifest,
      files: filesFor(manifest, {
        "sidecar.cjs": `const { Plugin } = require("obsidian"); module.exports = class SidecarPlugin extends Plugin {};`,
      }),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "runtime-dependency-platform-unsupported",
      }),
    );
  });

  it("rejects official manifests whose structured runtime metadata is not signed", () => {
    const releaseManifest = releaseManifestFor(telemetryManifest);
    delete releaseManifest.runtime;

    const result = validatePluginReleaseRuntime({
      releaseManifest,
      pluginManifest: telemetryManifest,
      files: filesFor(telemetryManifest),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-metadata-missing" }),
    );
  });

  it("rejects official legacy CommonJS releases without structured runtime entries", () => {
    const releaseManifest = releaseManifestFor(telemetryManifest);
    delete releaseManifest.runtime;

    const result = validatePluginReleaseRuntime({
      releaseManifest,
      pluginManifest: {
        ...telemetryManifest,
        lapis: undefined,
      },
      files: filesFor(telemetryManifest),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-legacy-commonjs" }),
    );
  });

  it("rejects official runtime metadata when workspace entry is not ESM", () => {
    const manifest = manifestWithRuntime({
      entries: {
        workspace: {
          path: "main.js",
          format: "commonjs",
          sharedDependencies: ["@lapis-notes/api"],
        },
      },
    });

    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(manifest),
      pluginManifest: manifest,
      files: filesFor(manifest),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-entry-format-mismatch" }),
    );
  });

  it("rejects official runtime metadata when workspace fallback is present", () => {
    const manifest = manifestWithRuntime({
      entries: {
        workspace: {
          path: "main.mjs",
          format: "esm",
          fallbackPath: "main.js",
          sharedDependencies: ["@lapis-notes/api", "svelte", "clsx"],
        },
      },
    });

    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(manifest),
      pluginManifest: manifest,
      files: filesFor(manifest),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-commonjs-not-allowed" }),
    );
  });

  it("rejects official deprecated host modules without an override", () => {
    const manifest = manifestWithRuntime({
      entries: {
        workspace: {
          path: "main.mjs",
          format: "esm",
          sharedDependencies: ["svelte/internal/client"],
        },
      },
    });
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(manifest),
      pluginManifest: manifest,
      files: filesFor(manifest, {
        "main.mjs": `import { component } from "svelte/internal/client"; export default class DeprecatedPlugin {}`,
      }),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-dependency-deprecated" }),
    );
  });

  it("honors official deprecated host-module overrides without relaxing private policy", () => {
    const manifest = manifestWithRuntime({
      entries: {
        workspace: {
          path: "main.mjs",
          format: "esm",
          sharedDependencies: ["svelte/internal/client"],
        },
      },
      compatibilityOverrides: {
        deprecatedHostModules: {
          workspace: ["svelte/internal/client"],
        },
      },
    });
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(manifest),
      pluginManifest: manifest,
      files: filesFor(manifest, {
        "main.mjs": `import { component } from "svelte/internal/client"; export default class DeprecatedPlugin {}`,
      }),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-dependency-private" }),
    );
    expect(result.errors).not.toContainEqual(
      expect.objectContaining({ code: "runtime-dependency-deprecated" }),
    );
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: "runtime-dependency-deprecated",
        details: expect.objectContaining({ compatibilityOverride: true }),
      }),
    );
  });

  it("rejects official manifests that declare private host modules", () => {
    const manifest = manifestWithRuntime({
      entries: {
        workspace: {
          path: "main.mjs",
          format: "esm",
          sharedDependencies: ["svelte/internal/client"],
        },
      },
      compatibilityOverrides: {
        deprecatedHostModules: {
          workspace: ["svelte/internal/client"],
        },
      },
    });
    const result = validatePluginReleaseRuntime({
      releaseManifest: releaseManifestFor(manifest),
      pluginManifest: manifest,
      files: filesFor(manifest, {
        "main.mjs": `import { component } from "svelte/internal/client"; export default class PrivatePlugin {}`,
      }),
      provenance: "official",
    });

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "runtime-dependency-private" }),
    );
  });

  it("keeps manual compatibility diagnostics as warnings", () => {
    const manifest = manifestWithRuntime({
      entries: {
        workspace: {
          path: "main.mjs",
          format: "esm",
          sharedDependencies: ["svelte/internal/client"],
        },
      },
    });
    const result = validatePluginReleaseRuntime({
      releaseManifest: {
        ...releaseManifestFor(manifest),
        channel: "community",
      },
      pluginManifest: manifest,
      files: filesFor(manifest, {
        "main.mjs": `import { component } from "svelte/internal/client"; export default class ManualPlugin {}`,
      }),
      provenance: "manual",
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: "runtime-dependency-private" }),
    );
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: "runtime-dependency-deprecated" }),
    );
  });
});

function manifestWithRuntime(
  runtime: NonNullable<NonNullable<PluginManifest["lapis"]>["runtime"]>,
): PluginManifest {
  return {
    ...telemetryManifest,
    lapis: {
      manifestVersion: 1,
      runtime,
    },
  };
}

function releaseManifestFor(manifest: PluginManifest): PluginReleaseManifest {
  return {
    schemaVersion: 1,
    type: "lapis.plugin.release",
    pluginId: manifest.id,
    version: manifest.version,
    channel: "official",
    compatibility: {
      minAppVersion: manifest.minAppVersion,
      platforms: ["web", "electron"],
    },
    runtime: manifest.lapis?.runtime,
    files: [
      {
        path: "manifest.json",
        url: "files/manifest.json",
        sha256: "0".repeat(64),
        size: 1,
      },
      ...(manifest.lapis?.runtime?.entries?.workspace
        ? [
            {
              path: manifest.lapis.runtime.entries.workspace.path,
              url: `files/${manifest.lapis.runtime.entries.workspace.path}`,
              sha256: "0".repeat(64),
              size: 1,
            },
          ]
        : []),
      ...(manifest.lapis?.runtime?.entries?.trustedDesktop
        ? [
            {
              path: manifest.lapis.runtime.entries.trustedDesktop.path,
              url: `files/${manifest.lapis.runtime.entries.trustedDesktop.path}`,
              sha256: "0".repeat(64),
              size: 1,
            },
          ]
        : []),
    ],
  };
}

function filesFor(
  manifest: PluginManifest,
  overrides: Record<string, string> = {},
): Map<string, Uint8Array> {
  const files: Record<string, string> = {
    "manifest.json": JSON.stringify(manifest),
    "main.mjs": `import { Plugin } from "@lapis-notes/api"; import { mount } from "svelte"; import { clsx } from "clsx"; export default class TelemetryPlugin extends Plugin {}`,
    ...overrides,
  };
  return new Map(
    Object.entries(files).map(([path, source]) => [
      path,
      new TextEncoder().encode(source),
    ]),
  );
}
