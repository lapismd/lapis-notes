/** Host-independent CLI settings; does not require a particular App API version. */
export { registerCliSettings } from "./cli-settings";
export type {
  CliSettingsHost,
  CliInstallationStatus,
  CliDownload,
  CliAccessHost,
  CliAccessStatus,
} from "./cli-settings";
export { default as CliSettings } from "./CliSettings.svelte";
