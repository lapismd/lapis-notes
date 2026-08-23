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
    const bookmarks = source.indexOf("plugin: BookmarksPlugin");
    const markdownLint = source.indexOf("plugin: MarkdownLintPlugin");
    const spellcheck = source.indexOf("plugin: SpellcheckPlugin");
    const wordcount = source.indexOf("plugin: WordCountPlugin");
    const bases = source.indexOf("plugin: BasesPlugin");
    const ai = source.indexOf("plugin: AiPlugin");
    const terminal = source.indexOf("plugin: TerminalPlugin");
    const roles = source.indexOf("plugin: RolesPlugin");
    const tasks = source.indexOf("plugin: TasksPlugin");
    const docs = source.indexOf("plugin: DocsPlugin");
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
    expect(bookmarks).toBeGreaterThan(search);
    expect(wordcount).toBeGreaterThan(bookmarks);
    expect(bases).toBeGreaterThan(wordcount);
    expect(ai).toBeGreaterThan(bases);
    expect(terminal).toBeGreaterThan(ai);
    expect(roles).toBeGreaterThan(terminal);
    expect(tasks).toBeGreaterThan(roles);
    expect(docs).toBeGreaterThan(tasks);
    expect(loadPlugins).toBeGreaterThan(docs);
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
    expect(source).toContain("registerWebVaultTransferSettings");
    expect(source).toContain("syncWebAgentRuntime");
    expect(source.indexOf("registerWebVaultTransferSettings(app)")).toBeGreaterThan(
      source.indexOf("await app.configuration.load()"),
    );
    expect(source).not.toMatch(/await app\.metadataCache\.load/u);
    expect(source).not.toContain("Opening vault…");
  });

  it("keeps the branded launcher off the restore path", () => {
    const host = readFileSync(
      path.resolve(process.cwd(), "src/WebVaultHost.svelte"),
      "utf8",
    );
    expect(host).toContain("launcherOpen");
    expect(host).toContain("bootGate");
    expect(host).toContain("Opening Lapis Notes");
    expect(host).toContain("showChooser");
    expect(host).not.toMatch(
      /\{#if prepared\}[\s\S]*WebWorkspaceSession[\s\S]*\{:else\}[\s\S]*WebVaultLauncher/u,
    );
    expect(host).toContain("persistLayout()");
    expect(host).toContain("onImport={importVault}");
    expect(host).toContain("importDirectoryHandleToNewOpfsVault");
    expect(host).toContain('id: "import"');
    expect(host).toContain("formatVaultCopyProgressMessage");
    expect(host).toContain("onProgress");
    expect(host).toContain("detail:");
  });

  it("offers Import Vault beside Open Folder", () => {
    const launcher = readFileSync(
      path.resolve(process.cwd(), "src/WebVaultLauncher.svelte"),
      "utf8",
    );
    expect(launcher).toContain("Import Vault");
    expect(launcher).toContain("Import Browser Vault");
    expect(launcher).toContain("onImport");
    expect(launcher.indexOf("Import Vault")).toBeGreaterThan(
      launcher.indexOf("Open Folder"),
    );
    expect(launcher).toContain("pickFileSystemAccessDirectoryHandle");
  });

  it("does not re-declare native app-region CSS", () => {
    const css = readFileSync(
      path.resolve(process.cwd(), "src/web-host.css"),
      "utf8",
    );
    expect(css).not.toMatch(/(?:-webkit-)?app-region/u);
  });
});
