import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Deno desktop plugin registration", () => {
  it("matches canonical first-party ordering before layout restoration", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/DesktopWorkspaceSession.svelte"),
      "utf8",
    );
    const orderedPlugins = [
      "MarkdownPlugin",
      "MarkdownLintPlugin",
      "SpellcheckPlugin",
      "FileExplorerPlugin",
      "SearchPlugin",
      "BookmarksPlugin",
      "HistoryPlugin",
      "WordCountPlugin",
      "BasesPlugin",
      "AiPlugin",
      "TerminalPlugin",
      "RolesPlugin",
    ];

    let previous = -1;
    for (const plugin of orderedPlugins) {
      const current = source.indexOf(`plugin: ${plugin}`);
      expect(current, plugin).toBeGreaterThan(previous);
      previous = current;
    }

    expect(source).toContain('import "@lapis-notes/bases/styles.css"');
    expect(source).toContain('import "@lapis-notes/ai/styles.css"');
    expect(source).toContain('communityPlugins: "disabled"');
    expect(source.indexOf("await app.plugins.loadPlugins")).toBeGreaterThan(
      previous,
    );
    expect(source.indexOf("await app.workspace.loadLayout")).toBeGreaterThan(
      source.indexOf("await app.plugins.loadPlugins"),
    );
  });

  it("leaves native Markdownlint provider ownership with the plugin", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/DesktopWorkspaceSession.svelte"),
      "utf8",
    );

    expect(source).toContain("plugin: MarkdownLintPlugin");
    expect(source).not.toContain("createNativeMarkdownLanguageServiceProvider");
    expect(source).not.toContain("app.languageServices.registerProvider");
  });
});
