export type DesktopTelemetryOperation = {
  scope: "database" | "language" | "ai" | "terminal" | "telemetry";
  operation: string;
};

const DATABASE_METHODS = new Set([
  "migrate",
  "beginSearchIndexingBatch",
  "endSearchIndexingBatch",
  "getSearchIndexStats",
  "getMeta",
  "setMeta",
  "listIndexedFileManifest",
  "queryIndexedMetadata",
  "queryIndexedMetadataPage",
  "queryMetadataFacets",
  "queryMetadataLinks",
  "listSearchDocumentManifest",
  "searchDocuments",
]);

const LANGUAGE_COMMANDS = new Set([
  "desktop_ls_diagnostics",
  "desktop_ls_code_actions",
]);

const AI_COMMANDS = new Set([
  "desktop_agent_process_spawn",
  "desktop_agent_process_kill",
  "desktop_agent_acp_start",
  "desktop_agent_acp_models",
  "desktop_agent_acp_prompt",
  "desktop_agent_acp_cancel",
  "desktop_agent_acp_close",
  "desktop_agent_tools_open",
  "desktop_agent_tools_close",
]);

const TERMINAL_COMMANDS = new Set([
  "desktop_terminal_session_create",
  "desktop_terminal_session_list",
  "desktop_terminal_session_stop",
]);

export function classifyDesktopTelemetryOperation(
  command: string,
  payload: Record<string, unknown>,
): DesktopTelemetryOperation | null {
  if (
    command === "desktop_app_database_open" ||
    command === "desktop_app_database_close"
  ) {
    return {
      scope: "database",
      operation: command === "desktop_app_database_open" ? "open" : "close",
    };
  }
  if (command === "desktop_app_database_invoke") {
    const method = typeof payload.method === "string" ? payload.method : "";
    return DATABASE_METHODS.has(method)
      ? { scope: "database", operation: method }
      : null;
  }
  if (LANGUAGE_COMMANDS.has(command)) {
    return { scope: "language", operation: command.replace("desktop_ls_", "") };
  }
  if (AI_COMMANDS.has(command)) {
    return { scope: "ai", operation: command.replace("desktop_agent_", "") };
  }
  if (TERMINAL_COMMANDS.has(command)) {
    return {
      scope: "terminal",
      operation: command.replace("desktop_terminal_session_", "session."),
    };
  }
  if (command === "desktop_telemetry_log") {
    return { scope: "telemetry", operation: "log" };
  }
  return null;
}

export function readTelemetryResultCount(result: unknown): number | undefined {
  if (Array.isArray(result)) return result.length;
  if (typeof result !== "object" || result === null) return undefined;
  for (const key of ["results", "items", "rows", "documents"] as const) {
    const value = (result as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value.length;
  }
  return undefined;
}
