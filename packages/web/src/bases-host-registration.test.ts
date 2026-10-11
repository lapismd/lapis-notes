import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("web plugin profile registration", () => {
  it("registers the shared Notes profile before configured plugins and restore work", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/WebWorkspaceSession.svelte"),
      "utf8",
    );
    const registerProfile = source.indexOf(
      "app.plugins.registerStaticPlugins(notesPluginProfile)",
    );
    const loadPlugins = source.indexOf("await app.plugins.loadPlugins");
    const metadata = source.lastIndexOf("startMetadataCache()");
    const layout = source.indexOf("await app.workspace.loadLayout");

    expect(source).toContain("notesPluginProfile");
    expect(source).toContain("registerNotesPluginSettings(app)");
    expect(source).toContain('communityPlugins: "configured"');
    expect(source).not.toMatch(
      /@lapis-notes\/(?:ai|bases|bookmarks|graph|history|markdown-lint|spellcheck|wordcount)/u,
    );
    expect(registerProfile).toBeGreaterThan(-1);
    expect(loadPlugins).toBeGreaterThan(registerProfile);
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
    expect(
      source.indexOf("registerWebVaultTransferSettings(app)"),
    ).toBeGreaterThan(source.indexOf("await app.configuration.load()"));
    expect(source).not.toMatch(/await app\.metadataCache\.load/u);
    expect(source).not.toContain("Opening vault…");
  });

  it("keeps exactly the four app-owned default plugins in stable order", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "../app-profile/src/index.ts"),
      "utf8",
    );
    const orderedPlugins = [
      "SourceEditorPlugin",
      "MarkdownPlugin",
      "FileExplorerPlugin",
      "SearchPlugin",
    ];

    let previous = source.indexOf("notesPluginProfile = [");
    for (const plugin of orderedPlugins) {
      const current = source.indexOf(`plugin: ${plugin}`, previous);
      expect(current, plugin).toBeGreaterThan(previous);
      previous = current;
    }

    expect(source.match(/plugin: \w+Plugin/g)).toHaveLength(4);
    expect(source.match(/enabledByDefault: true/g)).toHaveLength(4);
    expect(source.match(/required: false/g)).toHaveLength(4);
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
