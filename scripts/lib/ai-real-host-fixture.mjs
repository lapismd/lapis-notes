import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const AI_REAL_HOST_RELATIVE_ROOT = "tmp/ai-real-host";

function aiPluginData(defaultRuntime) {
  return {
    settings: {
      defaultRuntime,
      acpAgent: "codex",
      defaultModel: "gpt-5.6-sol",
      defaultModels: { codex: "gpt-5.6-sol", cursor: "" },
      thinking: "medium",
    },
  };
}

function workspaceLayout() {
  return {
    main: {
      id: "main",
      type: "split",
      direction: "horizontal",
      children: [
        {
          id: "main-tabs",
          type: "tabs",
          currentTab: 0,
          children: [
            {
              id: "agent-smoke-note",
              type: "leaf",
              state: {
                type: "markdown",
                state: { file: "Notes/Agent Smoke.md", mode: "source" },
              },
            },
          ],
        },
      ],
    },
    left: {
      id: "left",
      type: "split",
      direction: "vertical",
      width: "18rem",
      children: [],
    },
    right: {
      id: "right",
      type: "split",
      direction: "vertical",
      width: "24rem",
      children: [
        {
          id: "ai-tabs",
          type: "tabs",
          currentTab: 0,
          children: [
            {
              id: "ai-chat",
              type: "leaf",
              state: { type: "ai", state: {} },
            },
          ],
        },
      ],
    },
    bottom: {
      id: "bottom",
      type: "tabs",
      currentTab: 0,
      height: "0px",
      children: [],
    },
    floating: [],
    active: "agent-smoke-note",
  };
}

export function aiRealHostSeed(defaultRuntime = "acp") {
  return {
    ".obsidian/app.json": JSON.stringify(
      { "appearence.interface.showTabTitleBar": true },
      null,
      2,
    ),
    ".obsidian/ai.json": JSON.stringify(
      aiPluginData(defaultRuntime),
      null,
      2,
    ),
    ".obsidian/workspace.json": JSON.stringify(workspaceLayout(), null, 2),
    "Notes/Agent Smoke.md": [
      "# Agent Smoke",
      "",
      "This folder is an isolated development fixture for real AI agents.",
      "The expected answer token is `lapis-smoke-ready`.",
      "",
      "Safe write checks may edit `src/fixture.ts` after permission is granted.",
      "Do not inspect files outside this folder.",
      "",
    ].join("\n"),
    "src/fixture.ts": [
      "export const smokeValue = 41;",
      'export const smokeLabel = "lapis-smoke-ready";',
      "",
    ].join("\n"),
  };
}

export async function seedAiRealHostWorkspace(
  workspace,
  { defaultRuntime = "acp", reset = false } = {},
) {
  if (reset) await rm(workspace, { recursive: true, force: true });
  const seed = aiRealHostSeed(defaultRuntime);
  const created = [];
  for (const [relativePath, contents] of Object.entries(seed)) {
    const target = path.join(workspace, relativePath);
    try {
      await access(target);
      continue;
    } catch {
      // Missing seed files are created; existing conversations and edits stay.
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
    created.push(relativePath);
  }
  return created;
}

export function assertSafeAiSmokeReset(repoRoot, target) {
  const safeRoot = path.resolve(repoRoot, "tmp");
  const resolved = path.resolve(target);
  if (resolved === safeRoot || !resolved.startsWith(`${safeRoot}${path.sep}`)) {
    throw new Error(
      `Refusing to reset AI smoke data outside ${safeRoot}: ${resolved}`,
    );
  }
  return resolved;
}
