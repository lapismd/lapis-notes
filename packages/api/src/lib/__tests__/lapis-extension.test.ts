import { describe, expect, it } from "vitest";
import {
  activationEventForContribution,
  buildLapisContributionIndex,
  getLapisContributionPointDescriptors,
  validateLapisManifest,
} from "../lapis-extension";

describe("lapis contribution registry", () => {
  it("exposes built-in contribution point descriptors", () => {
    expect(getLapisContributionPointDescriptors().map((it) => it.kind)).toEqual(
      [
        "commands",
        "configuration",
        "languages",
        "views",
        "editorViews",
        "services",
        "notebookRenderers",
        "markdownPostProcessors",
        "statusBarItems",
      ],
    );
  });

  it("indexes valid contributions and emits invalid diagnostics for malformed or unknown kinds", () => {
    const indexed = buildLapisContributionIndex({
      pluginId: "example",
      name: "Example",
      manifestPath: "/.obsidian/plugins/example/manifest.json",
      classification: "lapis-extension",
      source: "community",
      lapis: {
        manifestVersion: 1,
        contributes: {
          commands: [
            {
              command: "hello",
              title: "Hello",
            },
            { title: "Broken" } as never,
            {
              command: "hello",
              title: "Duplicate Hello",
            },
          ],
          views: [
            {
              id: "outline",
              name: "Outline",
            },
          ],
          menus: [{ command: "hello" }],
        } as never,
      },
      grantedCapabilities: [],
    });

    expect(
      indexed.contributions.filter((entry) => entry.state === "valid"),
    ).toMatchObject([
      {
        kind: "views",
        id: "outline",
      },
    ]);
    expect(indexed.contributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "commands",
          id: "commands[1]",
          state: "invalid",
          diagnostics: expect.arrayContaining([
            expect.stringContaining(
              "expected an object with string `command` and `title` fields",
            ),
          ]),
        }),
        expect.objectContaining({
          kind: "menus",
          id: "menus",
          state: "invalid",
          diagnostics: expect.arrayContaining([
            expect.stringContaining("unsupported lapis.contributes.menus"),
          ]),
        }),
        expect.objectContaining({
          kind: "commands",
          id: "hello",
          state: "invalid",
          diagnostics: expect.arrayContaining([
            expect.stringContaining(
              "duplicate lapis contribution commands:hello",
            ),
          ]),
        }),
      ]),
    );
  });

  it("derives activation events from the contribution descriptor registry", () => {
    const indexed = buildLapisContributionIndex({
      pluginId: "example",
      manifestPath: "/.obsidian/plugins/example/manifest.json",
      classification: "lapis-extension",
      source: "community",
      lapis: {
        manifestVersion: 1,
        contributes: {
          commands: [
            {
              command: "hello",
              title: "Hello",
            },
          ],
          views: [
            {
              id: "outline",
              name: "Outline",
            },
          ],
        },
      },
      grantedCapabilities: [],
    });

    expect(
      activationEventForContribution("example", indexed.contributions[0]),
    ).toBe("onCommand:hello");
    expect(
      activationEventForContribution("example", indexed.contributions[1]),
    ).toBe("onView:outline");
  });

  it("validates structured runtime entry metadata", () => {
    expect(
      validateLapisManifest("valid-runtime", {
        manifestVersion: 1,
        runtime: {
          workspace: "main.js",
          entries: {
            workspace: {
              path: "main.mjs",
              format: "esm",
              fallbackPath: "main.js",
              sharedDependencies: ["obsidian"],
              requiresReloadOnUpdate: true,
            },
          },
          sharedDependencies: {
            workspace: ["obsidian"],
          },
          compatibilityOverrides: {
            deprecatedHostModules: {
              workspace: ["svelte/internal/client"],
            },
          },
        },
      }),
    ).toEqual([]);

    expect(
      validateLapisManifest("invalid-runtime", {
        manifestVersion: 1,
        runtime: {
          workspace: 123,
          entries: {
            workspace: {
              path: "../escape.mjs",
              format: "amd",
              fallbackPath: "/absolute.js",
              sharedDependencies: ["obsidian", 123],
              requiresReloadOnUpdate: "yes",
            },
          },
          sharedDependencies: {
            workspace: ["obsidian", 123],
          },
          compatibilityOverrides: {
            deprecatedHostModules: {
              workspace: ["svelte/internal/client", 123],
            },
          },
        },
      }),
    ).toEqual([
      "Plugin invalid-runtime has invalid lapis.runtime.workspace",
      "Plugin invalid-runtime has invalid lapis.runtime.entries.workspace.path",
      "Plugin invalid-runtime has invalid lapis.runtime.entries.workspace.format",
      "Plugin invalid-runtime has invalid lapis.runtime.entries.workspace.fallbackPath",
      "Plugin invalid-runtime has invalid lapis.runtime.entries.workspace.sharedDependencies",
      "Plugin invalid-runtime has invalid lapis.runtime.entries.workspace.requiresReloadOnUpdate",
      "Plugin invalid-runtime has invalid lapis.runtime.sharedDependencies.workspace",
      "Plugin invalid-runtime has invalid lapis.runtime.compatibilityOverrides.deprecatedHostModules.workspace",
    ]);
  });
});
