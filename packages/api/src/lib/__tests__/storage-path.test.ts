import { describe, expect, it } from "vitest";
import { isLapisInternalPath } from "../storage/path";

describe("vault storage paths", () => {
  it("recognizes folder-scoped .lapis data without hiding similarly named files", () => {
    expect(isLapisInternalPath(".lapis/agents/sessions/a")).toBe(true);
    expect(isLapisInternalPath("Projects/Atlas/.lapis/agents/sessions/a")).toBe(
      true,
    );
    expect(isLapisInternalPath("Projects\\Atlas\\.lapis\\metadata.yaml")).toBe(
      true,
    );
    expect(isLapisInternalPath("Projects/Atlas/.lapis-notes.md")).toBe(false);
    expect(isLapisInternalPath("Projects/Atlas/note.md")).toBe(false);
  });
});
