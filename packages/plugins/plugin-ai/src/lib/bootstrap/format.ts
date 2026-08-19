import { hasHostFilesystemPath } from "../skills/manifest";
import type { AgentBootstrap } from "./types";

export function formatSessionBootstrap(bootstrap: AgentBootstrap): string {
  const tools =
    bootstrap.tools.length > 0
      ? bootstrap.tools
          .map((tool) => `- ${tool.name} — ${oneLine(tool.description)}`)
          .join("\n")
      : "(none)";
  const skills =
    bootstrap.skills.length > 0
      ? bootstrap.skills.map((skill) => `- ${skill.name}`).join("\n")
      : "(none)";
  const folder = bootstrap.folderInstructions
    .filter((entry) => !entry.omitted && entry.text.trim())
    .map((entry) => `--- ${entry.path} ---\n${entry.text}`)
    .join("\n\n");
  const body = [
    "<lapis_context>",
    bootstrap.instructions.join("\n\n"),
    "",
    `Current scope: ${portableBootstrapPath(bootstrap.conversation.scopeDir, "(vault root)")}`,
    `Launched from: ${portableBootstrapPath(bootstrap.conversation.launchNotePath, "(none)")}`,
    `Workspace: ${bootstrap.workspace?.label?.trim() || "(none)"}`,
    "",
    "Available application tools:",
    tools,
    "",
    "Available skills:",
    skills,
    ...(folder ? ["", "Folder instructions:", folder] : []),
    "</lapis_context>",
  ].join("\n");
  if (hasHostFilesystemPath(body)) {
    throw new Error("Session bootstrap must not include host filesystem paths.");
  }
  return body;
}

function portableBootstrapPath(
  value: string | undefined,
  empty: string,
): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return empty;
  if (hasHostFilesystemPath(trimmed)) return "(application folder)";
  return trimmed;
}

function oneLine(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}
