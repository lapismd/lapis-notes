import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

describe("@lapis-notes/bases public exports", () => {
  it("imports the real public source entrypoint", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const publicApi = await import("./index");

    expect(publicApi.BasesPlugin).toBeTypeOf("function");
    expect(publicApi.BasesViewSurface).toBeTruthy();
    expect(publicApi.BasesViewType).toBe("bases");
    expect(publicApi.parseBasesDocument).toBeTypeOf("function");
    expect(publicApi.serializeBasesDocument).toBeTypeOf("function");
  }, 60_000);

  it("publishes the plugin entrypoint and explicit stylesheet", () => {
    const manifest = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"),
    ) as {
      name: string;
      exports: Record<string, unknown>;
    };
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/index.ts"),
      "utf8",
    );

    expect(manifest.name).toBe("@lapis-notes/bases");
    expect(manifest.exports).toHaveProperty(".");
    expect(manifest.exports).toHaveProperty("./styles.css");
    expect(source).toContain("export { BasesPlugin }");
    expect(source).toContain("default as BasesViewSurface");
    expect(source).toContain("BasesViewType");
    expect(source).toContain("parseBasesDocument");
    expect(source).toContain("serializeBasesDocument");
    expect(source).toContain("export default BasesPlugin");
  });
});
