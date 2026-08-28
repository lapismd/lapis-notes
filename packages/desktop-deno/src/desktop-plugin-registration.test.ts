import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Deno desktop plugin registration", () => {
  it("uses the shared Notes profile before configured plugins and layout restoration", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/DesktopWorkspaceSession.svelte"),
      "utf8",
    );
    const registerProfile = source.indexOf(
      "app.plugins.registerStaticPlugins(notesPluginProfile)",
    );

    expect(source).toContain("notesPluginProfile");
    expect(source).toContain("registerNotesPluginSettings(app)");
    expect(source).not.toMatch(
      /@lapis-notes\/(?:ai|bases|bookmarks|graph|history|markdown-lint|spellcheck|wordcount)/u,
    );
    expect(registerProfile).toBeGreaterThan(-1);
    expect(source.indexOf("app.plugins.loadPlugins")).toBeGreaterThan(
      registerProfile,
    );
    expect(source).toContain(
      'communityPlugins: app.safeMode.disableCommunityPlugins\n            ? "disabled"\n            : "configured"',
    );
    expect(source.indexOf("app.workspace.loadLayout")).toBeGreaterThan(
      source.indexOf("app.plugins.loadPlugins"),
    );
  });

  it("does not make Markdown Lint a host-owned default", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/DesktopWorkspaceSession.svelte"),
      "utf8",
    );

    expect(source).not.toContain("MarkdownLintPlugin");
    expect(source).not.toContain("createNativeMarkdownLanguageServiceProvider");
    expect(source).not.toContain("app.languageServices.registerProvider");
  });

  it("installs telemetry before plugins and bounds startup lifecycle signals", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/DesktopWorkspaceSession.svelte"),
      "utf8",
    );

    expect(
      source.indexOf("ownedApp.telemetry = bridge.telemetry"),
    ).toBeLessThan(
      source.indexOf("app.plugins.registerStaticPlugins(notesPluginProfile)"),
    );
    expect(source).toContain('startSpan("desktop.session.startup")');
    expect(source).toContain('measureAsync("desktop.session.phase"');
    expect(source).toContain('recordEvent("desktop.session.ready"');
    expect(source).toContain('recordEvent("desktop.session.failed"');
    expect(source).toContain('"desktop.session.teardown"');
    expect(source).not.toContain('"desktop.vault.path"');
  });
});
