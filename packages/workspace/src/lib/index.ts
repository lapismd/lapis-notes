export { default as WorkspaceShell } from "./WorkspaceShell.svelte";
export type { WorkspaceShellProps } from "./WorkspaceShell.svelte";
export { registerPluginManagementSettings } from "./plugin-management/register-plugin-management-settings";
export { default as PluginRegistrySettingsPage } from "./plugin-management/PluginRegistrySettingsPage.svelte";
export { default as CorePluginsSettingsPage } from "./plugin-management/CorePluginsSettingsPage.svelte";
export { default as CommunityPluginsSettingsPage } from "./plugin-management/CommunityPluginsSettingsPage.svelte";

export { PluginsView } from "./plugin-management/plugins-view.svelte";
export { default as PluginBrowser } from "./plugin-management/PluginBrowser.svelte";

export { openPluginBrowser } from "./plugin-management/plugin-browser-navigation";

export { default as DesktopVaultLauncher } from "./desktop/DesktopVaultLauncher.svelte";
export { default as DesktopWorkspaceStartup } from "./desktop/DesktopWorkspaceStartup.svelte";
export type {
  DesktopVaultLauncherHost,
  DesktopLauncherAppearance,
  LauncherStatus,
} from "./desktop/desktop-vault-launcher";
