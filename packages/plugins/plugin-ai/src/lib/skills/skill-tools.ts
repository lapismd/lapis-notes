import type { AppTool, AppToolResult } from "@lapis-notes/api/agent-tools";
import type { Vault } from "@lapis-notes/api";
import type { SkillRegistry, SkillSnapshotStore } from "./registry";

const MAX_RESOURCE_BYTES = 64 * 1024;

export function createSkillAppTools(options: {
  registry: SkillRegistry;
  snapshots: SkillSnapshotStore;
  vault: Vault;
}): AppTool[] {
  return [
    {
      name: "skills_read",
      description:
        "Load the full instructions for an available application skill.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
      effect: "read",
      async execute(input, context): Promise<AppToolResult> {
        const name =
          input && typeof input === "object" && "name" in input
            ? String((input as { name: unknown }).name)
            : "";
        const snapshot = options.snapshots.get(context.agentBindingId);
        const entry = snapshot?.skills.find((skill) => skill.name === name);
        if (!entry) {
          return {
            isError: true,
            content: [{ type: "text", text: `Unknown skill: ${name}` }],
          };
        }
        if (!entry.modelInvocable) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Skill ${name} is not available for model invocation.`,
              },
            ],
          };
        }
        const loaded = await options.registry.load(entry.skillId, entry.version);
        return {
          content: [{ type: "text", text: loaded.instructions }],
          structuredContent: {
            name: loaded.name,
            version: loaded.version,
            instructions: loaded.instructions,
            resources: [],
          },
        };
      },
    },
    {
      name: "skills_resource",
      description:
        "Read a resource belonging to a skill already available to this agent.",
      inputSchema: {
        type: "object",
        properties: {
          skill: { type: "string" },
          path: { type: "string" },
        },
        required: ["skill", "path"],
      },
      effect: "read",
      async execute(input, context): Promise<AppToolResult> {
        const body =
          input && typeof input === "object"
            ? (input as { skill?: unknown; path?: unknown })
            : {};
        const skillName = String(body.skill ?? "");
        const relative = String(body.path ?? "").replaceAll("\\", "/");
        const snapshot = options.snapshots.get(context.agentBindingId);
        const entry = snapshot?.skills.find((skill) => skill.name === skillName);
        if (!entry) {
          return {
            isError: true,
            content: [{ type: "text", text: `Unknown skill: ${skillName}` }],
          };
        }
        if (
          !relative ||
          relative.startsWith("/") ||
          relative.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
        ) {
          return {
            isError: true,
            content: [{ type: "text", text: "Skill resource path is invalid." }],
          };
        }
        let loaded;
        try {
          loaded = await options.registry.load(entry.skillId, entry.version);
        } catch {
          return {
            isError: true,
            content: [{ type: "text", text: `Skill is not loaded: ${skillName}` }],
          };
        }
        const target = `${loaded.root}/${relative}`;
        const file = options.vault.getFileByPath(target);
        if (!file) {
          return {
            isError: true,
            content: [{ type: "text", text: `Skill resource not found: ${relative}` }],
          };
        }
        const text = await options.vault.cachedRead(file);
        if (new TextEncoder().encode(text).byteLength > MAX_RESOURCE_BYTES) {
          return {
            isError: true,
            content: [{ type: "text", text: "Skill resource exceeds the size limit." }],
          };
        }
        return {
          content: [{ type: "text", text }],
        };
      },
    },
  ];
}
