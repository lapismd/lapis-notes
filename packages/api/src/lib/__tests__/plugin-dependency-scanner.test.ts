import { describe, expect, it } from "vitest";
import {
  isBarePluginDependencySpecifier,
  scanBarePluginDependencySpecifiers,
  scanPluginDependencySpecifiers,
} from "../plugin-dependency-scanner";

describe("plugin dependency scanner", () => {
  it("detects static CommonJS, ESM, re-export, and literal dynamic imports", () => {
    const source = `
      const api = require("@lapis-notes/api");
      const local = require("./local");
      import { EditorView } from "@codemirror/view";
      import type { Plugin } from "obsidian";
      import "svelte/store";
      export { DateTime } from "luxon";
      const zod = await import("zod");
      const ignored = await import(packageName);
    `;

    expect(scanPluginDependencySpecifiers(source)).toMatchObject([
      { specifier: "@lapis-notes/api", kind: "require" },
      { specifier: "./local", kind: "require" },
      { specifier: "@codemirror/view", kind: "static-import" },
      { specifier: "obsidian", kind: "static-import" },
      { specifier: "svelte/store", kind: "static-import" },
      { specifier: "luxon", kind: "export" },
      { specifier: "zod", kind: "dynamic-import" },
    ]);
    expect(scanBarePluginDependencySpecifiers(source)).toEqual([
      "@codemirror/view",
      "@lapis-notes/api",
      "luxon",
      "obsidian",
      "svelte/store",
      "zod",
    ]);
  });

  it("ignores import-like text inside strings, template literals, and comments", () => {
    const source = `
      const example = "import('not-a-real-import')";
      const markdown = \`const fake = require("fake-package")\`;
      // export { x } from "commented-export";
      /* import value from "commented-import"; */
      const api = await import("@lapis-notes/api");
    `;

    expect(scanBarePluginDependencySpecifiers(source)).toEqual([
      "@lapis-notes/api",
    ]);
  });

  it("ignores member require calls and guarded optional Node fallbacks", () => {
    const source = `
      const maybeUtil = moduleRef.require("util");
      if (typeof require == "function") try {
        const { randomBytes } = require("crypto");
      }
      const api = require("@lapis-notes/api");
    `;

    expect(scanBarePluginDependencySpecifiers(source)).toEqual([
      "@lapis-notes/api",
    ]);
  });

  it("distinguishes bare specifiers from relative, absolute, and URL imports", () => {
    expect(isBarePluginDependencySpecifier("@lapis-notes/api")).toBe(true);
    expect(isBarePluginDependencySpecifier("svelte/store")).toBe(true);
    expect(isBarePluginDependencySpecifier("./local")).toBe(false);
    expect(isBarePluginDependencySpecifier("../local")).toBe(false);
    expect(isBarePluginDependencySpecifier("/absolute")).toBe(false);
    expect(isBarePluginDependencySpecifier("https://example.com/mod.js")).toBe(
      false,
    );
  });
});
