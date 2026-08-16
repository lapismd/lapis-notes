import { describe, expect, it } from "vitest";
import {
  projectChatItemsToTranscript,
  projectTranscriptToChatItems,
} from "./transcript-projection";

describe("conversation transcript projection", () => {
  it("persists stable visible content while excluding raw and streaming thinking", () => {
    const entries = projectChatItemsToTranscript(
      [
        { id: "user", type: "message", role: "user", text: "Hello" },
        {
          id: "raw",
          type: "thinking",
          text: "private chain",
          kind: "reasoning",
          state: "done",
        },
        {
          id: "streaming",
          type: "thinking",
          text: "unfinished summary",
          kind: "summary",
          state: "streaming",
        },
        {
          id: "summary",
          type: "thinking",
          text: "Checked the repository",
          kind: "summary",
          state: "done",
        },
        {
          id: "tool",
          type: "tool",
          toolId: "tool-1",
          name: "shell",
          state: "completed",
          input: "token=secret /vault/project",
          output: "ok",
        },
      ],
      {
        agentBindingId: "binding-1",
        vaultRoot: "/vault",
        now: () => "2026-08-16T00:00:00.000Z",
      },
    );

    expect(entries.map((entry) => entry.type)).toEqual([
      "message",
      "thinking.summary",
      "tool",
    ]);
    expect(entries.every((entry) => entry.agentBindingId === "binding-1")).toBe(
      true,
    );
    expect(entries.find((entry) => entry.type === "tool")).toMatchObject({
      input: expect.not.stringContaining("secret"),
      redacted: true,
    });
  });

  it("projects replay provenance into durable semantic entries", () => {
    const [entry] = projectChatItemsToTranscript([
      {
        id: "assistant",
        type: "message",
        role: "assistant",
        text: "Recovered",
        source: { sessionId: "session-1", runId: "run-1", sequence: 7 },
      },
    ]);
    expect(entry?.source).toEqual({
      sessionId: "session-1",
      runId: "run-1",
      sequence: 7,
    });
  });

  it("persists only safe approval decisions and never question answers", () => {
    const entries = projectChatItemsToTranscript(
      [
        {
          id: "approval",
          type: "approval",
          status: "approved",
          responseOptionId: "allow-once",
          request: {
            id: "approval-1",
            kind: "execute",
            title: "Run tests",
            options: [
              { id: "allow-once", label: "Allow once", kind: "allow-once" },
            ],
            metadata: { vendorSecret: "must-not-persist" },
          },
        },
        {
          id: "question",
          type: "question",
          status: "answered",
          request: {
            id: "question-1",
            title: "Choose",
            questions: [
              {
                id: "choice",
                header: "Choice",
                prompt: "Pick one",
                allowOther: true,
                secret: false,
              },
            ],
          },
        },
      ],
      { now: () => "2026-08-16T00:00:00.000Z" },
    );

    expect(entries).toContainEqual(
      expect.objectContaining({
        type: "approval.response",
        option: { id: "allow-once", label: "Allow once" },
      }),
    );
    expect(JSON.stringify(entries)).not.toContain("vendorSecret");
    expect(entries).toContainEqual(
      expect.objectContaining({
        type: "question.response",
        status: "answered",
      }),
    );
    expect(JSON.stringify(entries)).not.toContain("answers");
  });

  it("reconstructs messages, summaries, tools, and pending interactions", () => {
    const original = projectChatItemsToTranscript(
      [
        { id: "m1", type: "message", role: "assistant", text: "Done" },
        {
          id: "q1",
          type: "question",
          status: "pending",
          request: {
            id: "request-1",
            title: "Question",
            questions: [],
          },
        },
      ],
      { now: () => "2026-08-16T00:00:00.000Z" },
    );
    expect(projectTranscriptToChatItems(original)).toMatchObject([
      { id: "m1", type: "message", text: "Done" },
      { id: "q1", type: "question", status: "pending" },
    ]);
  });
});
