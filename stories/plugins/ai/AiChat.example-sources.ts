export const aiChatExampleSource = `import { AiChatPanel, FakeAgentRuntime } from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();

<AiChatPanel runtime={runtime} />
`;

export const aiChatValidationExampleSource = `import { AiChatPanel, FakeAgentRuntime } from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();

<AiChatPanel
  runtime={runtime}
  modelCatalogError="Agent runtime socket closed unexpectedly."
/>
`;

export const aiChatApprovalExampleSource = `import { AiChatPanel, FakeAgentRuntime } from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime({ requireApproval: true });

<AiChatPanel runtime={runtime} />
`;

export const aiChatQuestionExampleSource = `import { AiChatPanel, FakeAgentRuntime } from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime({ requireQuestion: true });

<AiChatPanel runtime={runtime} />
`;

export function createAiChatToolSeedItems(
  state: "running" | "completed" | "error",
) {
  return [
    {
      id: `tool-${state}`,
      type: "tool" as const,
      toolId: `tool-${state}`,
      name: "shell.execute",
      server: "local workspace",
      state,
      input: "pnpm --filter @lapis-notes/ai test",
      ...(state === "completed"
        ? { output: "121 tests passed" }
        : state === "error"
          ? { output: "Process exited with code 1\nFAIL ai-chat-panel.test.ts" }
          : {}),
      createdAt: "2026-03-16T09:00:00.000Z",
    },
  ];
}

export function aiChatToolStateExampleSource(
  state: "running" | "completed" | "error",
): string {
  const items = createAiChatToolSeedItems(state);
  return `import {
  AiChatPanel,
  FakeAgentRuntime,
  createMemorySessionStore,
} from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();
const items = ${JSON.stringify(items, null, 2)};
const sessionStore = createMemorySessionStore([
  {
    id: "ai:default",
    runtime: "fake",
    runtimeSessionId: "tool-state",
    createdAt: items[0].createdAt,
    updatedAt: items[0].createdAt,
    items,
  },
]);

<AiChatPanel runtime={runtime} sessionStore={sessionStore} />
`;
}

export const aiChatMentionsExampleSource = `import {
  AiChatPanel,
  FakeAgentRuntime,
  formatFileMention,
  searchVaultFiles,
} from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();
const files = [{ path: "Notes/alpha.md", name: "alpha" }];

<AiChatPanel
  runtime={runtime}
  fileSearch={async (query) =>
    searchVaultFiles(files, query).map((file) => ({
      id: file.path,
      label: file.name,
      value: formatFileMention(file.path),
      description: file.path,
    }))
  }
/>
`;

export const aiChatTraceExampleSource = `import {
  AiChatPanel,
  FakeAgentRuntime,
  StaticModelProvider,
} from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime({ trace: "rich" });
const models = await new StaticModelProvider("codex", [
  { provider: "codex", model: "gpt-5.6-sol" },
  { provider: "codex", model: "gpt-5.4-medium" },
]).listModels();

<AiChatPanel
  runtime={runtime}
  models={models}
  settings={{ defaultModel: "gpt-5.6-sol", thinking: "medium" }}
/>
`;

export function createAiChatFailureSeedItems() {
  return [
    {
      id: "failed-user",
      type: "message" as const,
      role: "user" as const,
      text: "Summarize the release notes",
      createdAt: "2026-03-16T09:00:00.000Z",
    },
    {
      id: "failed-response",
      type: "error" as const,
      text: "The agent connection closed before the response completed.",
      createdAt: "2026-03-16T09:00:01.000Z",
    },
  ];
}

export const aiChatFailureExampleSource = `import {
  AiChatPanel,
  FakeAgentRuntime,
  createMemorySessionStore,
} from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();
const items = ${JSON.stringify(createAiChatFailureSeedItems(), null, 2)};
const sessionStore = createMemorySessionStore([
  {
    id: "ai:default",
    runtime: "fake",
    runtimeSessionId: "failed-session",
    createdAt: items[0].createdAt,
    updatedAt: items.at(-1).createdAt,
    items,
  },
]);

<AiChatPanel runtime={runtime} sessionStore={sessionStore} />
`;

export function createAiChatScrollSeedItems() {
  const yesterday = new Date("2026-03-15T10:00:00.000Z");
  const today = new Date("2026-03-16T09:00:00.000Z");
  const items = [];
  for (let index = 0; index < 8; index += 1) {
    const createdAt = new Date(
      yesterday.getTime() + index * 60_000,
    ).toISOString();
    items.push({
      id: `user-y-${index}`,
      type: "message" as const,
      role: "user" as const,
      text: `Yesterday prompt ${index + 1}`,
      createdAt,
    });
    items.push({
      id: `asst-y-${index}`,
      type: "message" as const,
      role: "assistant" as const,
      text: `Yesterday reply ${index + 1}`,
      createdAt,
    });
  }
  for (let index = 0; index < 6; index += 1) {
    const createdAt = new Date(today.getTime() + index * 60_000).toISOString();
    items.push({
      id: `user-t-${index}`,
      type: "message" as const,
      role: "user" as const,
      text: `Today prompt ${index + 1}`,
      createdAt,
    });
    items.push({
      id: `asst-t-${index}`,
      type: "message" as const,
      role: "assistant" as const,
      text: index === 5 ? "Latest seeded message" : `Today reply ${index + 1}`,
      createdAt,
    });
  }
  return items;
}

export const aiChatScrollExampleSource = `import {
  AiChatPanel,
  FakeAgentRuntime,
  createMemorySessionStore,
} from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();
const items = ${JSON.stringify(createAiChatScrollSeedItems(), null, 2)};
const sessionStore = createMemorySessionStore([
  {
    id: "ai:default",
    runtime: "fake",
    runtimeSessionId: "fake-seed",
    createdAt: items[0].createdAt,
    updatedAt: items.at(-1).createdAt,
    items,
  },
]);

<AiChatPanel runtime={runtime} sessionStore={sessionStore} />
`;
