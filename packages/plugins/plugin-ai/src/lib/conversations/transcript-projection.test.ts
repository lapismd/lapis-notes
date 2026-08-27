import { describe, expect, it } from "vitest";
import {
  projectChatItemsToTranscript,
  projectTranscriptToChatItems,
} from "./transcript-projection";
import { CONVERSATION_SCHEMA_VERSION } from "./types";

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
      provenance: {
        originClass: "untrusted",
        sourceKind: "runtime-output",
      },
    });
    expect(entries[0]).toMatchObject({
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      provenance: {
        originClass: "owner",
        sourceKind: "user-message",
      },
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

  it("stores command and skill-activation metadata without skill bodies", () => {
    const entries = projectChatItemsToTranscript(
      [
        {
          id: "cmd",
          type: "command",
          command: "research-notes",
          origin: "skill",
          arguments: "authentication",
          status: "completed",
          text: "/research-notes authentication",
        },
        {
          id: "skill",
          type: "skill-activation",
          skillId: "folder:research-notes",
          skillName: "research-notes",
          version: "fnv1a:1",
          origin: "user",
          arguments: "authentication",
          text: "Skill research-notes (fnv1a:1)",
        },
      ],
      { agentBindingId: "binding-1", now: () => "2026-08-16T00:00:00.000Z" },
    );
    expect(entries).toEqual([
      expect.objectContaining({
        type: "command",
        command: "research-notes",
        origin: "skill",
        agentBindingId: "binding-1",
      }),
      expect.objectContaining({
        type: "skill-activation",
        skillName: "research-notes",
        version: "fnv1a:1",
        agentBindingId: "binding-1",
      }),
    ]);
    expect(JSON.stringify(entries)).not.toContain("Use notes_search");
    expect(projectTranscriptToChatItems(entries)).toMatchObject([
      { type: "command", command: "research-notes" },
      { type: "skill-activation", skillName: "research-notes" },
    ]);
  });

  it("round-trips slash-command report layout on system notices", () => {
    const entries = projectChatItemsToTranscript([
      {
        id: "notice",
        type: "status",
        text: "Conversation: abc\nScope: Projects",
        layout: "report",
      },
    ]);
    expect(entries).toEqual([
      expect.objectContaining({
        type: "system.notice",
        layout: "report",
        text: "Conversation: abc\nScope: Projects",
      }),
    ]);
    expect(projectTranscriptToChatItems(entries)).toMatchObject([
      {
        type: "status",
        layout: "report",
        text: "Conversation: abc\nScope: Projects",
      },
    ]);
  });

  it("round-trips slash-command inventory layout on system notices", () => {
    const entries = projectChatItemsToTranscript([
      {
        id: "notice",
        type: "status",
        text: "research-notes",
        layout: "inventory",
        inventory: {
          kind: "skills",
          items: [
            {
              name: "research-notes",
              description: "Research notes in the current folder",
              kind: "skill",
              path: "Projects/.agents/skills/research-notes/SKILL.md",
            },
          ],
        },
      },
    ]);
    expect(entries).toEqual([
      expect.objectContaining({
        type: "system.notice",
        layout: "inventory",
        text: "research-notes",
        inventory: {
          kind: "skills",
          items: [
            expect.objectContaining({
              name: "research-notes",
              kind: "skill",
            }),
          ],
        },
      }),
    ]);
    expect(projectTranscriptToChatItems(entries)).toMatchObject([
      {
        type: "status",
        layout: "inventory",
        inventory: {
          kind: "skills",
          items: [{ name: "research-notes", kind: "skill" }],
        },
      },
    ]);
  });
});
