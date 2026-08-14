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
    const bases = source.indexOf("plugin: BasesPlugin");
    const ai = source.indexOf("plugin: AiPlugin");
    const roles = source.indexOf("plugin: RolesPlugin");
    const loadPlugins = source.indexOf("await app.plugins.loadPlugins");
    const metadata = source.indexOf("await app.metadataCache.load");
    const layout = source.indexOf("await app.workspace.loadLayout");

    expect(source).toContain('import "@lapis-notes/bases/styles.css"');
    expect(source).toContain('import "@lapis-notes/ai/styles.css"');
    expect(source.slice(bases, roles)).toContain('distribution: "bundled"');
    expect(source).toContain('communityPlugins: "disabled"');
    expect(search).toBeGreaterThan(-1);
    expect(bases).toBeGreaterThan(search);
    expect(ai).toBeGreaterThan(bases);
    expect(roles).toBeGreaterThan(ai);
    expect(loadPlugins).toBeGreaterThan(roles);
    expect(metadata).toBeGreaterThan(loadPlugins);
    expect(layout).toBeGreaterThan(metadata);
  });
});
