import type { AppToolEffect } from "@lapis-notes/api/agent-tools";
import type { SkillSourceKind } from "@lapis-notes/api/agent-skills";
import type { AppToolEnablementOwner } from "../settings/ai-settings";

export type CatalogGroupKind = "plugin" | "folders" | "user" | "diagnostics";

export interface CatalogToolRow {
  kind: "tool";
  name: string;
  description: string;
  effect: AppToolEffect;
  pluginId: string;
  enabled: boolean;
  owner: AppToolEnablementOwner;
}

export interface CatalogCommandRow {
  kind: "command";
  name: string;
  description: string;
  source: "app" | "extension" | "skill";
}

export interface CatalogSkillRow {
  kind: "skill";
  name: string;
  description: string;
  source: SkillSourceKind;
  path?: string;
  pluginId?: string;
  shadowed: boolean;
  userInvocable: boolean;
}

export interface CatalogDiagnosticRow {
  path: string;
  message: string;
}

export interface CatalogGroup {
  id: string;
  label: string;
  kind: CatalogGroupKind;
  tools: CatalogToolRow[];
  commands: CatalogCommandRow[];
  skills: CatalogSkillRow[];
  diagnostics: CatalogDiagnosticRow[];
}
