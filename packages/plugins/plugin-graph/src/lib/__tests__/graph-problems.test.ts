import { describe, expect, it, vi } from "vitest";
import type {
  DiagnosticCollection,
  DiagnosticCollectionUpdate,
} from "@lapis-notes/api";
import {
  createGraphProblemReporter,
  GraphProblemReporter,
} from "../graph-problems";

function createCollection() {
  const values = new Map<
    string,
    NonNullable<DiagnosticCollectionUpdate[1]>
  >();
  const clear = vi.fn(() => values.clear());
  const set = vi.fn(
    (entries: Iterable<DiagnosticCollectionUpdate>) => {
      for (const [resource, diagnostics] of entries) {
        if (diagnostics) values.set(resource?.uri ?? "workspace", diagnostics);
      }
    },
  );
  return {
    collection: { clear, set } as unknown as DiagnosticCollection,
    clear,
    set,
    values,
  };
}

describe("Graph Problems reporting", () => {
  it("uses the plugin-owned collection and active-file resource", () => {
    const { collection, values, set } = createCollection();
    const createDiagnosticCollection = vi.fn(() => collection);
    const reporter = createGraphProblemReporter({ createDiagnosticCollection });

    reporter.report(
      "local",
      "Notes/Active file.md",
      new Error("Expression tree is too large"),
    );

    expect(createDiagnosticCollection).toHaveBeenCalledWith("build", {
      label: "Graph",
    });
    expect(values.get("vault:///Notes/Active%20file.md")).toEqual([
      expect.objectContaining({
        severity: "error",
        source: "Graph",
        code: "lapis-graph/local-build",
        message: expect.stringContaining("Expression tree is too large"),
      }),
    ]);
    expect(set).toHaveBeenLastCalledWith([
      [
        expect.objectContaining({
          uri: "vault:///Notes/Active%20file.md",
          label: "Active file.md",
          detail: "Notes/Active file.md",
        }),
        expect.any(Array),
      ],
    ]);
  });

  it("keeps global failures workspace-wide and clears recovered scopes", () => {
    const { collection, values, clear } = createCollection();
    const reporter = new GraphProblemReporter(collection);
    reporter.report("global", null, "snapshot failed");
    reporter.report("local", "Notes/Active.md", "local failed");

    expect(values.has("workspace")).toBe(true);
    expect(values.has("vault:///Notes/Active.md")).toBe(true);

    reporter.clear("local");
    expect(values.has("vault:///Notes/Active.md")).toBe(false);
    expect(values.has("workspace")).toBe(true);
    reporter.clear("global");
    expect(values.size).toBe(0);
    expect(clear).toHaveBeenCalledTimes(4);
  });
});
