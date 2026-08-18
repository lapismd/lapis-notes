import type { SkillSourceKind } from "@lapis-notes/api/agent-skills";

export type SkillCommandDispatch =
  | { kind: "model" }
  | { kind: "tool"; tool: string; argMode: "raw" };

export interface SkillRequirements {
  tools?: string[];
  capabilities?: string[];
  extensions?: string[];
}

export interface AppSkillDescriptor {
  id: string;
  name: string;
  description: string;
  source: SkillSourceKind;
  root: string;
  version: string;
  userInvocable: boolean;
  modelInvocable: boolean;
  argumentHint?: string;
  command: SkillCommandDispatch;
  requirements?: SkillRequirements;
}

export interface LoadedAppSkill extends AppSkillDescriptor {
  instructions: string;
}

export interface SkillDiagnostic {
  path: string;
  source: SkillSourceKind;
  message: string;
  shadowedBy?: string;
}

export interface SkillSnapshotEntry {
  skillId: string;
  name: string;
  description: string;
  version: string;
  userInvocable: boolean;
  modelInvocable: boolean;
  argumentHint?: string;
}

export interface SkillSnapshot {
  id: string;
  createdAt: string;
  skills: readonly SkillSnapshotEntry[];
}

export interface SkillActivation {
  skillId: string;
  skillName: string;
  version: string;
  source: "user" | "model" | "app";
  arguments?: string;
  instructions: string;
}

export interface SkillDiscoveryContext {
  scopeDir: string;
  availableToolNames?: readonly string[];
  enabledPluginIds?: readonly string[];
}

export interface NativeAgentCommand {
  name: string;
  description?: string;
  argumentHint?: string;
}
