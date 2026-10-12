import { describe, expect, it } from "vitest";
import { LegacyObjectDependencyResolver } from "../plugin-dependency-resolver";
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
