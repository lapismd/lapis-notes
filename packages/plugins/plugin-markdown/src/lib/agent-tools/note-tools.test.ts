import {
  createAppToolExecutionScope,
  type AppToolExecutionContext,
} from "@lapis-notes/api/agent-tools";
import { MemoryVaultAdapter, Vault } from "@lapis-notes/api/vault";
import { beforeEach, describe, expect, it } from "vitest";
import { createMarkdownNoteTools, createNotesListTool } from "./note-tools";

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

describe("createMarkdownNoteTools", () => {
  it("registers only notes_list", () => {
    expect(createMarkdownNoteTools(vault).map((tool) => tool.name)).toEqual([
      "notes_list",
    ]);
  });
});

describe("notes_list", () => {
  it("steers the agent to browse the vault instead of the host cwd", () => {
    const description = createNotesListTool(vault).description;
    expect(description).toContain("Prefer this tool over");
    expect(description).toContain("ls");
    expect(description).toContain("find");
    expect(description).toContain("notes_search");
    expect(description).toMatch(/\bread\b/u);
  });

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
