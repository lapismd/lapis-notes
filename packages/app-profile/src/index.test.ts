import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

describe("notesPluginProfile", () => {
  it("contains exactly the four user-disableable Lapis Notes defaults", () => {
    const profile = source.slice(
      source.indexOf("export const notesPluginProfile"),
    );
    const ordered = [
      "plugin: SourceEditorPlugin",
      "plugin: MarkdownPlugin",
      "plugin: FileExplorerPlugin",
      "plugin: SearchPlugin",
    ];
    expect(ordered.map((entry) => profile.indexOf(entry))).toEqual(
      [...ordered]
        .map((entry) => profile.indexOf(entry))
        .sort((left, right) => left - right),
    );
    expect(profile.match(/plugin: /g)).toHaveLength(4);
    expect(profile.match(/required: false/g)).toHaveLength(4);
    expect(profile.match(/enabledByDefault: true/g)).toHaveLength(4);
    expect(profile).toContain("styles: sourceEditorStyles");
    expect(profile).toContain("styles: markdownStyles");
    expect(profile).toContain("styles: searchStyles");
  });
});

describe("notesPluginHostModules", () => {
  it("provides declared plugin modules and the implicit Svelte renderer ABI", () => {
    const hostModules = source.slice(
      source.indexOf("export const notesPluginHostModules"),
      source.indexOf("export const createNotesPluginDependencyResolver"),
    );

    expect(hostModules).toContain('"@lapis-notes/api": LapisApiHostModule');
    expect(hostModules).toContain(
      '"@lapis-notes/markdown/embed": MarkdownEmbedHostModule',
    );
    expect(hostModules.match(/"@lapis-notes\//g)).toHaveLength(2);
    expect(hostModules).toContain("...implicitNotesRendererHostModules");
    expect(source).toContain("svelte: SvelteHostModule");
    expect(source).toContain(
      '"svelte/internal/client": SvelteInternalClientHostModule',
    );
    expect(source).toContain(
      '"svelte/internal/disclose-version": SvelteDiscloseVersionHostModule',
    );
    expect(source).toContain(
      "satisfies Record<ImplicitRendererEsmHostModule, unknown>",
    );
    expect(source).toContain(
      "return new RendererImportMapPluginDependencyResolver(dependencies)",
    );
  });
});
