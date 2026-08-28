import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("notesPluginProfile", () => {
  it("contains exactly the four user-disableable Lapis Notes defaults", () => {
    const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
    const profile = source.slice(source.indexOf("export const notesPluginProfile"));
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
