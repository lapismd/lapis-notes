import { describe, expect, it } from "vitest";
import {
  parseNamedWorkspaceStore,
  serializeNamedWorkspaceStore,
} from "../workspace-layouts";

describe("named workspace store", () => {
  it("parses named layouts and ignores invalid payloads", () => {
    expect(parseNamedWorkspaceStore("{")).toEqual({ workspaces: {} });
    expect(
      parseNamedWorkspaceStore(
        JSON.stringify({
          workspaces: { Writing: { active: "leaf-1" } },
          active: "Writing",
        }),
      ),
    ).toEqual({
      workspaces: { Writing: { active: "leaf-1" } },
      active: "Writing",
    });
  });

  it("serializes a trailing newline", () => {
    expect(
      serializeNamedWorkspaceStore({
        workspaces: { Review: { active: "leaf-2" } },
        active: "Review",
      }),
    ).toBe(`${JSON.stringify(
      {
        workspaces: { Review: { active: "leaf-2" } },
        active: "Review",
      },
      null,
      2,
    )}\n`);
  });
});
