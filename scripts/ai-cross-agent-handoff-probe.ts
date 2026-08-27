#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  AcpAgentRuntime,
  buildConversationContextHandoff,
  DesktopAcpRuntimeBackend,
  type AgentBindingCreatedRecord,
  type AgentSession,
  type TranscriptEntry,
} from "@lapis-notes/ai/runtimes";
import {
  setNativeDesktopBridge,
  type NativeDesktopBridge,
} from "@lapis-notes/api/desktop-native";
import { createAgentRuntimeBridge } from "@lapismd/ai-host/client";
import { generateToken, serveAgentHost } from "@lapismd/ai-host";
import {
  AI_REAL_HOST_RELATIVE_ROOT,
  seedAiRealHostWorkspace,
} from "./lib/ai-real-host-fixture.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workspace = path.resolve(
  repoRoot,
  AI_REAL_HOST_RELATIVE_ROOT,
  "workspace",
);
const conversationId = "app-owned-cross-agent-handoff-probe";

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

async function consumeTurn(session: AgentSession): Promise<string> {
  let response = "";
  for await (const event of session.events()) {
    if (event.type === "text") response += event.text;
    if (event.type === "permission.request") {
      throw new Error("Handoff probe unexpectedly requested permission");
    }
    if (event.type === "question.request") {
      throw new Error("Handoff probe unexpectedly requested input");
    }
    if (event.type === "error") throw event.error;
    if (event.type === "completed") return response;
  }
  throw new Error("Agent event stream closed without completion");
}

async function runTurn(
  session: AgentSession,
  prompt: string,
  contextBlocks: NonNullable<
    Parameters<AgentSession["send"]>[1]
  >["contextBlocks"] = [],
): Promise<string> {
  const response = timeout(consumeTurn(session), "agent turn");
  await session.send(prompt, { contextBlocks });
  return response;
}

function message(
  id: string,
  role: "user" | "assistant",
  text: string,
  agentBindingId: string,
): TranscriptEntry {
  return {
    schemaVersion: 3,
    id,
    type: "message",
    role,
    text,
    createdAt: new Date().toISOString(),
    agentBindingId,
  };
}

function binding(
  id: string,
  agent: "codex" | "cursor",
  model: string | undefined,
  nativeSessionId: string,
): AgentBindingCreatedRecord {
  return {
    schemaVersion: 3,
    id,
    type: "binding.created",
    createdAt: new Date().toISOString(),
    runtime: "acp",
    agent,
    ...(model ? { model: { provider: agent, model } } : {}),
    thinking: "medium",
    nativeSessionId,
  };
}

