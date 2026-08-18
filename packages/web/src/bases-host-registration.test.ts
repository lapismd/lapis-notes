import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("web Bases host registration", () => {
  it("registers bundled Bases after Search and before restore work", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/WebWorkspaceSession.svelte"),
      "utf8",
    );
    const search = source.indexOf("plugin: SearchPlugin");
    const wordcount = source.indexOf("plugin: WordCountPlugin");
    const bases = source.indexOf("plugin: BasesPlugin");
    const ai = source.indexOf("plugin: AiPlugin");
    const roles = source.indexOf("plugin: RolesPlugin");
    const loadPlugins = source.indexOf("await app.plugins.loadPlugins");
    const metadata = source.lastIndexOf("startMetadataCache()");
    const layout = source.indexOf("await app.workspace.loadLayout");

    expect(source).toContain('import "@lapis-notes/bases/styles.css"');
    expect(source).toContain('import "@lapis-notes/ai/styles.css"');
    expect(source.slice(bases, roles)).toContain('distribution: "bundled"');
    expect(source).toContain('communityPlugins: "disabled"');
    expect(search).toBeGreaterThan(-1);
    expect(wordcount).toBeGreaterThan(search);
    expect(bases).toBeGreaterThan(wordcount);
    expect(ai).toBeGreaterThan(bases);
    expect(roles).toBeGreaterThan(ai);
    expect(loadPlugins).toBeGreaterThan(roles);
    expect(layout).toBeGreaterThan(loadPlugins);
    expect(metadata).toBeGreaterThan(layout);
    expect(source).toContain("WorkspaceStartup");
    expect(source).toContain('id: "vault"');
    expect(source).toContain('id: "configuration"');
    expect(source).toContain('id: "plugins"');
    expect(source).toContain('id: "layout"');
    expect(source).toContain("onProgress");
    expect(source).toContain("startMetadataCache");
    expect(source).toContain("registerWebAgentRuntimeSettings");
    expect(source).toContain("syncWebAgentRuntime");
    expect(source).not.toMatch(/await app\.metadataCache\.load/u);
    expect(source).not.toContain("Opening vault…");
  });

  it("does not re-declare Electron app-region CSS", () => {
    const css = readFileSync(
      path.resolve(process.cwd(), "src/web-host.css"),
      "utf8",
    );
    expect(css).not.toMatch(/(?:-webkit-)?app-region/u);
  });
});
