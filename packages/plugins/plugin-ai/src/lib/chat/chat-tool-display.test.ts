import { describe, expect, it } from "vitest";
import {
  isOneLineAlert,
  presentToolPayload,
  toolCallTarget,
} from "./chat-tool-display";

describe("chat tool display", () => {
  it("unwraps an output envelope into multiline bash text", () => {
    expect(presentToolPayload('{"output":"hello\\nworld"}')).toEqual({
      code: "hello\nworld",
      language: "bash",
    });
  });

  it("treats CLI transcripts as bash", () => {
    expect(presentToolPayload("$ git status\nOn branch main")).toEqual({
      code: "$ git status\nOn branch main",
      language: "bash",
    });
  });

  it("joins MCP content-array envelopes into bash when multiline", () => {
    expect(
      presentToolPayload(
        JSON.stringify({
          content: [
            { type: "text", text: "alpha" },
            { type: "text", text: "beta" },
          ],
        }),
      ),
    ).toEqual({
      code: "alpha\nbeta",
      language: "bash",
    });
  });

  it("keeps objects with multiple data keys as pretty JSON", () => {
    expect(presentToolPayload('{"ok":true,"totalMatches":3}')).toEqual({
      code: '{\n  "ok": true,\n  "totalMatches": 3\n}',
      language: "json",
    });
  });

  it("keeps a file-read sibling path structured", () => {
    expect(
      presentToolPayload('{"ok":true,"path":"a.md","content":"# Title"}'),
    ).toEqual({
      code: '{\n  "ok": true,\n  "path": "a.md",\n  "content": "# Title"\n}',
      language: "json",
    });
  });

  it("shows a short unmarked line as plaintext instead of a JSON string", () => {
    expect(presentToolPayload("ok")).toEqual({
      code: "ok",
      language: "plaintext",
    });
    expect(isOneLineAlert({ code: "ok", language: "plaintext" })).toBe(true);
    expect(presentToolPayload(undefined)).toBeUndefined();
  });

  it("pretty-prints double-encoded JSON objects", () => {
    expect(presentToolPayload('"{\\"totalMatches\\":3}"')).toEqual({
      code: '{\n  "totalMatches": 3\n}',
      language: "json",
    });
  });

  it("uses bash for one-line stdout from a runner tool", () => {
    expect(presentToolPayload("done", { toolName: "bash" })).toEqual({
      code: "done",
      language: "bash",
    });
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
