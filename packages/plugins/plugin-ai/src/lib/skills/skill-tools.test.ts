import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  AppToolRegistry,
  type AppTool,
} from "@lapis-notes/api/agent-tools";
import { AppToolExecutionError, AppToolHost } from "../tools/app-tool-host";
import { SkillRegistry, SkillSnapshotStore } from "./registry";
import { createSkillAppTools } from "./skill-tools";

let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;

beforeAll(async () => {
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
});

const RESEARCH = `---
name: research-notes
description: Research notes in the current folder
---
Use notes_search then read.
`;

const MANUAL = `---
name: private-notes
description: Manual only
disable-model-invocation: true
---
Secret instructions.
`;

async function createVault(files: Record<string, string>) {
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  for (const [path, content] of Object.entries(files)) {
    await vault.mkpath(path.replace(/\/[^/]+$/u, ""));
    await vault.create(path, content);
  }
  return vault;
}

describe("skill application tools", () => {
  it("reads snapshot skills and rejects misses, manual-only, traversal, and oversized resources", async () => {
    const vault = await createVault({
      ".agents/skills/research-notes/SKILL.md": RESEARCH,
      ".agents/skills/research-notes/references/notes.md": "safe",
      ".agents/skills/private-notes/SKILL.md": MANUAL,
    });
    const registry = new SkillRegistry({ vault });
    const snapshots = new SkillSnapshotStore();
    const snapshot = await registry.snapshot({ scopeDir: "" });
    snapshots.set("binding-1", snapshot);
    const tools = createSkillAppTools({ registry, snapshots, vault });
    const hostRegistry = new AppToolRegistry();
    for (const tool of tools) {
      hostRegistry.register({ pluginId: "ai", source: "core", provenance: "bundled" }, tool);
    }
    const host = new AppToolHost(
      hostRegistry,
      () => ({
        appToolsEnabled: true,
        disabledAppToolNames: [],
        enabledAppToolNames: [],
        enabledCommunityToolPluginIds: [],
      }),
    );
    host.createSession({
      conversationId: "c1",
      agentBindingId: "binding-1",
      scopeDir: "",
      runtimeSupportsAppTools: true,
    });

    const read = await host.invoke("binding-1", {
      runId: "r1",
      toolCallId: "r1",
      name: "skills_read",
      input: { name: "research-notes" },
    });
    expect(read.isError).toBeFalsy();
    expect(read.content[0]).toMatchObject({ text: expect.stringContaining("notes_search") });
    expect(JSON.stringify(read)).not.toContain("/.agents/skills/");

    const missing = await host.invoke("binding-1", {
      runId: "r2",
      toolCallId: "r2",
      name: "skills_read",
      input: { name: "missing" },
    });
    expect(missing.isError).toBe(true);

    const manual = await host.invoke("binding-1", {
      runId: "r3",
      toolCallId: "r3",
      name: "skills_read",
      input: { name: "private-notes" },
    });
    expect(manual.isError).toBe(true);

    const traversal = await host.invoke("binding-1", {
      runId: "r4",
      toolCallId: "r4",
      name: "skills_resource",
      input: { skill: "research-notes", path: "../escape.md" },
    });
    expect(traversal.isError).toBe(true);

    await vault.create(
      ".agents/skills/research-notes/references/huge.md",
      "x".repeat(65 * 1024),
    );
    const oversized = await host.invoke("binding-1", {
      runId: "r5",
      toolCallId: "r5",
      name: "skills_resource",
      input: { skill: "research-notes", path: "references/huge.md" },
    });
    expect(oversized.isError).toBe(true);
  });

  it("dispatches tool skills only through AppToolHost.invoke", async () => {
    const execute = vi.fn(async () => ({
      content: [{ type: "text" as const, text: "ok" }],
    }));
    const notesSearch: AppTool = {
      name: "notes_search",
      description: "Search notes",
      inputSchema: { type: "object" },
      effect: "read",
      execute,
    };
    const hostRegistry = new AppToolRegistry();
    hostRegistry.register(
      { pluginId: "search", source: "core", provenance: "bundled" },
      notesSearch,
    );
    const host = new AppToolHost(
      hostRegistry,
      () => ({
        appToolsEnabled: true,
        disabledAppToolNames: [],
        enabledAppToolNames: [],
        enabledCommunityToolPluginIds: [],
      }),
    );
    host.createSession({
      conversationId: "c1",
      agentBindingId: "binding-1",
      scopeDir: "",
      runtimeSupportsAppTools: true,
    });
    const invoke = vi.spyOn(host, "invoke");
    await host.invoke("binding-1", {
      runId: "t1",
      toolCallId: "t1",
      name: "notes_search",
      input: { command: "auth" },
    });
    expect(invoke).toHaveBeenCalled();
    expect(execute).toHaveBeenCalledTimes(1);

    host.closeBinding("binding-1");
    await expect(
      host.invoke("binding-1", {
        runId: "t2",
        toolCallId: "t2",
        name: "notes_search",
        input: { command: "auth" },
      }),
    ).rejects.toBeInstanceOf(AppToolExecutionError);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
