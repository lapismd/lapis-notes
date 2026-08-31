import { describe, expect, it } from "vitest";
import {
  LegacyObjectDependencyResolver,
  RendererImportMapPluginDependencyResolver,
} from "../plugin-dependency-resolver";
import type { PluginDependencyContext } from "../plugin-dependency-resolver";

const context: PluginDependencyContext = {
  pluginId: "example",
  pluginPath: "/.obsidian/plugins/example",
  manifest: {
    id: "example",
    name: "Example",
    author: "test",
    version: "1.0.0",
    minAppVersion: "0.0.0",
    description: "",
  },
  host: "workspace",
  format: "commonjs",
};

describe("LegacyObjectDependencyResolver", () => {
  it("resolves exact dependency keys from the legacy object", () => {
    const api = { Plugin: class Plugin {} };
    const resolver = new LegacyObjectDependencyResolver({
      "@lapis-notes/api": api,
    });

    expect(resolver.canResolve("@lapis-notes/api", context)).toBe(true);
    expect(resolver.require("@lapis-notes/api", context)).toBe(api);
  });

  it("preserves scoped suffix normalization for compatibility", () => {
    const api = { Plugin: class Plugin {} };
    const resolver = new LegacyObjectDependencyResolver({
      "@lapis-notes/api": api,
    });

    expect(resolver.canResolve("@lapis-notes/api/index.js", context)).toBe(
      true,
    );
    expect(resolver.require("@lapis-notes/api/index.js", context)).toBe(api);
  });

  it("rejects unknown bare dependencies with the plugin id", () => {
    const resolver = new LegacyObjectDependencyResolver({});

    expect(() => resolver.require("@codemirror/rangeset", context)).toThrow(
      "Cannot require @codemirror/rangeset in plugin example",
    );
  });

  it("lists registered legacy dependencies as public compatibility entries", () => {
    const resolver = new LegacyObjectDependencyResolver({
      obsidian: {},
      "@lapis-notes/api": {},
    });

    expect(resolver.list()).toEqual([
      {
        specifier: "@lapis-notes/api",
        platforms: ["web", "electron-renderer"],
        public: true,
      },
      {
        specifier: "obsidian",
        platforms: ["web", "electron-renderer"],
        public: true,
      },
    ]);
  });
});

describe("RendererImportMapPluginDependencyResolver", () => {
  it("installs one renderer import map backed by host namespace facades", async () => {
    const api = {
      Notice: class Notice {},
      Plugin: class Plugin {},
      if: () => undefined,
      window: {},
    };
    const rendererDocument = document.implementation.createHTMLDocument();
    const globalObject = {};
    const sources: string[] = [];
    const resolver = new RendererImportMapPluginDependencyResolver(
      { "@lapis-notes/api": api },
      {
        document: rendererDocument,
        globalObject,
        createModuleUrl(source) {
          sources.push(source);
          return "blob:lapis-host-module-api";
        },
      },
    );
    const esmContext = { ...context, format: "esm" as const };

    await resolver.prepare(["@lapis-notes/api"], esmContext);
    await resolver.prepare(["@lapis-notes/api"], esmContext);

    const importMaps = rendererDocument.head.querySelectorAll(
      'script[type="importmap"][data-lapis-plugin-host-modules="true"]',
    );
    expect(importMaps).toHaveLength(1);
    expect(JSON.parse(importMaps[0]?.textContent ?? "{}")).toEqual({
      imports: {
        "@lapis-notes/api": "blob:lapis-host-module-api",
      },
    });
    expect(sources).toHaveLength(1);
    expect(sources[0]).toContain(
      'globalThis[Symbol.for("lapis.plugin.renderer-host-modules")]',
    );
    expect(sources[0]).toContain('moduleNamespace["Plugin"]');
    expect(sources[0]).toContain('as "Plugin"');
    expect(sources[0]).toContain('moduleNamespace["if"]');
    expect(sources[0]).toContain('as "if"');
    expect(sources[0]).toContain('moduleNamespace["window"]');
    expect(sources[0]).toContain('as "window"');
  });

  it("rejects unknown ESM host modules before evaluation", async () => {
    const resolver = new RendererImportMapPluginDependencyResolver(
      {},
      {
        document: document.implementation.createHTMLDocument(),
        globalObject: {},
        createModuleUrl: () => "blob:unused",
      },
    );

    await expect(
      resolver.prepare(["@lapis-notes/missing"], {
        ...context,
        format: "esm",
      }),
    ).rejects.toThrow("Cannot resolve @lapis-notes/missing in plugin example");
  });
});
