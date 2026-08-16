import { describe, expect, it } from "vitest";
import { buildConversationContextHandoff } from "./context-handoff";
import { CONVERSATION_SCHEMA_VERSION, type TranscriptEntry } from "./types";

const base = {
  schemaVersion: CONVERSATION_SCHEMA_VERSION,
  createdAt: "2026-08-16T00:00:00.000Z",
};

describe("buildConversationContextHandoff", () => {
  it("keeps deterministic local messages and concise tool actions", () => {
    const transcript: TranscriptEntry[] = [
      { ...base, id: "u1", type: "message", role: "user", text: "Fix\nthis" },
      { ...base, id: "r1", type: "thinking.summary", text: "private plan" },
      {
        ...base,
        id: "t1",
        type: "tool",
        toolId: "tool-1",
        name: "shell",
        state: "completed",
        input: "pnpm test",
        output: "secret output",
      },
      {
        ...base,
        id: "a1",
        type: "message",
        role: "assistant",
        text: "Done",
      },
    ];

    expect(buildConversationContextHandoff(transcript)).toEqual({
      text: "User: Fix this\nTool: shell — pnpm test\nAssistant: Done",
      throughEntryId: "a1",
    });
  });

  it("bounds the newest deterministic context", () => {
    const transcript: TranscriptEntry[] = [
      { ...base, id: "u1", type: "message", role: "user", text: "older" },
      { ...base, id: "a1", type: "message", role: "assistant", text: "newer" },
    ];

    expect(buildConversationContextHandoff(transcript, 16)).toEqual({
      text: "Assistant: newer",
      throughEntryId: "a1",
    });
  });
});
