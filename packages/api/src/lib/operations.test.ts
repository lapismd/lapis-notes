import { describe, expect, it } from "vitest";
import {
  OperationSession,
  resolveOperationContributions,
  type OperationCatalog,
} from "./operations";
import { buildLapisContributionIndex } from "./lapis-extension";

describe("native operation contributions", () => {
  it("distinguishes unsupported, unavailable and incompatible native providers", async () => {
    const declarations = [{ id: "list", version: 1 }];
    expect(
      await resolveOperationContributions(undefined, "tasks", declarations),
    ).toEqual([{ id: "list", state: "unsupported" }]);
    const host = {
      catalog: async (): Promise<OperationCatalog> => ({
        protocol_version: 1,
        operations: [],
      }),
      invoke: async () => {
        throw new Error("discovery cannot invoke");
      },
    };
    expect(
      await resolveOperationContributions(host, "tasks", declarations),
    ).toEqual([{ id: "list", state: "unavailable" }]);
    const descriptor = {
      plugin_id: "tasks",
      id: "list",
      version: 2,
      description: "List Tasks",
      permission: "tasks:read",
      effect: "read_only" as const,
      input_schema: { type: "object" },
      output_schema: { type: "object" },
      help: {
        command: ["tasks", "list"],
        summary: "List",
        markdown: "List Tasks",
        examples: [],
        keywords: [],
        arguments: [],
      },
    };
    host.catalog = async () => ({
      protocol_version: 1,
      operations: [descriptor],
    });
    expect(
      await resolveOperationContributions(host, "tasks", declarations),
    ).toEqual([{ id: "list", state: "incompatible" }]);
    descriptor.version = 1;
    expect(
      (await resolveOperationContributions(host, "tasks", declarations))[0],
    ).toMatchObject({ state: "available", descriptor });
  });
  it("indexes native declarations and rejects malformed versions", () => {
    const indexed = buildLapisContributionIndex({
      pluginId: "tasks",
      manifestPath: "manifest.json",
      classification: "lapis-extension",
      source: "official",
      lapis: {
        manifestVersion: 1,
        contributes: {
          operations: [
            { id: "list", version: 1 },
            { id: "get", version: 0 },
          ],
        },
      },
      grantedCapabilities: [],
    });
    expect(indexed.contributions[0]).toMatchObject({
      kind: "operations",
      id: "list",
      runtimeHost: "native",
      state: "valid",
    });
    expect(indexed.contributions[1].state).toBe("invalid");
  });
  it("drains accepted observation and rejects calls after detach", async () => {
    let finish!: (catalog: OperationCatalog) => void;
    const session = new OperationSession({
      catalog: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      invoke: async () => {
        throw new Error("unused");
      },
    });
    const accepted = session.catalog();
    await Promise.resolve();
    const detached = session.detach();
    await expect(session.catalog()).rejects.toThrow("detached");
    finish({ protocol_version: 1, operations: [] });
    await accepted;
    await detached;
  });
});
