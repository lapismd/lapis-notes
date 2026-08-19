import { LAPIS_BOOTSTRAP_INSTRUCTIONS } from "./instructions";
import { readAncestorFolderInstructions } from "./folder-instructions";
import { formatSessionBootstrap } from "./format";
import type {
  AgentBootstrap,
  AgentBootstrapSkill,
  AgentBootstrapTool,
} from "./types";

export interface BuildAgentBootstrapInput {
  conversationId?: string;
  scopeDir: string;
  launchNotePath?: string;
  workspaceLabel?: string;
  tools?: readonly AgentBootstrapTool[];
  skills?: readonly AgentBootstrapSkill[];
  readText?: (path: string) => Promise<string | undefined>;
}

export async function buildAgentBootstrap(
  input: BuildAgentBootstrapInput,
): Promise<AgentBootstrap> {
  const folderInstructions = input.readText
    ? await readAncestorFolderInstructions(input.readText, input.scopeDir)
    : [];
  return {
    application: { name: "Lapis Notes" },
    conversation: {
      id: input.conversationId,
      scopeDir: input.scopeDir,
      launchNotePath: input.launchNotePath,
    },
    workspace: input.workspaceLabel
      ? { label: input.workspaceLabel }
      : undefined,
    tools: [...(input.tools ?? [])],
    skills: [...(input.skills ?? [])],
    folderInstructions,
    instructions: [...LAPIS_BOOTSTRAP_INSTRUCTIONS],
    truncated: folderInstructions.some((entry) => entry.truncated),
  };
}

export async function buildSessionBootstrap(
  input: BuildAgentBootstrapInput,
): Promise<{ bootstrap: AgentBootstrap; text: string }> {
  const bootstrap = await buildAgentBootstrap(input);
  return { bootstrap, text: formatSessionBootstrap(bootstrap) };
}
