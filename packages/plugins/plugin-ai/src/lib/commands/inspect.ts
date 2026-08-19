export function formatScopeNotice(input: {
  scopeDir: string;
  launchNotePath?: string;
  workspace?: string;
  source?: "explicit" | "active-file" | "vault-root" | "conversation" | "folder";
}): string {
  const scope = input.scopeDir.trim() || "(vault root)";
  const source =
    input.source ?? (input.scopeDir.trim() ? "folder" : "vault-root");
  return [
    `Scope: ${scope}`,
    `Source: ${source}`,
    `Started from: ${input.launchNotePath?.trim() || "(none)"}`,
    `Workspace: ${input.workspace?.trim() || "(none)"}`,
  ].join("\n");
}

export function formatContextNotice(input: {
  conversationId?: string;
  scopeDir: string;
  launchNotePath?: string;
  workspace?: string;
  agent: string;
  model?: string;
  tools: readonly string[];
  skills: readonly string[];
  folderInstructionPaths?: readonly string[];
  truncated?: boolean;
}): string {
  const tools = input.tools.length > 0 ? input.tools.join(", ") : "(none)";
  const skills = input.skills.length > 0 ? input.skills.join(", ") : "(none)";
  const folders =
    input.folderInstructionPaths && input.folderInstructionPaths.length > 0
      ? input.folderInstructionPaths.join(", ")
      : "(none)";
  return [
    `Conversation: ${input.conversationId ?? "(none)"}`,
    `Scope: ${input.scopeDir.trim() || "(vault root)"}`,
    `Started from: ${input.launchNotePath?.trim() || "(none)"}`,
    `Workspace: ${input.workspace?.trim() || "(none)"}`,
    `Agent: ${input.agent}`,
    `Model: ${input.model?.trim() || "(none)"}`,
    `Available app tools: ${tools}`,
    `Available skills: ${skills}`,
    `Folder instructions: ${folders}`,
    `Context status: ${input.truncated ? "Bootstrap truncated" : "No bootstrap truncation"}`,
  ].join("\n");
}
