import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createAppToolExecutionScope,
  type AppToolExecutionContext,
} from "../agent-tools";
import { TFile } from "../storage/fs";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import { Vault } from "../storage/vault.svelte";
import { createVaultFileAppTools } from "./app-tools";

const leafDir = dirname(fileURLToPath(import.meta.url));

let adapter: MemoryVaultAdapter;
let vault: Vault;

beforeEach(async () => {
  adapter = new MemoryVaultAdapter({
    "Projects/Alpha/readme.md": "# Alpha\nold value\nlast line",
    "Projects/Alpha/repeated.md": "same\nsame\n",
    "Projects/Alpha/data.json": '{"ok":true}',
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

function tools() {
  const registered = createVaultFileAppTools(vault);
  return {
    read: registered.find((tool) => tool.name === "read")!,
    write: registered.find((tool) => tool.name === "write")!,
    edit: registered.find((tool) => tool.name === "edit")!,
    apply_patch: registered.find((tool) => tool.name === "apply_patch")!,
  };
}

describe("file-tools isolation", () => {
  it("imports only the ai-host file-tools leaf", () => {
    const sources = [
      "app-tools.ts",
      "vault-operations.ts",
      "index.ts",
      "paths.ts",
    ].map((name) => readFileSync(join(leafDir, name), "utf8"));
    for (const source of sources) {
      expect(source).not.toMatch(/@lapismd\/ai-host["']/u);
      expect(source).not.toMatch(/@modelcontextprotocol|acpx|mcp-shim/u);
    }
    expect(readFileSync(join(leafDir, "app-tools.ts"), "utf8")).toContain(
      "@lapismd/ai-host/file-tools",
    );
    expect(readFileSync(join(leafDir, "vault-operations.ts"), "utf8")).toContain(
      "@lapismd/ai-host/file-tools",
    );
  });
});

describe("file-tool descriptions", () => {
  it("steers the agent to vault file tools instead of the host cwd", () => {
    const registered = tools();
    expect(registered.read.description).toContain("Prefer this tool over");
    expect(registered.read.description).toContain("cat");
    expect(registered.write.description).toContain("Prefer this tool over");
    expect(registered.write.description).toContain("redirects");
    expect(registered.edit.description).toContain("Prefer this tool over");
    expect(registered.edit.description).toContain("sed");
    expect(registered.apply_patch.description).toContain("Prefer this tool over");
    expect(registered.apply_patch.description).toContain("agent cwd");
  });
});

describe("read", () => {
  it("reads one-based bounded lines from any scoped text file", async () => {
    const result = await tools().read.execute(
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

    const json = await tools().read.execute(
      { file_path: "Projects/Alpha/data.json" },
      context(),
    );
    expect(json.content).toEqual([{ type: "text", text: '{"ok":true}' }]);
  });

  it("rejects traversal, scope escapes, and internal paths", async () => {
    const tool = tools().read;
    for (const path of [
      "../Beta/outside.md",
      "Projects/Beta/outside.md",
      "Projects/Alpha/.lapis/private.md",
      "/Projects/Alpha/readme.md",
    ]) {
      await expect(tool.execute({ path }, context())).rejects.toThrow();
    }
  });
});

describe("write", () => {
  it("creates nested files after mkpath and overwrites without a suffix", async () => {
    const tool = tools().write;
    const created = await tool.execute(
      { path: "Projects/Alpha/New/note.md", content: "hello" },
      context(),
    );
    expect(created.structuredContent).toMatchObject({
      status: "created",
      path: "Projects/Alpha/New/note.md",
      created: true,
    });
    await expect(adapter.read("Projects/Alpha/New/note.md")).resolves.toBe(
      "hello",
    );

    const overwritten = await tool.execute(
      { path: "Projects/Alpha/New/note.md", content: "hello" },
      context(),
    );
    expect(overwritten.structuredContent).toMatchObject({
      status: "unchanged",
      created: false,
      changed: false,
    });

    await expect(
      tool.execute(
        { path: "Projects/Alpha/New/note.md", content: "replaced" },
        context(),
      ),
    ).resolves.toMatchObject({
      structuredContent: { status: "updated", created: false, changed: true },
    });
    await expect(adapter.read("Projects/Alpha/New/note.md")).resolves.toBe(
      "replaced",
    );
  });

  it("rejects folders, hidden paths, binary, and oversized payloads", async () => {
    const tool = tools().write;
    await expect(
      tool.execute(
        { path: "Projects/Alpha", content: "nope" },
        context(),
      ),
    ).rejects.toThrow("folder");
    await expect(
      tool.execute(
        { path: "Projects/Alpha/.obsidian/app.json", content: "{}" },
        context(),
      ),
    ).rejects.toThrow();
    await expect(
      tool.execute(
        { path: "Projects/Alpha/binary.txt", content: "a\0b" },
        context(),
      ),
    ).rejects.toThrow("UTF-8");
    await expect(
      tool.execute(
        { path: "Projects/Alpha/huge.txt", content: "x".repeat(256 * 1024 + 1) },
        context(),
      ),
    ).rejects.toThrow("size limit");
  });
});

describe("edit", () => {
  it("describes hunks and applies unique replacements", async () => {
    const tool = tools().edit;
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
      title: "Edit Projects/Alpha/readme.md",
      description: "Replace unique exact text hunks in this file.",
      path: "Projects/Alpha/readme.md",
      diffs: [
        {
          path: "Projects/Alpha/readme.md",
          before: "old value",
          after: "new value",
        },
      ],
    });

    const result = await tool.execute(
      {
        file_path: "Projects/Alpha/readme.md",
        edits: [{ old_string: "old value", new_string: "new value" }],
      },
      context(),
    );
    await expect(adapter.read("Projects/Alpha/readme.md")).resolves.toContain(
      "new value",
    );
    expect(result).toMatchObject({
      structuredContent: {
        status: "edited",
        path: "Projects/Alpha/readme.md",
      },
    });
  });

  it("returns conflicts without writing", async () => {
    const tool = tools().edit;
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
      structuredContent: { status: "conflict", reason: "match_not_found" },
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
      structuredContent: { status: "conflict", reason: "ambiguous_match" },
    });
    expect(adapter.writeCount).toBe(initialWrites);
  });

  it("fails cancellation without another write", async () => {
    const tool = tools().edit;
    const writes = adapter.writeCount;
    const controller = new AbortController();
    controller.abort();
    await expect(
      tool.execute(
        {
          path: "Projects/Alpha/readme.md",
          oldText: "old value",
          newText: "new value",
        },
        context(controller.signal),
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(adapter.writeCount).toBe(writes);
  });
});

describe("apply_patch", () => {
  it("adds, updates, and trashes scoped files after validation", async () => {
    const tool = tools().apply_patch;
    const approval = await tool.describeApproval?.(
      {
        input: `*** Begin Patch
*** Add File: Projects/Alpha/new.md
+hello
*** Update File: Projects/Alpha/readme.md
@@
-old value
+new value
*** Delete File: Projects/Alpha/data.json
*** End Patch`,
      },
      context(),
    );
    expect(approval?.paths).toEqual([
      "Projects/Alpha/new.md",
      "Projects/Alpha/readme.md",
      "Projects/Alpha/data.json",
    ]);
    expect(approval?.diffs).toHaveLength(3);

    const result = await tool.execute(
      {
        input: `*** Begin Patch
*** Add File: Projects/Alpha/new.md
+hello
*** Update File: Projects/Alpha/readme.md
@@
-old value
+new value
*** Delete File: Projects/Alpha/data.json
*** End Patch`,
      },
      context(),
    );
    expect(result.structuredContent).toMatchObject({
      status: "patched",
      added: ["Projects/Alpha/new.md"],
      modified: ["Projects/Alpha/readme.md"],
      deleted: ["Projects/Alpha/data.json"],
    });
    await expect(adapter.read("Projects/Alpha/new.md")).resolves.toBe("hello\n");
    await expect(adapter.read("Projects/Alpha/readme.md")).resolves.toContain(
      "new value",
    );
    expect(vault.getAbstractFileByPath("Projects/Alpha/data.json")).toBeNull();
  });

  it("leaves files unchanged when a later hunk fails", async () => {
    const tool = tools().apply_patch;
    const writes = adapter.writeCount;
    await expect(
      tool.execute(
        {
          input: `*** Begin Patch
*** Add File: Projects/Alpha/new.md
+hello
*** Update File: Projects/Alpha/missing.md
@@
-old
+new
*** End Patch`,
        },
        context(),
      ),
    ).rejects.toThrow();
    expect(adapter.writeCount).toBe(writes);
    expect(vault.getAbstractFileByPath("Projects/Alpha/new.md")).toBeNull();
  });

  it("rejects Add File when the destination exists", async () => {
    await expect(
      tools().apply_patch.execute(
        {
          input: `*** Begin Patch
*** Add File: Projects/Alpha/readme.md
+x
*** End Patch`,
        },
        context(),
      ),
    ).rejects.toThrow("already exists");
    const file = vault.getAbstractFileByPath("Projects/Alpha/readme.md");
    expect(file).toBeInstanceOf(TFile);
  });
});
