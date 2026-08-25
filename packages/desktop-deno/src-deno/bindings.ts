import { handleBootstrapKv } from "./bootstrap-kv.ts";
import type { DenoAppDatabaseHost } from "./app-database.ts";
import {
  DENO_AGENT_COMMANDS,
  type DenoAgentRuntimeHost,
} from "./agent-runtime.ts";
import { createCapabilityRegistry } from "./capabilities.ts";
import type { DenoFileWatchService } from "./file-watch.ts";
import { handleLanguageService } from "./language-service.ts";
import { openExternalUrl, showNativeNotification } from "./native-actions.ts";
import type { DenoPluginAssetService } from "./plugin-assets.ts";
import { resolveDesktopRendererEngine } from "./renderer-engine.ts";
import {
  DENO_TERMINAL_COMMANDS,
  type DenoTerminalRuntimeHost,
} from "./terminal-runtime.ts";
import {
  handleVaultFs,
  moveVaultFolder,
  selectVaultFolder,
} from "./vault-fs.ts";
import type { DenoVaultResourceService } from "./vault-resources.ts";
import { usesOverlayWindowControls } from "./window-chrome.ts";

const FS_COMMANDS = new Set([
  "desktop_fs_exists",
  "desktop_fs_stat",
  "desktop_fs_read_text",
  "desktop_fs_read_binary",
  "desktop_fs_write_text",
  "desktop_fs_write_binary",
  "desktop_fs_append_text",
  "desktop_fs_list",
  "desktop_fs_mkdir",
  "desktop_fs_rmdir",
  "desktop_fs_remove",
  "desktop_fs_rename",
  "desktop_fs_copy",
  "desktop_fs_resolve_path",
  "desktop_fs_to_vault_path",
  "desktop_fs_open_path",
  "desktop_fs_reveal_path",
  "desktop_fs_get_resource_url",
]);

const LANGUAGE_SERVICE_COMMANDS = new Set([
  "desktop_ls_capabilities",
  "desktop_ls_update_document",
  "desktop_ls_diagnostics",
  "desktop_ls_code_actions",
]);

const KV_COMMANDS = new Set([
  "desktop_vault_bootstrap_kv_get",
  "desktop_vault_bootstrap_kv_set",
  "desktop_vault_bootstrap_kv_set_many",
  "desktop_vault_bootstrap_kv_get_many",
  "desktop_vault_bootstrap_kv_del",
  "desktop_vault_bootstrap_kv_keys",
  "desktop_vault_bootstrap_kv_is_empty",
  "desktop_vault_bootstrap_kv_import_if_empty",
]);

export const DENO_INVOKE_COMMANDS = new Set([
  "desktop_app_info_get",
  "desktop_platform_get",
  "desktop_capabilities_get",
  "desktop_acceptance_report",
  "desktop_acceptance_request_close",
  "desktop_app_database_open",
  "desktop_app_database_close",
  "desktop_app_database_invoke",
  "desktop_renderer_close_ready",
  "desktop_open_external",
  "desktop_app_url_take_pending",
  "desktop_notifications_show",
  "desktop_telemetry_log",
  "desktop_plugin_assets_register",
  "desktop_fs_watch_start",
  "desktop_fs_watch_stop",
  "desktop_pick_vault_folder",
  "desktop_create_vault_folder",
  "desktop_move_vault_folder",
  ...FS_COMMANDS,
  ...KV_COMMANDS,
  ...LANGUAGE_SERVICE_COMMANDS,
  ...DENO_AGENT_COMMANDS,
  ...DENO_TERMINAL_COMMANDS,
]);

export type DesktopInvokeContext = {
  fileWatch?: DenoFileWatchService;
  pluginAssets?: DenoPluginAssetService;
  vaultResources?: DenoVaultResourceService;
  agentRuntime?: DenoAgentRuntimeHost;
  appDatabase?: DenoAppDatabaseHost;
  terminalRuntime?: DenoTerminalRuntimeHost;
  rendererCloseReady?: () => void;
  requestClose?: () => void;
  takePendingAppUrls?: () => string[];
  acceptanceDetails?: () => Record<string, unknown>;
  telemetryLog?: (payload: Record<string, unknown>) => void;
};

export function createPlatformInfo() {
  const os =
    Deno.build.os === "darwin"
      ? "macos"
      : Deno.build.os === "windows"
        ? "windows"
        : Deno.build.os === "linux"
          ? "linux"
          : "unknown";
  return {
    runtime: "deno-desktop" as const,
    os,
    arch: Deno.build.arch,
    runtimeVersion: Deno.version.deno,
    appVersion: "2026.31.5",
    rendererEngine: resolveDesktopRendererEngine(
      Deno.env.get("LAPIS_DENO_BACKEND"),
    ),
    packaged: !Deno.env.get("LAPIS_DESKTOP_DEV_SERVER_URL"),
    overlayWindowControls: usesOverlayWindowControls(),
    suggestedVaultPath: Deno.env.get("LAPIS_DENO_VAULT")?.trim() || undefined,
    acceptance:
      Deno.env.get("LAPIS_DENO_ACCEPTANCE") === "1" &&
      Boolean(Deno.env.get("LAPIS_DENO_ACCEPTANCE_REPORT")?.trim()),
  };
}

