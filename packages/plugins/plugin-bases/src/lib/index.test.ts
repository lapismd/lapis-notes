import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const {
  BasesPlugin,
  BasesViewSurface,
  BasesViewType,
  parseBasesDocument,
  serializeBasesDocument,
} = await import("./index");

describe("@lapis-notes/bases public exports", () => {
  it("imports the real public source entrypoint", () => {
    expect(BasesPlugin).toBeTypeOf("function");
    expect(BasesViewSurface).toBeTruthy();
    expect(BasesViewType).toBe("bases");
    expect(parseBasesDocument).toBeTypeOf("function");
    expect(serializeBasesDocument).toBeTypeOf("function");
  });

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

  it("does not replace host typography tokens from its packaged stylesheet", () => {
    const styles = readFileSync(
      path.resolve(process.cwd(), "src/lib/styles.css"),
      "utf8",
    );
    const rootThemeBlock = styles.match(/:root,\s*:host\s*\{(?<body>[^}]*)\}/u)
      ?.groups?.body;

    expect(rootThemeBlock).toBeDefined();
    expect(rootThemeBlock).not.toMatch(/--font-(?:sans|mono)\s*:/u);
  });
});
