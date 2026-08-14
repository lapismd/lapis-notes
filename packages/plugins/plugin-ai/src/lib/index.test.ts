import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("@lapis-notes/ai public exports", () => {
  it("publishes the plugin entrypoint and stylesheet", () => {
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

    expect(manifest.name).toBe("@lapis-notes/ai");
    expect(manifest.exports).toHaveProperty(".");
    expect(manifest.exports).toHaveProperty("./styles.css");
    expect(source).toContain("export { AiPlugin");
    expect(source).toContain("FakeAgentRuntime");
    expect(source).toContain("AcpAgentRuntime");
    expect(source).toContain("CodexNativeRuntime");
    expect(source).toContain("createAgentRuntimeRegistry");
  });
});
