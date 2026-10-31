import { describe, expect, it, vi } from "vitest";
// Exercise host map construction using the owning generated public catalogue.
vi.mock("@lapis-notes/api/plugin-host-modules", async () => import("../../api/src/lib/generated/plugin-host-modules.schema.generated"));
import { rendererPluginImportMap, resolvePluginHostModule, loadPluginHostModule } from "./plugin-host-build";

describe("Notebook public renderer host modules", () => {
  it.each(["@lapismd/design-core/shadcn/canvas-table", "@lapismd/design-core/shadcn/filter-builder", "@lapis-notes/ui/search"])("exposes %s through a build-owned import map", specifier => {
    const url = rendererPluginImportMap.imports[specifier];
    expect(url).toMatch(/^\/plugin-host-.*\.js$/);
    const id = resolvePluginHostModule(url);
    expect(id).toBeTruthy();
    expect(loadPluginHostModule(id!)).toContain(`export * from ${JSON.stringify(specifier)}`);
  });
  it("rejects unlisted/private imports and preserves a shared API module", () => {
    expect(resolvePluginHostModule("@lapismd/design-core/private/notebook")).toBeUndefined();
    expect(rendererPluginImportMap.imports["@lapis-notes/api"]).toBe("/plugin-host-api.js");
  });
});
