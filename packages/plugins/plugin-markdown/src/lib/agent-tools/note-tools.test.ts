import {
  createAppToolExecutionScope,
  type AppToolExecutionContext,
} from "@lapis-notes/api/agent-tools";
import { MemoryVaultAdapter, TFile, Vault } from "@lapis-notes/api/vault";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createNotesListTool,
  createNotesPatchTool,
  createNotesReadTool,
} from "./note-tools";

let adapter: MemoryVaultAdapter;
let vault: Vault;

beforeEach(async () => {
  adapter = new MemoryVaultAdapter({
    "Projects/Alpha/readme.md": "# Alpha\nold value\nlast line",
    "Projects/Alpha/repeated.md": "same\nsame\n",
    "Projects/Alpha/Sub/nested.markdown": "Nested",
    "Projects/Alpha/Sub/Deep/too-deep.md": "Deep",
    "Projects/Alpha/data.json": "{}",
    "Projects/Alpha/.lapis/private.md": "Private",
    "Projects/Beta/outside.md": "Outside",
  });
  vault = new Vault(adapter);
  await vault.load();
});

function context(signal = new AbortController().signal): AppToolExecutionContext {
  return {
    conversationId: "conversation-1",
    agentBindingId: "binding-1",
    runId: "run-1",
    toolCallId: "call-1",
    scope: createAppToolExecutionScope("Projects/Alpha"),
    launchNotePath: "Projects/Alpha/readme.md",
    signal,
  };
}

describe("notes_read", () => {
  it("reads one-based bounded lines with revision metadata", async () => {
    const result = await createNotesReadTool(vault).execute(
      { path: "Projects/Alpha/readme.md", startLine: 2, endLine: 3 },
      context(),
    );

    expect(result).toMatchObject({
      content: [{ type: "text", text: "old value\nlast line" }],
      structuredContent: {
        path: "Projects/Alpha/readme.md",
        startLine: 2,
        endLine: 3,
        totalLines: 3,
        truncated: false,
        revision: { size: 27 },
      },
    });
  });

  it("caps reads at 500 lines and 64 KiB", async () => {
    await vault.create(
      "Projects/Alpha/large.md",
      Array.from({ length: 600 }, (_, index) => `line ${index + 1}`).join("\n"),
    );
    const result = await createNotesReadTool(vault).execute(
      { path: "Projects/Alpha/large.md" },
      context(),
    );

    expect(result.structuredContent).toMatchObject({
      endLine: 500,
      totalLines: 600,
      truncated: true,
    });

    await vault.create("Projects/Alpha/huge.md", "x".repeat(70 * 1024));
    const huge = await createNotesReadTool(vault).execute(
      { path: "Projects/Alpha/huge.md" },
      context(),
    );
    expect(
      new TextEncoder().encode(
        (huge.structuredContent as { text: string }).text,
      ).byteLength,
    ).toBeLessThanOrEqual(60 * 1024);
    expect(huge.structuredContent).toMatchObject({ truncated: true });
  });

  it("rejects traversal, scope escapes, non-Markdown, and internal paths", async () => {
    const tool = createNotesReadTool(vault);
    for (const path of [
      "../Beta/outside.md",
      "Projects/Beta/outside.md",
      "Projects/Alpha/data.json",
      "Projects/Alpha/.lapis/private.md",
      "/Projects/Alpha/readme.md",
    ]) {
      await expect(tool.execute({ path }, context())).rejects.toThrow();
    }
  });
});

describe("notes_list", () => {
  it("lists stable scoped Markdown records at depth one through three", async () => {
    const tool = createNotesListTool(vault);
    const shallow = await tool.execute({}, context());
    expect(shallow.structuredContent).toMatchObject({
      path: "Projects/Alpha",
      depth: 1,
      entries: [
        { path: "Projects/Alpha/readme.md", type: "file" },
        { path: "Projects/Alpha/repeated.md", type: "file" },
        { path: "Projects/Alpha/Sub", type: "folder" },
      ],
      truncated: false,
    });

    const nested = await tool.execute(
      { path: "Projects/Alpha/Sub", depth: 2 },
      context(),
    );
    expect(nested.structuredContent).toMatchObject({
      entries: [
        { path: "Projects/Alpha/Sub/Deep", type: "folder" },
        { path: "Projects/Alpha/Sub/Deep/too-deep.md", type: "file" },
        { path: "Projects/Alpha/Sub/nested.markdown", type: "file" },
      ],
    });
  });

  it("rejects missing, escaped, and internal directories", async () => {
    const tool = createNotesListTool(vault);
    for (const path of [
      "Projects/Beta",
      "Projects/Alpha/missing",
      "Projects/Alpha/.lapis",
    ]) {
      await expect(tool.execute({ path }, context())).rejects.toThrow();
    }
  });
});

