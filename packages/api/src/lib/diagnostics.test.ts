import { describe, expect, it, vi } from "vitest";
import type { App } from "./context.svelte";
import {
  diagnosticResourceForPath,
  pathFromDiagnosticResource,
  type DiagnosticCollection,
} from "./diagnostics";
import { Plugin, type PluginManifest } from "./plugin";

describe("Lapis diagnostics façade", () => {
  it("uses opaque vault resources without changing path identity", () => {
    const resource = diagnosticResourceForPath("Notes/Hello world.md");
    expect(resource.uri).toBe("vault:///Notes/Hello%20world.md");
    expect(resource.label).toBe("Hello world.md");
    expect(pathFromDiagnosticResource(resource)).toBe(
      "Notes/Hello world.md",
    );
  });

  it("scopes plugin collections and disposes them with the plugin", () => {
    const dispose = vi.fn();
    const createCollection = vi.fn(
      (id: string) =>
        ({ id, dispose } as unknown as DiagnosticCollection),
    );
    const app = {
      workspace: { diagnostics: { createCollection } },
    } as unknown as App;
    const manifest: PluginManifest = {
      id: "example",
      name: "Example",
      author: "Lapis",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "Example",
    };
    class DiagnosticPlugin extends Plugin {
      onload() {
        this.createDiagnosticCollection("lint");
      }
    }
    const plugin = new DiagnosticPlugin(app, manifest);

    plugin.load();
    expect(createCollection).toHaveBeenCalledWith(
      "plugin:example:lint",
      {},
    );
    plugin.unload();
    expect(dispose).toHaveBeenCalledOnce();
  });
});
