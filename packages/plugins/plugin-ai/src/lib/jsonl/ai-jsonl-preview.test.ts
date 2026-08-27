import { describe, expect, it } from "vitest";
import { createAiJsonlPreview } from "./ai-jsonl-preview";

const transcript = [
  {
    schemaVersion: 1,
    id: "user-1",
    type: "message",
    role: "user",
    text: "Summarize the vault",
    createdAt: "2026-08-27T09:00:00.000Z",
  },
  {
    schemaVersion: 1,
    id: "thinking-1",
    type: "thinking.summary",
    kind: "summary",
    text: "I checked the project notes.",
    createdAt: "2026-08-27T09:00:01.000Z",
  },
  {
    schemaVersion: 1,
    id: "tool-1",
    type: "tool",
    toolId: "notes-search-1",
    name: "notes_search",
    state: "completed",
    input: '{"query":"project"}',
    output: '{"results":["Project.md"]}',
    createdAt: "2026-08-27T09:00:02.000Z",
  },
  {
    schemaVersion: 1,
    id: "assistant-1",
    type: "message",
    role: "assistant",
    text: "The vault has **one active project**.",
    createdAt: "2026-08-27T09:00:03.000Z",
  },
];

function lines(records: unknown[], terminalNewline = true): string {
  return `${records.map((record) => JSON.stringify(record)).join("\n")}${terminalNewline ? "\n" : ""}`;
}

describe("createAiJsonlPreview", () => {
  it("validates and projects portable transcripts into chat items", () => {
    const preview = createAiJsonlPreview(
      "Notes/.lapis/agents/sessions/id/transcript.jsonl",
      lines(transcript),
    );

    expect(preview.kind).toBe("transcript");
    if (preview.kind !== "transcript") throw new Error("expected transcript");
    expect(preview.entries).toHaveLength(4);
    expect(preview.items.map((item) => item.type)).toEqual([
      "message",
      "thinking",
      "tool",
      "message",
    ]);
    expect(preview.warnings).toEqual([]);
  });

  it("uses the durable agent schema for agents.jsonl", () => {
    const preview = createAiJsonlPreview(
      "Notes/.lapis/agents/sessions/id/agents.jsonl",
      lines([
        {
          schemaVersion: 1,
          type: "binding.created",
          id: "binding-1",
          createdAt: "2026-08-27T09:00:00.000Z",
          runtime: "acp",
          agent: "codex",
          model: { provider: "codex", model: "gpt-5.6-sol" },
        },
        {
          schemaVersion: 1,
          type: "usage.updated",
          id: "usage-1",
          createdAt: "2026-08-27T09:01:00.000Z",
          agentBindingId: "binding-1",
          usage: { used: 1200, limit: 128000 },
        },
      ]),
    );

    expect(preview.kind).toBe("agents");
    if (preview.kind !== "agents") throw new Error("expected agents");
    expect(preview.records.map((record) => record.type)).toEqual([
      "binding.created",
      "usage.updated",
    ]);
  });

  it("keeps arbitrary JSONL useful as structured line records", () => {
    const preview = createAiJsonlPreview(
      "Imports/events.jsonl",
      lines([{ event: "created" }, ["one", "two"]]),
    );

    expect(preview).toMatchObject({
      kind: "records",
      records: [
        { line: 1, value: { event: "created" } },
        { line: 2, value: ["one", "two"] },
      ],
    });
  });

  it("warns about an interrupted final append without hiding prior records", () => {
    const preview = createAiJsonlPreview(
      "transcript.jsonl",
      `${lines(transcript)}{"schemaVersion":1,"type":"message"`,
    );

    expect(preview.kind).toBe("transcript");
    if (preview.kind !== "transcript") throw new Error("expected transcript");
    expect(preview.entries).toHaveLength(4);
    expect(preview.warnings).toEqual([
      expect.objectContaining({ line: 5, file: "transcript.jsonl" }),
    ]);
  });

  it("surfaces a terminated malformed record as a readable error", () => {
    const preview = createAiJsonlPreview(
      "transcript.jsonl",
      `${lines(transcript)}not-json\n`,
    );

    expect(preview).toEqual({
      kind: "error",
      message: "transcript.jsonl contains invalid JSON on line 5",
    });
  });
});