describe("notes_patch", () => {
  it("describes the diff and atomically patches exactly one match", async () => {
    const tool = createNotesPatchTool(vault);
    await expect(
      tool.describeApproval?.(
        {
          path: "Projects/Alpha/readme.md",
          oldText: "old value",
          newText: "new value",
        },
        context(),
      ),
    ).resolves.toEqual({
      title: "Patch Projects/Alpha/readme.md",
      description: "Replace one exact text match in this note.",
      path: "Projects/Alpha/readme.md",
      diff: { before: "old value", after: "new value" },
    });

    const result = await tool.execute(
      {
        path: "Projects/Alpha/readme.md",
        oldText: "old value",
        newText: "new value",
      },
      context(),
    );
    await expect(adapter.read("Projects/Alpha/readme.md")).resolves.toContain(
      "new value",
    );
    expect(result).toMatchObject({
      structuredContent: {
        status: "patched",
        path: "Projects/Alpha/readme.md",
        revision: { size: 27 },
      },
    });
  });

  it("returns zero and repeated-match conflicts without writing", async () => {
    const tool = createNotesPatchTool(vault);
    const initialWrites = adapter.writeCount;
    await expect(
      tool.execute(
        {
          path: "Projects/Alpha/readme.md",
          oldText: "missing",
          newText: "new",
        },
        context(),
      ),
    ).resolves.toMatchObject({
      isError: true,
      structuredContent: {
        status: "conflict",
        reason: "match_not_found",
        matchCount: 0,
      },
    });
    await expect(
      tool.execute(
        {
          path: "Projects/Alpha/repeated.md",
          oldText: "same",
          newText: "new",
        },
        context(),
      ),
    ).resolves.toMatchObject({
      isError: true,
      structuredContent: {
        status: "conflict",
        reason: "ambiguous_match",
        matchCount: 2,
      },
    });
    expect(adapter.writeCount).toBe(initialWrites);
  });

  it("fails concurrent drift and cancellation without another write", async () => {
    const tool = createNotesPatchTool(vault);
    const file = vault.getAbstractFileByPath("Projects/Alpha/readme.md");
    if (!(file instanceof TFile)) throw new Error("fixture missing");
    await vault.modify(file, "# Alpha\nchanged elsewhere\nlast line");
    const writesAfterDrift = adapter.writeCount;
    await expect(
      tool.execute(
        {
          path: "Projects/Alpha/readme.md",
          oldText: "old value",
          newText: "new value",
        },
        context(),
      ),
    ).resolves.toMatchObject({
      isError: true,
      structuredContent: { reason: "match_not_found" },
    });
    expect(adapter.writeCount).toBe(writesAfterDrift);

    const controller = new AbortController();
    controller.abort();
    await expect(
      tool.execute(
        {
          path: "Projects/Alpha/readme.md",
          oldText: "changed elsewhere",
          newText: "new value",
        },
        context(controller.signal),
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(adapter.writeCount).toBe(writesAfterDrift);
  });

  it("rejects identical, oversized, escaped, and non-Markdown patches", async () => {
    const tool = createNotesPatchTool(vault);
    for (const input of [
      {
        path: "Projects/Alpha/readme.md",
        oldText: "same",
        newText: "same",
      },
      {
        path: "Projects/Alpha/readme.md",
        oldText: "x".repeat(16 * 1024 + 1),
        newText: "new",
      },
      {
        path: "Projects/Beta/outside.md",
        oldText: "Outside",
        newText: "new",
      },
      {
        path: "Projects/Alpha/data.json",
        oldText: "{}",
        newText: "new",
      },
    ]) {
      await expect(tool.execute(input, context())).rejects.toThrow();
    }
  });
});
