import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("@lapis-notes/ai public exports", () => {
  it("publishes the plugin-safe root and a narrow runtimes subpath", () => {
    const manifest = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"),
    ) as {
      name: string;
      exports: Record<string, unknown>;
      optionalDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/index.ts"),
      "utf8",
    );
    const adapters = readFileSync(
      path.resolve(process.cwd(), "src/lib/runtime-adapters.ts"),
      "utf8",
    );

    expect(manifest.name).toBe("@lapis-notes/ai");
    expect(manifest.exports).toHaveProperty(".");
    expect(manifest.exports).toHaveProperty("./styles.css");
    expect(manifest.exports).toHaveProperty("./runtimes");
    expect(manifest.optionalDependencies?.acpx).toBeUndefined();
    expect(manifest.dependencies?.acpx).toBeUndefined();
    expect(manifest.dependencies?.["@lapis-notes/ai-host"]).toBeUndefined();
    expect(manifest.dependencies?.["@lapismd/ai-host"]).toBeUndefined();
    const plugin = readFileSync(
      path.resolve(process.cwd(), "src/lib/ai-plugin.ts"),
      "utf8",
    );
    expect(plugin).toContain("createVaultFileAppTools");
    expect(plugin).not.toContain("@lapismd/ai-host");
    expect(plugin).toContain('new AcpModelProvider("codex", { workspace })');
    expect(plugin).toContain('new AcpModelProvider("cursor", { workspace })');
    expect(plugin).not.toContain("new CodexModelProvider");
    expect(source).toContain("export { AiPlugin");
    expect(source).toContain("FakeAgentRuntime");
    expect(source).toContain("createAgentRuntimeRegistry");
    expect(source).toContain("CodexModelProvider");
    expect(source).toContain("createPersistedSessionStore");
    expect(source).toContain("searchVaultFiles");
    expect(source).toContain("AiJsonlView");
    expect(source).not.toContain("AcpAgentRuntime");
    expect(source).not.toContain("CodexNativeRuntime");
    expect(adapters).toContain("AcpAgentRuntime");
    expect(adapters).toContain("CodexNativeRuntime");
  });
});
