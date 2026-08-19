import type { AppToolResult } from "@lapis-notes/api/agent-tools";

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

export function formatToolDispatchNotice(
  tool: string,
  input: Record<string, unknown>,
  result: AppToolResult,
): string {
  if (tool === "notes_search") {
    const query = typeof input.query === "string" ? input.query : "";
    const hits = notesSearchHits(result);
    if (hits.length > 0) {
      const lines = [`Search: ${query}`];
      for (const hit of hits) {
        lines.push(hit.path);
        if (hit.snippet) lines.push(`  ${hit.snippet}`);
      }
      return lines.join("\n");
    }
    const text = joinToolText(result);
    if (text && !isEmptyNotesSearchJson(text)) return text;
    return query
      ? `No notes matched "${query}".`
      : "No notes matched the query.";
  }
  return joinToolText(result) || `/${tool} completed.`;
}

function notesSearchHits(
  result: AppToolResult,
): Array<{ path: string; snippet?: string }> {
  const structured = result.structuredContent;
  if (!structured || typeof structured !== "object" || Array.isArray(structured)) {
    return [];
  }
  const rows = Reflect.get(structured, "results");
  if (!Array.isArray(rows)) return [];
  const hits: Array<{ path: string; snippet?: string }> = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const path = Reflect.get(row, "path");
    if (typeof path !== "string" || !path.trim()) continue;
    const snippets = Reflect.get(row, "snippets");
    const first =
      Array.isArray(snippets) && snippets[0] && typeof snippets[0] === "object"
        ? Reflect.get(snippets[0], "text")
        : undefined;
    hits.push({
      path,
      snippet:
        typeof first === "string" && first.trim()
          ? first.replace(/\s+/gu, " ").trim()
          : undefined,
    });
  }
  return hits;
}

function joinToolText(result: AppToolResult): string {
  return result.content
    .filter((item) => item.type === "text")
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join("\n");
}

function isEmptyNotesSearchJson(text: string): boolean {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return false;
    }
    const results = Reflect.get(parsed, "results");
    return Array.isArray(results) && results.length === 0;
  } catch {
    return false;
  }
}
