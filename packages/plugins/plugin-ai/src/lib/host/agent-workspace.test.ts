import { describe, expect, it } from "vitest";
import { resolveAgentWorkspace } from "./agent-workspace";

describe("resolveAgentWorkspace", () => {
  it("uses the native vault root instead of its display name", () => {
    expect(
      resolveAgentWorkspace({
        runtime: "deno-desktop",
        rootPath: "/Users/example/Test Vault",
      }),
    ).toBe("/Users/example/Test Vault");
  });

  it("lets an attached host supply the workspace for memory vaults", () => {
    expect(resolveAgentWorkspace({ rootPath: "/memory" })).toBeUndefined();
    expect(
      resolveAgentWorkspace({ runtime: "deno-desktop", rootPath: " " }),
    ).toBeUndefined();
  });
});