async function run(): Promise<void> {
  await seedAiRealHostWorkspace(workspace, { defaultRuntime: "acp" });
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
  const runtime = new AcpAgentRuntime(new DesktopAcpRuntimeBackend());
  let codex: AgentSession | undefined;
  let cursor: AgentSession | undefined;
  let resumedCodex: AgentSession | undefined;
  try {
    const [codexCatalog, cursorCatalog] = await Promise.all([
      timeout(
        bridge.invoke<{ currentModel?: string; models?: string[] }>(
          "desktop_agent_acp_models",
          { agent: "codex" },
        ),
        "Codex model catalog",
        60_000,
      ),
      timeout(
        bridge.invoke<{ currentModel?: string; models?: string[] }>(
          "desktop_agent_acp_models",
          { agent: "cursor" },
        ),
        "Cursor model catalog",
        60_000,
      ),
    ]);
    const codexModel = codexCatalog.currentModel ?? codexCatalog.models?.[0];
    const cursorModel = cursorCatalog.currentModel ?? cursorCatalog.models?.[0];
    const alternateCodexModel = codexCatalog.models?.find(
      (model) => model !== codexModel,
    );
    if (!alternateCodexModel) {
      throw new Error("Codex catalog has no alternate model for configuration");
    }

    const evidenceA = `LAPIS_HANDOFF_A_${randomUUID().slice(0, 8)}`;
    const evidenceB = `LAPIS_HANDOFF_B_${randomUUID().slice(0, 8)}`;
    const codexBindingId = `binding-codex-${randomUUID()}`;
    const cursorBindingId = `binding-cursor-${randomUUID()}`;
    const transcript: TranscriptEntry[] = [];

    codex = await timeout(
      runtime.start({
        prompt: "",
        workspace,
        agent: "codex",
        ...(codexModel
          ? { model: { provider: "codex", model: codexModel } }
          : {}),
        thinking: "medium",
        mcpServers: [],
      }),
      "Codex session start",
      60_000,
    );
    const codexNativeSessionId = codex.id;
    const firstPrompt = `FIRST_CODEX_SOURCE_ENTRY. Remember the exact token ${evidenceA}. Reply with the token.`;
    transcript.push(
      message("codex-user-1", "user", firstPrompt, codexBindingId),
    );
    const firstResponse = await runTurn(codex, firstPrompt);
    if (!firstResponse.includes(evidenceA)) {
      throw new Error("Codex did not retain evidence token A");
    }
    const firstAssistant = message(
      "codex-assistant-1",
      "assistant",
      firstResponse,
      codexBindingId,
    );
    transcript.push(firstAssistant);
    const bindings: AgentBindingCreatedRecord[] = [
      binding(codexBindingId, "codex", codexModel, codex.id),
    ];

    if (!codex.detach) throw new Error("ACP session cannot detach for handoff");
    await codex.detach();
    const fullHandoff = await buildConversationContextHandoff(transcript, {
      conversationId,
      targetBindingId: cursorBindingId,
      bindings,
    });
    if (!fullHandoff || fullHandoff.mode !== "full") {
      throw new Error("Cursor did not receive a full first handoff");
    }
    cursor = await timeout(
      runtime.start({
        prompt: "",
        workspace,
        agent: "cursor",
        ...(cursorModel
          ? { model: { provider: "cursor", model: cursorModel } }
          : {}),
        thinking: "medium",
        mcpServers: [],
      }),
      "Cursor session start",
      60_000,
    );
    bindings.push(binding(cursorBindingId, "cursor", cursorModel, cursor.id));
    transcript.push({
      schemaVersion: 3,
      id: "switch-codex-cursor",
      type: "agent.switch",
      createdAt: new Date().toISOString(),
      agentBindingId: cursorBindingId,
      fromBindingId: codexBindingId,
      toBindingId: cursorBindingId,
      handoffId: fullHandoff.handoffId,
      handoffMode: fullHandoff.mode,
      handoffThroughEntryId: fullHandoff.throughEntryId,
      omittedEntryCount: fullHandoff.omittedEntryCount,
    });
    const cursorPrompt = `Recover the earlier exact token from Lapis evidence, then remember ${evidenceB}. Reply with both exact tokens and do not repeat source markers.`;
    transcript.push(
      message("cursor-user-1", "user", cursorPrompt, cursorBindingId),
    );
    const cursorResponse = await runTurn(cursor, cursorPrompt, [
      fullHandoff.block,
    ]);
    if (
      !cursorResponse.includes(evidenceA) ||
      !cursorResponse.includes(evidenceB)
    ) {
      throw new Error("Cursor did not receive token A and establish token B");
    }
    transcript.push(
      message(
        "cursor-assistant-1",
        "assistant",
        cursorResponse,
        cursorBindingId,
      ),
    );

    if (!cursor.detach) throw new Error("Cursor ACP session cannot detach");
    await cursor.detach();
    resumedCodex = await timeout(
      runtime.resume!(codexNativeSessionId, {
        workspace,
        agent: "codex",
        ...(codexModel
          ? { model: { provider: "codex", model: codexModel } }
          : {}),
        thinking: "medium",
        mcpServers: [],
      }),
      "Codex session resume",
      60_000,
    );
    if (resumedCodex.id !== codexNativeSessionId) {
      throw new Error("Codex resume changed the native session ID");
    }
    const deltaHandoff = await buildConversationContextHandoff(transcript, {
      conversationId,
      targetBindingId: codexBindingId,
      after: {
        entryId: firstAssistant.id,
        entryHash: fullHandoff.throughEntryHash,
      },
      bindings,
    });
    if (
      !deltaHandoff ||
      deltaHandoff.mode !== "delta" ||
      deltaHandoff.block.metadata.sourceFromEntryId !== "switch-codex-cursor"
    ) {
      throw new Error(
        "Codex switch-back did not receive only the Cursor delta",
      );
    }
    transcript.push({
      schemaVersion: 3,
      id: "switch-cursor-codex",
      type: "agent.switch",
      createdAt: new Date().toISOString(),
      agentBindingId: codexBindingId,
      fromBindingId: cursorBindingId,
      toBindingId: codexBindingId,
      handoffId: deltaHandoff.handoffId,
      handoffMode: deltaHandoff.mode,
      handoffThroughEntryId: deltaHandoff.throughEntryId,
      omittedEntryCount: deltaHandoff.omittedEntryCount,
    });
    const returnPrompt = "Reply with both exact evidence tokens.";
    transcript.push(
      message("codex-user-2", "user", returnPrompt, codexBindingId),
    );
    const returnResponse = await runTurn(resumedCodex, returnPrompt, [
      deltaHandoff.block,
    ]);
    if (
      !returnResponse.includes(evidenceA) ||
      !returnResponse.includes(evidenceB)
    ) {
      throw new Error("Resumed Codex did not retain A and receive B");
    }
    transcript.push(
      message("codex-assistant-2", "assistant", returnResponse, codexBindingId),
    );

    const configured = await resumedCodex.configure?.({
      model: { provider: "codex", model: alternateCodexModel },
    });
    if (configured?.model?.status !== "applied") {
      throw new Error(
        `Codex model configuration was ${configured?.model?.status ?? "unavailable"}`,
      );
    }
    if (resumedCodex.id !== codexNativeSessionId) {
      throw new Error("Codex model change replaced the native session");
    }
    transcript.push({
      schemaVersion: 3,
      id: "codex-config-1",
      type: "agent.config",
      createdAt: new Date().toISOString(),
      agentBindingId: codexBindingId,
      model: { provider: "codex", model: alternateCodexModel },
    });

    const serialized = JSON.stringify(transcript);
    if (
      serialized.includes("<lapis-handoff-evidence>") ||
      serialized.includes('"kind":"conversation-handoff"')
    ) {
      throw new Error("Synthetic handoff context polluted the transcript");
    }
    console.log(
      `[ai-handoff-probe] succeeded codex=${codexNativeSessionId} cursor=${cursor.id} model=${codexModel ?? "default"}->${alternateCodexModel}`,
    );
  } finally {
    await resumedCodex?.close().catch(() => undefined);
    await cursor?.close().catch(() => undefined);
    await codex?.close().catch(() => undefined);
    setNativeDesktopBridge(null);
    bridge.dispose();
    await host.close();
  }
}

void run().catch((error) => {
  console.error(
    `[ai-handoff-probe] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
