import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  AppToolRegistry,
  type AppTool,
} from "@lapis-notes/api/agent-tools";
import { FakeAgentRuntime } from "../runtimes/fake/fake-runtime";
import { ConversationRepository } from "../conversations/conversation-repository";
import { MemoryTranscriptStore } from "../conversations/memory-transcript-store";
import { SkillRegistry, SkillSnapshotStore } from "../skills/registry";
import { SlashCommandCatalog } from "../commands/catalog";
import { SlashCommandRouter } from "../commands/router";
import { AppToolHost } from "../tools/app-tool-host";
import { createSkillAppTools } from "../skills/skill-tools";
import { AiChatController } from "./chat-controller.svelte";

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

const FIND = `---
name: find-notes
description: Find notes
command-dispatch: tool
command-tool: notes_search
---
Unused body.
`;

async function createSkillController(
  files: Record<string, string>,
  options: {
    native?: boolean;
    tool?: AppTool;
    onComposerDefaults?: (next: {
      agent: string;
      runtimePreference: string;
    }) => void;
  } = {},
) {
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  for (const [path, content] of Object.entries(files)) {
    await vault.mkpath(path.replace(/\/[^/]+$/u, ""));
    await vault.create(path, content);
  }
  const skills = new SkillRegistry({ vault });
  const skillSnapshots = new SkillSnapshotStore();
  const catalog = new SlashCommandCatalog();
  const slashRouter = new SlashCommandRouter(catalog, skills);
  const toolRegistry = new AppToolRegistry();
  if (options.tool) {
    toolRegistry.register(
      { pluginId: "search", source: "core", provenance: "bundled" },
      options.tool,
    );
  }
  for (const tool of createSkillAppTools({
    registry: skills,
    snapshots: skillSnapshots,
    vault,
  })) {
    toolRegistry.register(
      { pluginId: "ai", source: "core", provenance: "bundled" },
      tool,
    );
  }
  const appToolHost = new AppToolHost(toolRegistry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  const runtime = new FakeAgentRuntime({
    nativeCommands: options.native
      ? [{ name: "compact", description: "Compact the thread" }]
      : [],
  });
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const controller = new AiChatController(runtime, null, [], {
    repository,
    createConversation: () => ({
      id: "123e4567-e89b-42d3-a456-426614174000",
      scopeDir: "Projects",
    }),
    skills,
    skillSnapshots,
    slashRouter,
    appToolHost,
    skillContext: () => ({
      scopeDir: "Projects",
      availableToolNames: ["notes_search"],
    }),
    request: { agent: "codex", metadata: { runtime: "acp" } },
    onComposerDefaults: options.onComposerDefaults,
  });
  return { controller, runtime, repository, skills, skillSnapshots, appToolHost };
}

describe("AiChatController skills and slash commands", () => {
  it("A: records a compact skill manifest and reads the skill through AppToolHost", async () => {
    const { controller, runtime, skillSnapshots, appToolHost } =
      await createSkillController({
        "Projects/.lapis/skills/research-notes/SKILL.md": RESEARCH,
      });
    await controller.submit("hello");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(runtime.lastRequest?.skillSnapshot?.skills[0]?.name).toBe(
      "research-notes",
    );
    expect(String(runtime.lastRequest?.metadata?.availableSkillsManifest)).toContain(
      "<name>research-notes</name>",
    );
    expect(String(runtime.lastRequest?.metadata?.availableSkillsManifest)).not.toContain(
      "Projects/.lapis/skills",
    );
    const bindingId = controller.activeBindingId!;
    const snapshot = skillSnapshots.get(bindingId);
    expect(snapshot).toBeTruthy();
    if (!appToolHost.getSession(bindingId)) {
      appToolHost.createSession({
        conversationId: controller.location!.conversationId,
        agentBindingId: bindingId,
        scopeDir: "Projects",
        runtimeSupportsAppTools: true,
      });
    }
    const result = await appToolHost.invoke(bindingId, {
      runId: "read-1",
      toolCallId: "read-1",
      name: "skills_read",
      input: { name: "research-notes" },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toMatchObject({
      text: expect.stringContaining("notes_search"),
    });
    await controller.close();
  });

  it("B: /research-notes authentication activates the skill and sends one Fake turn", async () => {
    const { controller, runtime, repository } = await createSkillController({
      "Projects/.lapis/skills/research-notes/SKILL.md": RESEARCH,
    });
    await controller.submit("/research-notes authentication");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(runtime.lastRequest?.skillActivations?.[0]).toMatchObject({
      skillName: "research-notes",
      arguments: "authentication",
      instructions: expect.stringContaining("notes_search"),
    });
    expect(runtime.sessions[0]?.prompts).toEqual(["authentication"]);
    expect(controller.items.some((item) => item.type === "skill-activation")).toBe(
      true,
    );
    const snapshot = await repository.read(controller.location!);
    const activation = snapshot.transcript.find(
      (entry) => entry.type === "skill-activation",
    );
    expect(activation).toMatchObject({
      skillName: "research-notes",
      arguments: "authentication",
    });
    expect(JSON.stringify(activation)).not.toContain("Use notes_search");
    await controller.close();
  });

  it("C: /skills is a host action and does not send to the session after the catalog is ready", async () => {
    const { controller, runtime } = await createSkillController({
      "Projects/.lapis/skills/research-notes/SKILL.md": RESEARCH,
    });
    await controller.submit("/skills");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(runtime.sessions[0]?.prompts ?? []).toEqual([]);
    expect(controller.items.some((item) => item.type === "status")).toBe(true);
    await controller.close();
  });

  it("D: reserved app commands survive a binding switch and the new binding gets a new snapshot", async () => {
    const { controller, runtime, skillSnapshots } = await createSkillController({
      "Projects/.lapis/skills/research-notes/SKILL.md": RESEARCH,
    });
    await controller.submit("first", {
      agent: "codex",
      model: { provider: "codex", model: "first" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const firstBinding = controller.activeBindingId!;
    const firstSnapshot = skillSnapshots.get(firstBinding);
    await controller.submit("second", {
      agent: "codex",
      model: { provider: "codex", model: "second" },
    });
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const secondBinding = controller.activeBindingId!;
    expect(secondBinding).not.toBe(firstBinding);
    expect(skillSnapshots.get(firstBinding)?.id).toBe(firstSnapshot?.id);
    expect(skillSnapshots.get(secondBinding)?.id).not.toBe(firstSnapshot?.id);
    expect(runtime.sessions).toHaveLength(2);
    await controller.submit("/skills");
    expect(controller.error).toBeNull();
    await controller.close();
  });

  it("refreshes skills onto a replacement binding and keeps the prior snapshot", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await vault.mkpath("Projects/.lapis/skills/research-notes");
    await vault.create(
      "Projects/.lapis/skills/research-notes/SKILL.md",
      RESEARCH,
    );
    const skills = new SkillRegistry({ vault });
    const skillSnapshots = new SkillSnapshotStore();
    const slashRouter = new SlashCommandRouter(
      new SlashCommandCatalog(),
      skills,
    );
    const runtime = new FakeAgentRuntime();
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const controller = new AiChatController(runtime, null, [], {
      repository,
      createConversation: () => ({
        id: "123e4567-e89b-42d3-a456-426614174000",
        scopeDir: "Projects",
      }),
      skills,
      skillSnapshots,
      slashRouter,
      skillContext: () => ({ scopeDir: "Projects" }),
    });
    await controller.submit("start");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const firstBinding = controller.activeBindingId!;
    const firstVersion = skillSnapshots.get(firstBinding)?.skills[0]?.version;
    const file = vault.getFileByPath(
      "Projects/.lapis/skills/research-notes/SKILL.md",
    );
    await vault.modify(file!, `${RESEARCH}\nUpdated.`);
    await controller.refreshSkills();
    const secondBinding = controller.activeBindingId!;
    expect(secondBinding).not.toBe(firstBinding);
    expect(skillSnapshots.get(firstBinding)?.skills[0]?.version).toBe(
      firstVersion,
    );
    expect(skillSnapshots.get(secondBinding)?.skills[0]?.version).not.toBe(
      firstVersion,
    );
    await controller.close();
  });

  it("invokes tool-dispatch skills through AppToolHost and keeps unknown commands local", async () => {
    const execute = vi.fn(async () => ({
      content: [{ type: "text" as const, text: "hits" }],
    }));
    const { controller, runtime, appToolHost } = await createSkillController(
      {
        "Projects/.lapis/skills/find-notes/SKILL.md": FIND,
      },
      {
        tool: {
          name: "notes_search",
          description: "Search",
          inputSchema: { type: "object" },
          effect: "read",
          execute,
        },
      },
    );
    const invoke = vi.spyOn(appToolHost, "invoke");
    await controller.submit("/find-notes authentication");
    expect(invoke).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: "notes_search",
        input: expect.objectContaining({ command: "authentication" }),
      }),
    );
    expect(execute).toHaveBeenCalledTimes(1);
    expect(runtime.sessions.at(-1)?.prompts ?? []).toEqual([]);
    await controller.submit("/nope");
    expect(controller.error).toMatch(/Unknown command/u);
    expect(runtime.lastRequest?.prompt ?? "").not.toContain("/nope");
    await controller.close();
  });

  it("keeps native collisions reachable through /native", async () => {
    const { controller, runtime } = await createSkillController(
      {
        "Projects/.lapis/skills/research-notes/SKILL.md": RESEARCH,
      },
      { native: true },
    );
    await controller.submit("hello");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    await controller.submit("/native compact now");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(runtime.sessions.at(-1)?.prompts).toContain("/compact now");
    await controller.close();
  });

  it("reports, switches, and rejects /agent names", async () => {
    const defaults: Array<{ agent: string; runtimePreference: string }> = [];
    const { controller, runtime } = await createSkillController(
      {
        "Projects/.lapis/skills/research-notes/SKILL.md": RESEARCH,
      },
      {
        onComposerDefaults: (next) => defaults.push(next),
      },
    );
    await controller.submit("/agent");
    expect(
      controller.items.some(
        (item) => item.type === "status" && item.text === "Codex ACP",
      ),
    ).toBe(true);
    expect(runtime.sessions[0]?.prompts ?? []).toEqual([]);
    await controller.submit("/agent cursor");
    expect(defaults).toEqual([
      { agent: "cursor", runtimePreference: "acp" },
    ]);
    expect(controller.request.agent).toBe("cursor");
    expect(
      controller.items.some(
        (item) => item.type === "status" && item.text === "Agent: Cursor ACP",
      ),
    ).toBe(true);
    await controller.submit("/agent nope");
    expect(controller.error).toMatch(/Unknown agent/u);
    expect(runtime.lastRequest?.prompt ?? "").not.toContain("/agent nope");
    await controller.close();
  });
});
