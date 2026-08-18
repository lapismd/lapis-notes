import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop Bases host registration", () => {
  it("registers bundled Bases after Search and before restore work", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/DesktopWorkspaceSession.svelte"),
      "utf8",
    );
    const search = source.indexOf("plugin: SearchPlugin");
    const markdownLint = source.indexOf("plugin: MarkdownLintPlugin");
    const spellcheck = source.indexOf("plugin: SpellcheckPlugin");
    const wordcount = source.indexOf("plugin: WordCountPlugin");
    const bases = source.indexOf("plugin: BasesPlugin");
    const ai = source.indexOf("plugin: AiPlugin");
    const terminal = source.indexOf("plugin: TerminalPlugin");
    const roles = source.indexOf("plugin: RolesPlugin");
    const loadPlugins = source.indexOf("await app.plugins.loadPlugins");
    const metadata = source.lastIndexOf("startMetadataCache()");
    const layout = source.indexOf("await app.workspace.loadLayout");

    expect(source).toContain('import "@lapis-notes/bases/styles.css"');
    expect(source).toContain('import "@lapis-notes/ai/styles.css"');
    expect(source.slice(bases, roles)).toContain('distribution: "bundled"');
    expect(source).toContain('communityPlugins: "disabled"');
    expect(search).toBeGreaterThan(-1);
    expect(markdownLint).toBeGreaterThan(-1);
    expect(spellcheck).toBeGreaterThan(markdownLint);
    expect(search).toBeGreaterThan(spellcheck);
    expect(wordcount).toBeGreaterThan(search);
    expect(bases).toBeGreaterThan(wordcount);
    expect(ai).toBeGreaterThan(bases);
    expect(terminal).toBeGreaterThan(ai);
    expect(roles).toBeGreaterThan(terminal);
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
    expect(source).not.toMatch(/await app\.metadataCache\.load/u);
    expect(source).not.toContain("Opening vault…");
  });

  it("keeps the branded launcher off the restore path", () => {
    const host = readFileSync(
      path.resolve(process.cwd(), "src/DesktopVaultHost.svelte"),
      "utf8",
    );
    expect(host).toContain("launcherOpen");
    expect(host).toContain("bootGate");
    expect(host).toContain("Opening Lapis Notes");
    expect(host).toContain("showChooser");
    expect(host).not.toMatch(
      /\{#if prepared\}[\s\S]*DesktopWorkspaceSession[\s\S]*\{:else\}[\s\S]*DesktopVaultLauncher/u,
    );
    expect(host).toContain("persistLayout()");
  });

  it("does not re-declare Electron app-region CSS", () => {
    const css = readFileSync(
      path.resolve(process.cwd(), "src/desktop-host.css"),
      "utf8",
    );
    expect(css).not.toMatch(/(?:-webkit-)?app-region/u);
  });
});
