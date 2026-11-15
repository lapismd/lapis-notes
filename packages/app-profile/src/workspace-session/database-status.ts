import type {
  App,
  BrowserCoordinatedAppDatabase,
  VaultSession,
} from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";

export function registerSessionDatabaseStatus(
  app: App,
  session: VaultSession,
  runtime: string,
) {
  let removeStatus: (() => void) | undefined;
  const sync = (role: "owner" | "proxy" | "server") => {
    removeStatus?.();
    removeStatus = getWorkspaceHostBinding(
      app.workspace,
    ).controller.status.addItem({
      id: "app:web-database-role",
      label:
        role === "server"
          ? "Server DB"
          : role === "proxy"
            ? "DB Proxy"
            : "DB Owner",
      icon: "database",
      tooltip:
        role === "server"
          ? "Application data is managed by the authenticated Lapis server."
          : role === "proxy"
            ? "Database requests are delegated to this vault's owner tab."
            : "This tab owns the local Turso database for this vault.",
      align: "right",
      priority: 850,
    });
  };
  const database = session.appDatabase as BrowserCoordinatedAppDatabase;
  const server = runtime === "node-server" || runtime === "rust-server";
  sync(
    server
      ? "server"
      : database?.descriptor.role === "proxy"
        ? "proxy"
        : "owner",
  );
  const unsubscribe = server
    ? undefined
    : database?.onCoordinationModeChange?.((mode) =>
        sync(mode === "turso-proxy" ? "proxy" : "owner"),
      );
  return () => {
    unsubscribe?.();
    removeStatus?.();
  };
}
