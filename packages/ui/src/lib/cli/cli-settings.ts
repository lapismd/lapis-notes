import type {
  WorkspaceCustomSetting,
  WorkspaceSettingsController,
} from "@lapismd/design-core/workspace/settings";
import CliSettingsField from "./CliSettingsField.svelte";

export interface CliInstallationStatus {
  state: "not-installed" | "installed" | "broken" | "conflict";
  destination: string;
  version: string;
}
export interface CliDownload {
  label: string;
  url: string;
  sha256: string;
}
export interface CliAccessStatus {
  enabled: boolean;
  target: string | null;
  vaults: { id: string; name: string }[];
  permissions: string[];
  grants: { id: string; label: string }[];
}
export interface CliAccessHost {
  status(): Promise<CliAccessStatus>;
  enable(enabled: boolean): Promise<void>;
  create(input: {
    label: string;
    vaultIds: string[];
    hours: number;
    permissions: string[];
  }): Promise<{ command: string }>;
  revoke(id: string): Promise<void>;
}
/** Host authority stays outside the shared settings presentation. */
export interface CliSettingsHost {
  installation?: {
    status(): Promise<CliInstallationStatus>;
    install(shell?: "bash" | "zsh"): Promise<void>;
    uninstall(removePath: boolean): Promise<void>;
  };
  downloads?: () => Promise<CliDownload[]>;
  access?: CliAccessHost;
}
const hosts = new WeakMap<
  WorkspaceSettingsController,
  { host: CliSettingsHost }
>();
const fieldHosts = new WeakMap<WorkspaceCustomSetting, CliSettingsHost>();
export function cliSettingsFieldHost(
  field: WorkspaceCustomSetting,
): CliSettingsHost {
  const host = fieldHosts.get(field);
  if (!host) throw new Error("CLI settings field host is not bound");
  return host;
}
export function cliSettingsHost(
  controller: WorkspaceSettingsController,
): CliSettingsHost {
  const host = hosts.get(controller);
  if (!host) throw new Error("CLI settings host is not bound");
  return host.host;
}
export function registerCliSettings(
  settings: WorkspaceSettingsController,
  host: CliSettingsHost,
): () => void {
  if (
    !hosts.has(settings) &&
    settings.sections.some((section) => section.id === "general")
  ) {
    throw new Error("General settings already have an owner");
  }
  const entry = { host };
  hosts.set(settings, entry);
  const field: WorkspaceCustomSetting = {
    id: "cli",
    title: "Command line interface",
    description: "Use the lapis command from your terminal.",
    type: "custom",
    presentation: "full-width",
    component: (anchor) => {
      if (hosts.get(settings) !== entry) {
        throw new Error("CLI settings host is not bound");
      }
      CliSettingsField(anchor, { host: entry.host });
      return {};
    },
  };
  fieldHosts.set(field, host);
  const dispose = settings.registerSection({
    id: "general",
    title: "General",
    navigationGroupId: "options",
    order: 0,
    fields: [
      {
        id: "advanced",
        title: "Advanced",
        type: "group",
        fields: [field],
      },
    ],
    searchEntries: [
      {
        id: "cli",
        title: "Command line interface",
        path: ["General", "Advanced"],
        keywords: ["cli", "lapis", "PATH", "install", "terminal"],
      },
    ],
  });
  return () => {
    if (hosts.get(settings) !== entry) {
      fieldHosts.delete(field);
      return;
    }
    dispose();
    hosts.delete(settings);
    fieldHosts.delete(field);
  };
}
