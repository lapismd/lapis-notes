import type { NativeDesktopCapabilityRegistry } from "@lapis-notes/api";

export const DESKTOP_INVOKE_COMMANDS = new Set([
  "desktop_app_info_get",
  "desktop_app_url_take_pending",
  "desktop_create_vault_folder",
  "desktop_db_call",
  "desktop_db_close",
  "desktop_db_open",
  "desktop_fs_copy",
  "desktop_fs_exists",
  "desktop_fs_get_resource_url",
  "desktop_fs_list",
  "desktop_fs_mkdir",
  "desktop_fs_open_path",
  "desktop_fs_read_binary",
  "desktop_fs_read_text",
  "desktop_fs_remove",
  "desktop_fs_rename",
  "desktop_fs_resolve_path",
  "desktop_fs_reveal_path",
  "desktop_fs_rmdir",
  "desktop_fs_stat",
  "desktop_fs_to_vault_path",
  "desktop_fs_watch_start",
  "desktop_fs_watch_stop",
  "desktop_fs_write_binary",
  "desktop_fs_write_text",
  "desktop_ls_capabilities",
  "desktop_ls_code_actions",
  "desktop_ls_diagnostics",
  "desktop_ls_update_document",
  "desktop_move_vault_folder",
  "desktop_notifications_show",
  "desktop_pick_vault_folder",
  "desktop_plugin_assets_register",
  "desktop_plugin_host_activate",
  "desktop_plugin_host_deactivate",
  "desktop_plugin_host_evaluate",
  "desktop_plugin_host_prepare",
  "desktop_plugin_host_shutdown",
  "desktop_reveal_vault_folder",
  "desktop_agent_process_spawn",
  "desktop_agent_process_write",
  "desktop_agent_process_kill",
  "desktop_agent_acp_start",
  "desktop_agent_acp_models",
  "desktop_agent_acp_prompt",
  "desktop_agent_acp_cancel",
  "desktop_agent_acp_close",
  "desktop_agent_acp_respond",
  "desktop_renderer_close_ready",
  "desktop_vault_bootstrap_kv_del",
  "desktop_vault_bootstrap_kv_get_many",
  "desktop_vault_bootstrap_kv_get",
  "desktop_vault_bootstrap_kv_import_if_empty",
  "desktop_vault_bootstrap_kv_is_empty",
  "desktop_vault_bootstrap_kv_keys",
  "desktop_vault_bootstrap_kv_set_many",
  "desktop_vault_bootstrap_kv_set",
]);

export function createDesktopCapabilityRegistry(): NativeDesktopCapabilityRegistry {
  const nativeTurso =
    (process.platform === "darwin" && process.arch === "arm64") ||
    (process.platform === "linux" && ["x64", "arm64"].includes(process.arch));
  const databaseProvider = nativeTurso
    ? "electron-turso-native"
    : "electron-turso-wasm-opfs";
  return {
    resource: {
      id: "resource",
      status: "available",
      provider: "electron-protocol",
      details: { scheme: "lapis-vault-resource" },
    },
    database: {
      id: "database",
      status: "available",
      provider: databaseProvider,
      details: {
        engine: "turso",
        transport: nativeTurso ? "native" : "wasm-worker",
        storage: nativeTurso ? "userData/turso/*.turso" : "renderer-opfs",
      },
    },
    search: {
      id: "search",
      status: "available",
      provider: "turso-fts-vector",
      details: {
        modes: "lexical,vector,hybrid",
        vector: "turso-vector-distance",
      },
    },
    notebook: {
      id: "notebook",
      status: "unavailable",
      provider: "not-in-partial-host",
    },
    "language-service": {
      id: "language-service",
      status: "available",
      provider: "electron-language-service-sidecar",
      details: {
        markdown: "markdownlint-node",
        protocolVersion: 1,
        timeoutMs: 30000,
        restart: "auto",
      },
    },
    model: {
      id: "model",
      status: "unavailable",
      provider: "not-in-partial-host",
    },
    "plugin-sidecar": {
      id: "plugin-sidecar",
      status: "available",
      provider: "electron-plugin-sidecar",
      details: {
        boundary: "electron-main-child-process",
        protocol: "desktop_plugin_host_*",
        timeoutMs: 30000,
        restart: "auto",
        lifecycle: "evaluate,activate,deactivate,shutdown",
        broker: true,
        capabilityCount: 9,
        capabilities:
          "vault:read,vault:write,plugin:data,commands,notices,settings,metadata:query,events,logging",
      },
    },
    "plugin-assets": {
      id: "plugin-assets",
      status: "available",
      provider: "electron-plugin-protocol",
      details: {
        scheme: "lapis-plugin",
        protocol: "desktop_plugin_assets_register",
      },
    },
    "file-watch": {
      id: "file-watch",
      status: "available",
      provider: "chokidar",
    },
    notifications: {
      id: "notifications",
      status: "available",
      provider: "electron-notification",
    },
    "file-system-actions": {
      id: "file-system-actions",
      status: "available",
      provider: "electron-shell",
      details: { actions: "resolve-path,open-path,reveal-path" },
    },
    "agent-runtime": {
      id: "agent-runtime",
      status: "available",
      provider: "electron-agent-runtime",
      details: {
        protocol: "desktop_agent_*",
        acp: "acpx/runtime",
        process: "stdio",
      },
    },
  };
}
