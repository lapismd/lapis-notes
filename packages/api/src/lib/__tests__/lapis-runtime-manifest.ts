import type { PluginManifest } from "../plugin";

/**
 * Synthetic Lapis ESM workspace runtime manifest for api-local tests.
 * Not tied to any first-party plugin package.
 */
export function createEsmWorkspaceRuntimeManifest(
  overrides: Partial<PluginManifest> = {},
): PluginManifest {
  const id = overrides.id ?? "fixture-esm-workspace";
  const { lapis: lapisOverrides, ...rest } = overrides;

  return {
    id,
    name: rest.name ?? id,
    author: rest.author ?? "test",
    version: rest.version ?? "1.0.0",
    minAppVersion: rest.minAppVersion ?? "0.0.0",
    description: rest.description ?? "",
    ...rest,
    lapis: {
      manifestVersion: 1,
      ...lapisOverrides,
      runtime: {
        entries: {
          workspace: {
            path: "main.mjs",
            format: "esm",
            sharedDependencies: ["@lapis-notes/api", "svelte", "clsx"],
            requiresReloadOnUpdate: false,
          },
        },
        ...lapisOverrides?.runtime,
      },
    },
  };
}
