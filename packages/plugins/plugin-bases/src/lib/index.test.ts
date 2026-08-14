import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("@lapis-notes/bases public exports", () => {
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
