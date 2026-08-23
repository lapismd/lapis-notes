import { handleBootstrapKv } from "./bootstrap-kv.ts";
import {
  DENO_AGENT_COMMANDS,
  type DenoAgentRuntimeHost,
} from "./agent-runtime.ts";
import { createCapabilityRegistry } from "./capabilities.ts";
import type { DenoFileWatchService } from "./file-watch.ts";
import { handleLanguageService } from "./language-service.ts";
import { showNativeNotification } from "./native-actions.ts";
import type { DenoPluginAssetService } from "./plugin-assets.ts";
import {
  handleVaultFs,
  moveVaultFolder,
  selectVaultFolder,
} from "./vault-fs.ts";
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
  "desktop_notifications_show",
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
]);

export type DesktopInvokeContext = {
  fileWatch?: DenoFileWatchService;
  pluginAssets?: DenoPluginAssetService;
  agentRuntime?: DenoAgentRuntimeHost;
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
    return createCapabilityRegistry();
  }
  if (command === "desktop_acceptance_report") {
    const reportPath = Deno.env.get("LAPIS_DENO_ACCEPTANCE_REPORT")?.trim();
    if (Deno.env.get("LAPIS_DENO_ACCEPTANCE") !== "1" || !reportPath) {
      throw new Error("Deno desktop acceptance reporting is disabled");
    }
    return Deno.writeTextFile(reportPath, `${JSON.stringify(payload)}\n`);
  }
  if (command === "desktop_notifications_show") {
    return showNativeNotification(payload.notification);
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
  return handleBootstrapKv(command, payload);
}
