#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import {
  setNativeDesktopBridge,
  type NativeDesktopBridge,
} from "@lapis-notes/api/desktop-native";
import {
  AcpAgentRuntime,
  CodexNativeRuntime,
  createAgentProcessHost,
  DesktopAcpRuntimeBackend,
} from "@lapis-notes/ai/runtimes";
import type {
  AgentRuntime,
  AgentSession,
} from "@lapis-notes/ai";
import { createAgentRuntimeBridge } from "@lapis-notes/ai-host/client";
import { generateToken, serveAgentHost } from "@lapis-notes/ai-host";
import {
  AI_REAL_HOST_RELATIVE_ROOT,
  seedAiRealHostWorkspace,
} from "./lib/ai-real-host-fixture.mjs";

type ProbeLane = "codex-acp" | "cursor-acp" | "codex-native";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(
  repoRoot,
  AI_REAL_HOST_RELATIVE_ROOT,
  "workspace",
);
const expectedToken = "lapis-smoke-ready";

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
  const fixturePath = path.join(workspace, "src/fixture.ts");
  const originalFixture = await readFile(fixturePath, "utf8");
  try {
    const agent = lane === "cursor-acp" ? "cursor" : "codex";
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
    const runtime = await createRuntime(lane);
    console.log(`[ai-probe] ${lane}: starting session`);
    session = await timeout(
      runtime.start({
        prompt: "",
        workspace,
        agent,
        thinking: "medium",
      }),
      `${lane} session start`,
      60_000,
    );
    console.log(`[ai-probe] ${lane}: sending fixture read`);
    const resultPromise = timeout(consumeTurn(session), `${lane} turn`);
    await session.send(
      "Use an available tool to read Notes/Agent Smoke.md. Return only its expected answer token. Do not inspect files outside this workspace.",
    );
    const result = await resultPromise;
    if (!result.response.includes(expectedToken)) {
      throw new Error(
        `${lane} completed without the expected token; response was ${JSON.stringify(result.response.slice(0, 240))}`,
      );
    }
    console.log(`[ai-probe] ${lane}: requesting a permissioned write`);
    const writeResultPromise = timeout(consumeTurn(session), `${lane} write`);
    await session.send(
      "Change only src/fixture.ts so smokeValue is 42. Use the editing tool, then reply with lapis-write-complete. Do not inspect or edit anything outside this workspace.",
    );
    const writeResult = await writeResultPromise;
    const writtenFixture = await readFile(fixturePath, "utf8");
    if (!writtenFixture.includes("smokeValue = 42")) {
      throw new Error(`${lane} reported completion without writing smokeValue 42`);
    }
    if (!writeResult.response.includes("lapis-write-complete")) {
      throw new Error(`${lane} write response omitted lapis-write-complete`);
    }
    if (lane === "codex-native" && writeResult.approvals < 1) {
      throw new Error(`${lane} write completed without a permission request`);
    }
    let questionResult:
      | Awaited<ReturnType<typeof consumeTurn>>
      | undefined;
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
      } else if (
        !questionResult.response.includes("lapis-question-complete")
      ) {
        throw new Error(`${lane} question response did not complete`);
      }
    }
    console.log(`[ai-probe] ${lane} succeeded`);
    console.log(
      `[ai-probe] models=${catalog.models?.length ?? 0} current=${catalog.currentModel ?? "agent-default"}`,
    );
    console.log(
      `[ai-probe] read-events=${[...new Set(result.eventTypes)].join(",")} tools=${[...new Set(result.toolNames)].join(",") || "none"} thinking=${result.thinking} usage=${result.usage}`,
    );
    console.log(
      `[ai-probe] write-events=${[...new Set(writeResult.eventTypes)].join(",")} approvals=${writeResult.approvals} tools=${[...new Set(writeResult.toolNames)].join(",") || "none"}`,
    );
    if (questionResult) {
      console.log(
        `[ai-probe] question-events=${[...new Set(questionResult.eventTypes)].join(",")} questions=${questionResult.questions} mode=${questionResult.questions > 0 ? "structured" : "default-mode-fallback"}`,
      );
    }
  } finally {
    await writeFile(fixturePath, originalFixture, "utf8");
    await session?.close().catch(() => undefined);
    setNativeDesktopBridge(null);
    bridge.dispose();
    await host.close();
  }
}

void run().catch((error) => {
  console.error(`[ai-probe] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
