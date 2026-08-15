import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hostLiveRuntimesEnabled } from "./host-runtime-availability";

describe("host live runtime factory", () => {
  it("returns no live runtimes when the desktop capability is unavailable", () => {
    expect(hostLiveRuntimesEnabled(() => false)).toBe(false);
    expect(hostLiveRuntimesEnabled(() => true)).toBe(true);
  });

  it("constructs ACP and Codex adapters only after the capability gate", () => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, "create-host-runtimes.ts"),
      "utf8",
    );
    expect(source).toContain("hostLiveRuntimesEnabled");
    expect(source).toContain("AcpAgentRuntime");
    expect(source).toContain("CodexNativeRuntime");
    expect(source.indexOf("hostLiveRuntimesEnabled")).toBeLessThan(
      source.indexOf("new AcpAgentRuntime"),
    );
  });
});
