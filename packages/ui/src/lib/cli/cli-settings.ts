import type {
  WorkspaceCustomFieldAdapter,
  WorkspaceCustomSetting,
  WorkspaceSettingsController,
  WorkspaceSettingsSection,
  WorkspaceSettingsSource,
} from "@lapismd/design-core/workspace/settings";
import CliSettingsControl from "./CliSettingsControl.svelte";
import { CliSettingsState } from "./cli-settings-state.svelte";

export interface CliInstallationStatus {
  state: "not-installed" | "installed" | "broken" | "conflict";
  destination: string;
  version: string;
}
export interface CliDownload {
  /** Human-readable override; release manifests may rely on target instead. */
  label?: string;
  /** Rust release target, such as aarch64-apple-darwin. */
  target?: string;
  file?: string;
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
type CliSettingsControlKind =
  | "status-badge"
  | "status-path"
  | "installation-action"
  | "installation-error"
  | "refresh"
  | "platform"
  | "checksum"
  | "commands"
  | "access";
type SettingsField = NonNullable<WorkspaceSettingsSection["fields"]>[number];
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
  const state = new CliSettingsState(host);
  const ownedFields: WorkspaceCustomSetting[] = [];
  const adapters: WorkspaceCustomFieldAdapter[] = [];
  function controlComponent(kind: CliSettingsControlKind, id: string) {
    return (anchor: Parameters<typeof CliSettingsControl>[0]) => {
      if (hosts.get(settings) !== entry) {
        throw new Error("CLI settings host is not bound");
      }
      CliSettingsControl(anchor, {
        model: state,
        kind,
        controlId: `setting-${id}`,
      });
      return {};
    };
  }
  function customField(
    id: string,
    title: string,
    description: string,
    kind: CliSettingsControlKind,
    presentation: "row" | "full-width" = "row",
  ): WorkspaceCustomSetting {
    const field: WorkspaceCustomSetting = {
      id,
      title,
      description,
      type: "custom",
      presentation,
      component: controlComponent(kind, id),
    };
    fieldHosts.set(field, host);
    ownedFields.push(field);
    return field;
  }
  const advancedFields: SettingsField[] = [];
  if (host.installation) {
    const statusField: WorkspaceCustomSetting = {
      id: "cli.status",
      title: "Status",
      description: "Check the installed command and bundled CLI version.",
      type: "custom",
      adapter: "lapis.cli.status",
      presentation: "full-width",
    };
    fieldHosts.set(statusField, host);
    ownedFields.push(statusField);
    adapters.push({
      id: "lapis.cli.status",
      component: controlComponent("status-path", statusField.id),
      headerComponent: controlComponent(
        "status-badge",
        `${statusField.id}-badge`,
      ),
    });
    const installationField: WorkspaceCustomSetting = {
      id: "cli.installation",
      title: "Installation",
      description: "Install, repair or remove the per-user terminal command.",
      type: "custom",
      adapter: "lapis.cli.installation",
      presentation: "full-width",
    };
    fieldHosts.set(installationField, host);
    ownedFields.push(installationField);
    adapters.push({
      id: "lapis.cli.installation",
      component: controlComponent(
        "installation-error",
        `${installationField.id}-error`,
      ),
      headerComponent: controlComponent(
        "installation-action",
        installationField.id,
      ),
    });
    advancedFields.push(statusField, installationField);
  }
  advancedFields.push(
    customField(
      "cli.refresh",
      "Refresh status",
      "Check the bundled CLI and available downloads again.",
      "refresh",
    ),
  );
  const groups: SettingsField[] = [
    {
      id: "advanced",
      title: "Advanced",
      description: "Configure the Lapis command-line interface.",
      type: "group",
      fields: advancedFields,
    },
  ];
  if (host.downloads) {
    groups.push({
      id: "cli.browser-installation",
      title: "Browser installation",
      description:
        "Choose the matching archive, verify it, and install the command locally.",
      type: "group",
      fields: [
        customField(
          "cli.platform",
          "Platform",
          "Choose your operating system and architecture.",
          "platform",
        ),
        customField(
          "cli.checksum",
          "SHA-256",
          "Copy the checksum to verify the downloaded archive.",
          "checksum",
        ),
        customField(
          "cli.commands",
          "Install from the archive",
          "Run these commands after extracting the archive. Choose Bash or Zsh for PATH setup; for another shell, add ~/.local/bin manually.",
          "commands",
          "full-width",
        ),
      ],
    });
  }
  if (host.access) {
    groups.push({
      id: "cli.desktop-access",
      title: "Desktop access",
      description:
        "Allow explicitly scoped commands while the desktop app is running.",
      type: "group",
      fields: [
        customField(
          "cli.access",
          "Connect to desktop vaults",
          "Installing the command does not enable access.",
          "access",
          "full-width",
        ),
      ],
    });
  }
  const section: WorkspaceSettingsSection = {
    id: "general",
    title: "General",
    navigationGroupId: "options",
    order: 0,
    fields: groups,
    searchEntries: [
      {
        id: "cli",
        title: "Command line interface",
        path: ["General", "Advanced"],
        keywords: ["cli", "lapis", "PATH", "install", "terminal"],
      },
    ],
  };
  const source: WorkspaceSettingsSource = {
    get: () => undefined,
    set: async () => undefined,
    subscribe: () => () => undefined,
  };
  const dispose = settings.registerDefinition({ section, source, adapters });
  return () => {
    if (hosts.get(settings) !== entry) {
      for (const field of ownedFields) fieldHosts.delete(field);
      state.dispose();
      return;
    }
    dispose();
    hosts.delete(settings);
    for (const field of ownedFields) fieldHosts.delete(field);
    state.dispose();
  };
}