export function handleDesktopInvoke(
  command: string,
  payload: Record<string, unknown> = {},
  context: DesktopInvokeContext = {},
): unknown {
  if (!DENO_INVOKE_COMMANDS.has(command)) {
    throw new Error(`Unimplemented desktop command: ${command}`);
  }
  if (command === "desktop_app_info_get") {
    return {
      name: "Lapis Notes",
      version: "2026.31.5",
      buildTime: null,
      copyright: "Copyright © Lapis Notes contributors.",
    };
  }
  if (command === "desktop_platform_get") {
    return createPlatformInfo();
  }
  if (command === "desktop_capabilities_get") {
    return createCapabilityRegistry(Deno.build.os, {
      terminalAvailable: Boolean(context.terminalRuntime),
    });
  }
  if (command === "desktop_acceptance_report") {
    const reportPath = Deno.env.get("LAPIS_DENO_ACCEPTANCE_REPORT")?.trim();
    if (Deno.env.get("LAPIS_DENO_ACCEPTANCE") !== "1" || !reportPath) {
      throw new Error("Deno desktop acceptance reporting is disabled");
    }
    return Deno.writeTextFile(
      reportPath,
      `${JSON.stringify({ ...payload, ...context.acceptanceDetails?.() })}\n`,
    );
  }
  if (command === "desktop_acceptance_request_close") {
    if (Deno.env.get("LAPIS_DENO_ACCEPTANCE") !== "1") {
      throw new Error("Deno desktop acceptance close is disabled");
    }
    if (!context.requestClose)
      throw new Error("Deno window close is unavailable");
    context.requestClose();
    return;
  }
  if (command === "desktop_app_database_open") {
    if (!context.appDatabase) {
      throw new Error("Deno app database host is unavailable");
    }
    return context.appDatabase.open(payload);
  }
  if (command === "desktop_app_database_close") {
    if (!context.appDatabase) {
      throw new Error("Deno app database host is unavailable");
    }
    return context.appDatabase.close(payload);
  }
  if (command === "desktop_app_database_invoke") {
    if (!context.appDatabase) {
      throw new Error("Deno app database host is unavailable");
    }
    return context.appDatabase.invoke(payload);
  }
  if (command === "desktop_renderer_close_ready") {
    if (!context.rendererCloseReady) {
      throw new Error("Deno close coordinator is unavailable");
    }
    context.rendererCloseReady();
    return;
  }
  if (command === "desktop_open_external") {
    return openExternalUrl(payload.url);
  }
  if (command === "desktop_app_url_take_pending") {
    return context.takePendingAppUrls?.() ?? [];
  }
  if (command === "desktop_notifications_show") {
    return showNativeNotification(payload.notification);
  }
  if (command === "desktop_telemetry_log") {
    if (!context.telemetryLog) {
      throw new Error("Deno desktop telemetry logging is unavailable");
    }
    context.telemetryLog(payload);
    return;
  }
  if (command === "desktop_plugin_assets_register") {
    if (!context.pluginAssets) {
      throw new Error("Deno plugin assets are unavailable");
    }
    return context.pluginAssets.register(payload);
  }
  if (command === "desktop_fs_watch_start") {
    if (!context.fileWatch) throw new Error("Deno file watch is unavailable");
    return context.fileWatch.start(payload);
  }
  if (command === "desktop_fs_watch_stop") {
    context.fileWatch?.stop(String(payload.watchId ?? ""));
    return;
  }
  if (command === "desktop_pick_vault_folder") {
    return selectVaultFolder(false);
  }
  if (command === "desktop_create_vault_folder") {
    return selectVaultFolder(true);
  }
  if (command === "desktop_move_vault_folder") {
    return moveVaultFolder(String(payload.path ?? ""));
  }
  if (command === "desktop_fs_get_resource_url") {
    if (!context.vaultResources) {
      throw new Error("Deno vault resources are unavailable");
    }
    return context.vaultResources.getUrl(payload);
  }
  if (FS_COMMANDS.has(command)) {
    return handleVaultFs(command, payload);
  }
  if (LANGUAGE_SERVICE_COMMANDS.has(command)) {
    return handleLanguageService(command, payload);
  }
  if (DENO_AGENT_COMMANDS.has(command)) {
    if (!context.agentRuntime) {
      throw new Error("Deno agent runtime is unavailable");
    }
    return context.agentRuntime.handle(command, payload);
  }
  if (DENO_TERMINAL_COMMANDS.has(command)) {
    if (!context.terminalRuntime) {
      throw new Error("Deno terminal runtime is unavailable");
    }
    return context.terminalRuntime.handle(command, payload);
  }
  return handleBootstrapKv(command, payload);
}
