export const FOLDER_INSTRUCTION_FILE = "AGENTS.md";
export const MAX_FOLDER_INSTRUCTION_CHARS = 10_000;
export const MAX_FOLDER_INSTRUCTION_TOTAL_CHARS = 25_000;

export interface AgentBootstrapTool {
  name: string;
  description: string;
}

export interface AgentBootstrapSkill {
  name: string;
  description: string;
  version: string;
}

export interface FolderInstruction {
  path: string;
  text: string;
  truncated: boolean;
  omitted?: "path-bearing";
}

export interface AgentBootstrap {
  application: { name: "Lapis Notes" };
  conversation: {
    id?: string;
    scopeDir: string;
    launchNotePath?: string;
  };
  workspace?: { label?: string };
  tools: AgentBootstrapTool[];
  skills: AgentBootstrapSkill[];
  folderInstructions: FolderInstruction[];
  instructions: string[];
  truncated: boolean;
}
