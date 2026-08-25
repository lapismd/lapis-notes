export type DesktopTelemetryOperation = {
  scope: "database" | "language" | "ai" | "terminal" | "telemetry";
  operation: string;
  batchSize?: number;
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
  "searchDocumentPaths",
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

function readDatabaseBatchSize(
  method: string,
  payload: Record<string, unknown>,
): number | undefined {
  if (
    method !== "listIndexedFileManifest" &&
    method !== "listSearchDocumentManifest"
  ) {
    return undefined;
  }
  const args = Array.isArray(payload.args) ? payload.args : [];
  const options = args[0];
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return undefined;
  }
  const paths = (options as Record<string, unknown>).paths;
  return Array.isArray(paths) ? Math.min(paths.length, 1_000) : undefined;
}

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
    if (!DATABASE_METHODS.has(method)) return null;
    const batchSize = readDatabaseBatchSize(method, payload);
    return {
      scope: "database",
      operation: method,
      ...(batchSize !== undefined ? { batchSize } : {}),
    };
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
