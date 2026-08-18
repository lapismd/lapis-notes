import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAcpAgent, toAcpxSessionOptions } from "@lapismd/ai-host";

describe("desktop agent-runtime host", () => {
  it("delegates ACP execution to @lapismd/ai-host", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src-electron/agent-runtime-host.ts"),
      "utf8",
    );
    const manifest = readFileSync(
      path.resolve(process.cwd(), "package.json"),
      "utf8",
    );
    expect(source).toContain("@lapismd/ai-host");
    expect(source).toContain("createAgentRuntimeExecutor");
    expect(source).not.toContain("acpx/runtime");
    expect(manifest).not.toMatch(/"acpx"/);
  });
});

describe("resolveAcpAgent", () => {
  it("prefers the first-class agent and defaults unknown names to codex", () => {
    expect(resolveAcpAgent({ agent: "cursor" })).toBe("cursor");
    expect(resolveAcpAgent({ metadata: { acpAgent: "cursor" } })).toBe(
      "cursor",
    );
    expect(resolveAcpAgent({ agent: "claude" })).toBe("codex");
    expect(resolveAcpAgent({})).toBe("codex");
  });
});

describe("toAcpxSessionOptions", () => {
  it("maps model to acpx session options", () => {
    expect(
      toAcpxSessionOptions({
        model: { provider: "codex", model: "gpt-5.4-medium" },
        thinking: "high",
      }),
    ).toEqual({ model: "gpt-5.4-medium" });
  });
});
