export const aiChatSkillsExampleSource = `import { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";
import {
  AiChatPanel,
  FakeAgentRuntime,
  SkillRegistry,
  SlashCommandCatalog,
  SlashCommandRouter,
} from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();
const skills = new SkillRegistry({
  vault,
  bundled: [researchNotesSkill],
});
const extensions = new AppSlashCommandRegistry();
const dailyNote = extensions.register(
  { pluginId: "demo" },
  {
    name: "open-daily-note",
    description: "Open today's daily note",
    dispatch: { kind: "host", execute: () => undefined },
  },
);
const slashRouter = new SlashCommandRouter(
  new SlashCommandCatalog(extensions),
  skills,
);

<AiChatPanel runtime={runtime} skills={skills} slashRouter={slashRouter} />

dailyNote.dispose();
`;

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

export function createAppToolReadSeedItems() {
  return [
    {
      id: "app-read-user",
      type: "message" as const,
      role: "user" as const,
      text: "Read Notes/alpha.md",
      createdAt: "2026-08-17T09:00:00.000Z",
      agentBindingId: "binding-codex",
    },
    {
      id: "app-read-call",
      type: "tool" as const,
      toolId: "app-read-call",
      name: "read",
      server: "lapis-tools",
      state: "completed" as const,
      input: '{"path":"Notes/alpha.md","fromLine":1,"toLine":20}',
      output:
        '{"path":"Notes/alpha.md","content":"# Alpha\\n\\nTODO: summarize this note.","truncated":false,"revision":"sha256:8d9b"}',
      createdAt: "2026-08-17T09:00:01.000Z",
      agentBindingId: "binding-codex",
    },
    {
      id: "app-read-assistant",
      type: "message" as const,
      role: "assistant" as const,
      text: "I read the scoped note and found one TODO.",
      createdAt: "2026-08-17T09:00:02.000Z",
      agentBindingId: "binding-codex",
    },
  ];
}

export function createAppToolPatchPendingSeedItems() {
  return [
    {
      id: "app-patch-user",
      type: "message" as const,
      role: "user" as const,
      text: "Mark the Alpha TODO complete",
      createdAt: "2026-08-17T09:05:00.000Z",
      agentBindingId: "binding-codex",
    },
    {
      id: "approval-app-patch",
      type: "approval" as const,
      request: {
        id: "app-patch",
        origin: "app-tool" as const,
        kind: "write" as const,
        title: "Edit Notes/alpha.md",
        tool: {
          name: "edit",
          input: {
            path: "Notes/alpha.md",
            oldText: "TODO: summarize this note.",
            newText: "DONE: summarized this note.",
          },
        },
        options: [
          {
            id: "allow-once",
            label: "Allow once",
            kind: "allow-once" as const,
          },
          {
            id: "allow-session",
            label: "Allow for this session",
            kind: "allow-session" as const,
          },
          { id: "deny-once", label: "Deny", kind: "deny-once" as const },
        ],
        details: {
          description: "Replace exactly one current match atomically.",
          path: "Notes/alpha.md",
          diff: "--- before\nTODO: summarize this note.\n+++ after\nDONE: summarized this note.",
        },
      },
      status: "pending" as const,
      createdAt: "2026-08-17T09:05:01.000Z",
      agentBindingId: "binding-codex",
    },
  ];
}

export function createAppToolSessionGrantSeedItems() {
  return [
    {
      ...createAppToolPatchPendingSeedItems()[1]!,
      status: "approved" as const,
      responseOptionId: "allow-session",
    },
    {
      id: "app-patch-call-1",
      type: "tool" as const,
      toolId: "app-patch-call-1",
      name: "edit",
      server: "lapis-tools",
      state: "completed" as const,
      input: '{"path":"Notes/alpha.md"}',
      output: '{"path":"Notes/alpha.md","replacements":1}',
      createdAt: "2026-08-17T09:05:02.000Z",
      agentBindingId: "binding-codex",
    },
    {
      id: "app-patch-call-2",
      type: "tool" as const,
      toolId: "app-patch-call-2",
      name: "edit",
      server: "lapis-tools",
      state: "completed" as const,
      input: '{"path":"Notes/beta.md"}',
      output: '{"path":"Notes/beta.md","replacements":1}',
      createdAt: "2026-08-17T09:06:00.000Z",
      agentBindingId: "binding-codex",
    },
  ];
}

export function createNotesSearchSeedItems() {
  return [
    {
      id: "search-user",
      type: "message" as const,
      role: "user" as const,
      text: "/search OAuth",
      createdAt: "2026-08-19T10:00:00.000Z",
    },
    {
      id: "search-tool",
      type: "tool" as const,
      toolId: "search-tool",
      name: "notes_search",
      server: "lapis-tools",
      state: "completed" as const,
      input: '{"query":"OAuth"}',
      output: JSON.stringify({
        content: [{ type: "text", text: "1 match" }],
        structuredContent: {
          results: [
            {
              path: "Projects/auth.md",
              score: 1,
              snippets: [{ text: "OAuth tokens", offset: 0 }],
            },
          ],
        },
      }),
      createdAt: "2026-08-19T10:00:01.000Z",
    },
  ];
}

export const aiChatSearchResultExampleSource = `import { Plugin } from "@lapis-notes/api";
import { AiChatPanel, FakeAgentRuntime } from "@lapis-notes/ai";
import { SearchToolResult } from "@lapis-notes/search";
import "@lapis-notes/ai/styles.css";

class SearchPlugin extends Plugin {
  onload() {
    this.registerAgentResultView({
      tool: "notes_search",
      component: SearchToolResult,
    });
  }
}

const runtime = new FakeAgentRuntime();

<AiChatPanel app={app} runtime={runtime} />
`;

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
