import { describe, expect, it } from "vitest";
import {
  APP_TOOL_MCP_SERVER_NAME,
  createMcpServerContributionRegistry,
} from "./mcp-server-registry";

describe("MCP server contribution registry", () => {
  it("lists external servers deterministically", () => {
    const registry = createMcpServerContributionRegistry([
      { name: "zeta", command: "zeta" },
      { name: "alpha", command: "alpha" },
    ]);

    expect(registry.list().map((server) => server.name)).toEqual([
      "alpha",
      "zeta",
    ]);
  });

  it("rejects duplicates and the app-owned reserved server name", () => {
    const registry = createMcpServerContributionRegistry([
      { name: "external", command: "external" },
    ]);

    expect(() =>
      registry.register({ name: "external", command: "duplicate" }),
    ).toThrow("already registered");
    expect(() =>
      registry.register({
        name: APP_TOOL_MCP_SERVER_NAME,
        command: "not-allowed",
      }),
    ).toThrow("reserved");
  });

  it("disposes only the registered contribution", () => {
    const registry = createMcpServerContributionRegistry();
    const dispose = registry.register({ name: "external", command: "run" });

    dispose();
    dispose();

    expect(registry.list()).toEqual([]);
  });
});
