#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import {
  setNativeDesktopBridge,
  type NativeDesktopBridge,
} from "@lapis-notes/api/desktop-native";
import { MemoryVaultAdapter, Vault } from "@lapis-notes/api/vault";
import {
  AcpAgentRuntime,
  AppToolHost,
  CodexNativeRuntime,
  createAgentProcessHost,
  DesktopAcpRuntimeBackend,
  DesktopAppToolBridge,
} from "@lapis-notes/ai/runtimes";
import type { AgentRuntime, AgentSession } from "@lapis-notes/ai";
import { createAgentRuntimeBridge } from "@lapis-notes/ai-host/client";
import { generateToken, serveAgentHost } from "@lapis-notes/ai-host";
import { createMarkdownNoteTools } from "@lapis-notes/markdown/agent-tools";
import { createNotesSearchTool } from "@lapis-notes/search/agent-tools";
import type { SearchQueryParams, SearchQueryResult } from "@lapis-notes/search";
import {
  AI_REAL_HOST_RELATIVE_ROOT,
  seedAiRealHostWorkspace,
} from "./lib/ai-real-host-fixture.mjs";

type ProbeLane = "codex-acp" | "cursor-acp" | "codex-native";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workspace = path.resolve(
  repoRoot,
  AI_REAL_HOST_RELATIVE_ROOT,
  "workspace",
);
const expectedToken = "lapis-smoke-ready";
const patchedToken = "lapis-smoke-patched";
const requiredAppTools = [
  "notes_list",
  "notes_patch",
  "notes_read",
  "notes_search",
];

function laneFromArgs(): ProbeLane {
  const lane = process.argv[2];
  if (
    lane !== "codex-acp" &&
    lane !== "cursor-acp" &&
    lane !== "codex-native"
  ) {
    throw new Error(
      "Probe lane must be codex-acp, cursor-acp, or codex-native",
    );
  }
  return lane;
}

function timeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = 120_000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out`)),
      timeoutMs,
    );
    void promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function consumeTurn(session: AgentSession) {
  const eventTypes: string[] = [];
  const toolNames: string[] = [];
  let response = "";
  let thinking = false;
  let approvals = 0;
  let questions = 0;
  let usage = false;
  for await (const event of session.events()) {
    eventTypes.push(event.type);
    if (event.type === "text") response += event.text;
    if (event.type === "thinking") thinking = true;
    if (event.type === "usage") usage = true;
    if (event.type === "tool.start") toolNames.push(event.name);
    if (event.type === "permission.request") {
      approvals += 1;
      const allowOnce =
        event.request.options.find((option) => option.kind === "allow-once") ??
        event.request.options[0];
      if (!allowOnce) throw new Error("Permission request has no safe option");
      await session.respondToApproval(event.request.id, allowOnce.id);
    }
    if (event.type === "question.request") {
      questions += 1;
      if (!session.respondToQuestion) {
        throw new Error("Runtime requested input without a response contract");
      }
      await session.respondToQuestion(
        event.request.id,
        Object.fromEntries(
          event.request.questions.map((question) => [
            question.id,
            [question.options?.[0]?.label ?? "Continue"],
          ]),
        ),
      );
    }
    if (event.type === "error") throw event.error;
    if (event.type === "completed") {
      return {
        response,
        eventTypes,
        toolNames,
        thinking,
        approvals,
        questions,
        usage,
      };
    }
  }
  throw new Error("Agent event stream closed without completion");
}

async function createRuntime(lane: ProbeLane): Promise<AgentRuntime> {
  if (lane === "codex-native") {
    return new CodexNativeRuntime(createAgentProcessHost());
  }
  return new AcpAgentRuntime(new DesktopAcpRuntimeBackend());
}

function agentForLane(lane: ProbeLane): "codex" | "cursor" {
  return lane === "cursor-acp" ? "cursor" : "codex";
}

function switchedLane(lane: ProbeLane): ProbeLane {
  if (lane === "codex-acp") return "cursor-acp";
  if (lane === "cursor-acp") return "codex-native";
  return "codex-acp";
}

async function createAppToolHarness(noteContent: string) {
  const vault = new Vault(
    new MemoryVaultAdapter(
      {
        "Notes/Agent Smoke.md": noteContent,
        "Notes/Bridge Search.md": [
          "# Bridge Search",
          "",
          "bridge-search-token confirms the scoped application search tool.",
        ].join("\n"),
        "Outside/Private.md": "bridge-search-token must remain out of scope.",
      },
      { name: "Lapis app-tool probe", vaultId: "lapis-app-tool-probe" },
    ),
  );
  await vault.load();
  const database = new MemoryAppDatabase("lapis-app-tool-probe");
  await database.open();
  for (const file of vault.getFiles()) {
    if (file.extension !== "md") continue;
    const content = await vault.read(file);
    await database.upsertSearchDocument({
      path: file.path,
      sourceProviderId: "search:markdown",
      name: file.basename,
      extension: file.extension,
      checksum: `probe:${file.path}`,
      content,
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    });
  }

  const searchSource: {
    query(params: SearchQueryParams): Promise<SearchQueryResult>;
  } = {
    async query(params) {
      const results = await database.searchDocuments(params.term, {
        limit: params.limit,
        pathPrefix: params.pathPrefix,
        sourceProviderIds: params.sourceProviderIds,
        snippetLength: params.snippetLength,
        caseSensitive: params.caseSensitive,
        mode: params.mode,
        includeDiagnostics: true,
      });
      return {
        count: results.length,
        hits: results.map((result) => ({
          id: result.document.path,
          ...result,
        })),
      };
    },
  };
  const search = createNotesSearchTool(searchSource);
  const registry = new AppToolRegistry();
  const owner = {
    pluginId: "probe-bundled-notes",
    source: "core" as const,
    provenance: "bundled" as const,
  };
  const registrations = [search, ...createMarkdownNoteTools(vault)].map(
    (tool) => registry.register(owner, tool),
  );
  const host = new AppToolHost(registry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  const bridge = new DesktopAppToolBridge(host);
  const toolNames = new Map<string, string[]>();
  const approvals = new Map<string, number>();
  const unsubscribe = bridge.subscribe(({ bindingId, event }) => {
    if (event.type === "tool.start") {
      const names = toolNames.get(bindingId) ?? [];
      names.push(event.name);
      toolNames.set(bindingId, names);
    }
    if (event.type === "permission.request") {
      approvals.set(bindingId, (approvals.get(bindingId) ?? 0) + 1);
      if (!bridge.respondToApproval(event.request.id, "allow-once")) {
        throw new Error(
          `Could not approve app tool request ${event.request.id}`,
        );
      }
    }
  });
  return {
    vault,
    bridge,
    toolNames,
    approvals,
    async close() {
      unsubscribe();
      await bridge.close();
      host.close();
      for (const registration of registrations.reverse())
        registration.dispose();
      await database.close();
    },
  };
}

async function startProbedSession(
  lane: ProbeLane,
  bridge: DesktopAppToolBridge,
  bindingId: string,
): Promise<{ session: AgentSession; descriptorTools: string[] }> {
  const descriptor = await bridge.prepare({
    conversationId: "app-tool-real-agent-probe",
    agentBindingId: bindingId,
    scopeDir: "Notes",
    launchNotePath: "Notes/Agent Smoke.md",
    runtimeSupportsAppTools: true,
  });
  if (descriptor.status !== "available" || !descriptor.bridgeId) {
    throw new Error(
      `${lane} app-tool bridge unavailable: ${descriptor.unavailableReason ?? descriptor.status ?? "unknown"}`,
    );
  }
  const descriptorTools = descriptor.tools.map((tool) => tool.name).sort();
  if (JSON.stringify(descriptorTools) !== JSON.stringify(requiredAppTools)) {
    throw new Error(
      `${lane} received unexpected application tools: ${descriptorTools.join(",")}`,
    );
  }
  const runtime = await createRuntime(lane);
  try {
    const session = await timeout(
      runtime.start({
        prompt: "",
        workspace,
        agent: agentForLane(lane),
        thinking: "medium",
        appToolSession: descriptor,
      }),
      `${lane} session start`,
      60_000,
    );
    return { session, descriptorTools };
  } catch (error) {
    await bridge.closeBinding(bindingId);
    throw error;
  }
}

async function run(): Promise<void> {
  const lane = laneFromArgs();
  await seedAiRealHostWorkspace(workspace, {
    defaultRuntime: lane === "codex-native" ? "codex-native" : "acp",
  });
  const token = generateToken();
  const host = await serveAgentHost(
    {
      port: 0,
      bind: "127.0.0.1",
      workspace,
      token,
      origins: [],
    },
    { print: () => {} },
  );
  const bridge = createAgentRuntimeBridge({ url: host.url, token });
  setNativeDesktopBridge(bridge as unknown as NativeDesktopBridge);
  let session: AgentSession | undefined;
  let switchedSession: AgentSession | undefined;
  let appTools: Awaited<ReturnType<typeof createAppToolHarness>> | undefined;
  let bindingId: string | undefined;
  let switchedBindingId: string | undefined;
  const fixturePath = path.join(workspace, "src/fixture.ts");
  const notePath = path.join(workspace, "Notes/Agent Smoke.md");
  const originalFixture = await readFile(fixturePath, "utf8");
  try {
    appTools = await createAppToolHarness(await readFile(notePath, "utf8"));
    const agent = agentForLane(lane);
    console.log(`[ai-probe] ${lane}: discovering ${agent} models`);
    const catalog = await timeout(
      bridge.invoke<{ currentModel?: string; models?: string[] }>(
        "desktop_agent_acp_models",
        { agent },
      ),
      `${agent} model catalog`,
      60_000,
    );
    console.log(
      `[ai-probe] ${lane}: model catalog ready (${catalog.models?.length ?? 0})`,
    );
    bindingId = randomUUID();
    console.log(`[ai-probe] ${lane}: starting app-tool binding ${bindingId}`);
    ({ session } = await startProbedSession(lane, appTools.bridge, bindingId));

    console.log(`[ai-probe] ${lane}: calling notes_search`);
    const searchResultPromise = timeout(
      consumeTurn(session),
      `${lane} notes_search`,
    );
    await session.send(
      "Call the lapis-tools notes_search tool with query bridge-search-token and limit 5. Confirm the result is under Notes, then reply with lapis-search-complete. Do not use shell or filesystem tools.",
    );
    const searchResult = await searchResultPromise;
    if (!searchResult.response.includes("lapis-search-complete")) {
      throw new Error(`${lane} notes_search response did not complete`);
    }

    console.log(`[ai-probe] ${lane}: calling notes_read`);
    const readResultPromise = timeout(
      consumeTurn(session),
      `${lane} notes_read`,
    );
    await session.send(
      "Call the lapis-tools notes_read tool for Notes/Agent Smoke.md. Return only its expected answer token. Do not use shell or filesystem tools.",
    );
    const readResult = await readResultPromise;
    if (!readResult.response.includes(expectedToken)) {
      throw new Error(
        `${lane} notes_read omitted the expected token; response was ${JSON.stringify(readResult.response.slice(0, 240))}`,
      );
    }

    console.log(`[ai-probe] ${lane}: approving notes_patch once`);
    const patchResultPromise = timeout(
      consumeTurn(session),
      `${lane} notes_patch`,
    );
    await session.send(
      `Call the lapis-tools notes_patch tool for Notes/Agent Smoke.md, replacing exactly ${expectedToken} with ${patchedToken}. After it succeeds reply with lapis-patch-complete. Do not use shell or filesystem tools.`,
    );
    const patchResult = await patchResultPromise;
    if (!patchResult.response.includes("lapis-patch-complete")) {
      throw new Error(`${lane} notes_patch response did not complete`);
    }
    const patchedNote = await appTools.vault.adapter.read(
      "Notes/Agent Smoke.md",
    );
    if (!patchedNote.includes(patchedToken)) {
      throw new Error(
        `${lane} reported notes_patch success without changing the note`,
      );
    }
    if ((appTools.approvals.get(bindingId) ?? 0) !== 1) {
      throw new Error(
        `${lane} notes_patch did not require exactly one app approval`,
      );
    }
    const firstBindingCalls = appTools.toolNames.get(bindingId) ?? [];
    for (const name of ["notes_search", "notes_read", "notes_patch"]) {
      if (!firstBindingCalls.includes(name)) {
        throw new Error(`${lane} did not invoke ${name} through lapis-tools`);
      }
    }

    console.log(`[ai-probe] ${lane}: requesting a permissioned write`);
    const writeResultPromise = timeout(consumeTurn(session), `${lane} write`);
    await session.send(
      "Change only src/fixture.ts so smokeValue is 42. Use the editing tool, then reply with lapis-write-complete. Do not inspect or edit anything outside this workspace.",
    );
    const writeResult = await writeResultPromise;
    const writtenFixture = await readFile(fixturePath, "utf8");
    if (!writtenFixture.includes("smokeValue = 42")) {
      throw new Error(
        `${lane} reported completion without writing smokeValue 42`,
      );
    }
    if (!writeResult.response.includes("lapis-write-complete")) {
      throw new Error(`${lane} write response omitted lapis-write-complete`);
    }
    if (lane === "codex-native" && writeResult.approvals < 1) {
      throw new Error(`${lane} write completed without a permission request`);
    }
    let questionResult: Awaited<ReturnType<typeof consumeTurn>> | undefined;
    if (lane === "codex-native") {
      console.log(`[ai-probe] ${lane}: requesting structured user input`);
      const questionResultPromise = timeout(
        consumeTurn(session),
        `${lane} question`,
      );
      await session.send(
        "Before answering, call request_user_input to ask me to choose Alpha or Beta. After receiving the choice, reply with lapis-question-complete.",
      );
      questionResult = await questionResultPromise;
      if (questionResult.questions < 1) {
        const unavailableInDefaultMode =
          questionResult.response.includes("Alpha or Beta");
        if (!unavailableInDefaultMode) {
          throw new Error(
            `${lane} neither emitted a structured question nor degraded it to ordinary Default-mode text; events=${[...new Set(questionResult.eventTypes)].join(",")} response=${JSON.stringify(questionResult.response.slice(0, 240))}`,
          );
        }
        console.log(
          `[ai-probe] ${lane}: request_user_input is unavailable in Codex Default mode (expected provider capability)`,
        );
      } else if (!questionResult.response.includes("lapis-question-complete")) {
        throw new Error(`${lane} question response did not complete`);
      }
    }

    const nextLane = switchedLane(lane);
    console.log(`[ai-probe] ${lane}: switching to ${nextLane}`);
    await session.close();
    session = undefined;
    await appTools.bridge.closeBinding(bindingId);
    switchedBindingId = randomUUID();
    const switched = await startProbedSession(
      nextLane,
      appTools.bridge,
      switchedBindingId,
    );
    switchedSession = switched.session;
    if (
      JSON.stringify(switched.descriptorTools) !==
      JSON.stringify(requiredAppTools)
    ) {
      throw new Error(`${nextLane} did not receive the same app-tool snapshot`);
    }
    const switchResultPromise = timeout(
      consumeTurn(switchedSession),
      `${nextLane} switched binding`,
    );
    await switchedSession.send(
      `Call lapis-tools notes_list for Notes, then notes_read for Notes/Agent Smoke.md. Reply with ${patchedToken} and lapis-switch-complete. Do not use shell or filesystem tools.`,
    );
    const switchResult = await switchResultPromise;
    if (
      !switchResult.response.includes(patchedToken) ||
      !switchResult.response.includes("lapis-switch-complete")
    ) {
      throw new Error(
        `${nextLane} did not verify the switched binding note state`,
      );
    }
    const switchedCalls = appTools.toolNames.get(switchedBindingId) ?? [];
    for (const name of ["notes_list", "notes_read"]) {
      if (!switchedCalls.includes(name)) {
        throw new Error(`${nextLane} switched binding did not invoke ${name}`);
      }
    }

    console.log(`[ai-probe] ${lane} succeeded`);
    console.log(
      `[ai-probe] models=${catalog.models?.length ?? 0} current=${catalog.currentModel ?? "agent-default"}`,
    );
    console.log(
      `[ai-probe] app-tools=${[...new Set(firstBindingCalls)].join(",")} approvals=${appTools.approvals.get(bindingId) ?? 0}`,
    );
    console.log(
      `[ai-probe] read-events=${[...new Set(readResult.eventTypes)].join(",")} runtime-tools=${[...new Set(readResult.toolNames)].join(",") || "none"} thinking=${readResult.thinking} usage=${readResult.usage}`,
    );
    console.log(
      `[ai-probe] write-events=${[...new Set(writeResult.eventTypes)].join(",")} approvals=${writeResult.approvals} tools=${[...new Set(writeResult.toolNames)].join(",") || "none"}`,
    );
    if (questionResult) {
      console.log(
        `[ai-probe] question-events=${[...new Set(questionResult.eventTypes)].join(",")} questions=${questionResult.questions} mode=${questionResult.questions > 0 ? "structured" : "default-mode-fallback"}`,
      );
    }
    console.log(
      `[ai-probe] switch=${lane}->${nextLane} binding=${switchedBindingId} tools=${[...new Set(switchedCalls)].join(",")}`,
    );
  } finally {
    await writeFile(fixturePath, originalFixture, "utf8");
    await switchedSession?.close().catch(() => undefined);
    await session?.close().catch(() => undefined);
    if (appTools && switchedBindingId) {
      await appTools.bridge
        .closeBinding(switchedBindingId)
        .catch(() => undefined);
    }
    if (appTools && bindingId) {
      await appTools.bridge.closeBinding(bindingId).catch(() => undefined);
    }
    await appTools?.close().catch(() => undefined);
    setNativeDesktopBridge(null);
    bridge.dispose();
    await host.close();
  }
}

void run().catch((error) => {
  console.error(
    `[ai-probe] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
