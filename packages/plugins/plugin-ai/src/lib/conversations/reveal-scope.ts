import type { App } from "@lapis-notes/api";

export const FILE_EXPLORER_REVEAL_PATH_COMMAND =
  "lapis-file-explorer:reveal-path";

export function revealConversationScope(
  app: App | undefined,
  scopeDir: string,
): void {
  if (!app) return;
  void app.commands
    .executeCommand(FILE_EXPLORER_REVEAL_PATH_COMMAND, scopeDir || "/")
    .catch(() => undefined);
}
