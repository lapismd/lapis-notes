import { describe, expect, it } from "vitest";
import {
  formatToolPayloadAsJson,
  toolCallTarget,
} from "./chat-tool-display";

describe("chat tool display", () => {
  it("pretty-prints JSON objects and stringifies non-JSON output", () => {
    expect(formatToolPayloadAsJson('{"path":"Notes/a.md"}')).toBe(
      '{\n  "path": "Notes/a.md"\n}',
    );
    expect(formatToolPayloadAsJson("plain text")).toBe('"plain text"');
    expect(formatToolPayloadAsJson(undefined)).toBeUndefined();
  });

  it("summarizes command or path input for the call target", () => {
    expect(toolCallTarget('{"command":"git status"}', "mcp")).toBe(
      "git status",
    );
    expect(
      toolCallTarget('{"locations":[{"path":"src/a.ts"}]}', undefined),
    ).toBe("src/a.ts");
    expect(toolCallTarget(undefined, "lapis-tools")).toBe("lapis-tools");
  });
});
