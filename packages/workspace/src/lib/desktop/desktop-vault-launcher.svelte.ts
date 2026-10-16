import type { VaultProfile } from "@lapis-notes/api";
import { fuzzySearch } from "@lapis-notes/ui";
import {
  getVaultProfileLocation,
  type DesktopLauncherAppearance,
  type DesktopVaultLauncherHost,
} from "./desktop-vault-launcher";

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** State from the Deno chooser, shared without depending on a native bridge. */
export class DesktopVaultLauncherState {
  recentVaults = $state.raw<VaultProfile[]>([]);
  recentVaultQuery = $state("");
  recentVaultDialogOpen = $state(false);
  settingsOpen = $state(false);
  appearanceMode = $state<DesktopLauncherAppearance>("system");
  activeActionId = $state<string | null>(null);
  renameDialogOpen = $state(false);
  renameDialogName = $state("");
  renameTarget = $state.raw<VaultProfile | null>(null);
  actionError = $state("");
  actionMessage = $state("");

  constructor(readonly host: DesktopVaultLauncherHost) {}

  get inlineRecentVaults() {
    return this.recentVaults.slice(0, 4);
  }
  get filteredRecentVaults() {
    const entries = this.recentVaults.map((profile) => ({
      profile,
      name: profile.name,
      location: getVaultProfileLocation(profile),
      kind: profile.kind,
    }));
    return this.recentVaultQuery.trim()
      ? fuzzySearch(entries, this.recentVaultQuery, {
          keys: ["name", "location", "kind"],
        }).map((result) => result.item)
      : entries;
  }

  applyAppearance(mode: DesktopLauncherAppearance): void {
    const dark =
      mode === "system"
        ? (globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ??
          false)
        : mode === "dark";
    for (const name of ["dark", "theme-dark"])
      document.documentElement.classList.toggle(name, dark);
    for (const name of ["light", "theme-light"])
      document.documentElement.classList.toggle(name, !dark);
  }

  async refresh(): Promise<void> {
    try {
      [this.recentVaults, this.appearanceMode] = await Promise.all([
        this.host.listProfiles(),
        this.host.getAppearance(),
      ]);
      this.applyAppearance(this.appearanceMode);
    } catch (error) {
      this.actionError = formatError(error);
    }
  }

  async invoke(action: () => Promise<void>): Promise<void> {
    this.actionError = "";
    this.actionMessage = "";
    try {
      await action();
    } catch (error) {
      this.actionError = formatError(error);
    }
  }

  async runAction(
    profile: VaultProfile,
    action: () => Promise<void>,
    message = "",
  ): Promise<void> {
    this.activeActionId = profile.id;
    this.actionError = "";
    this.actionMessage = "";
    try {
      await action();
      await this.refresh();
      this.actionMessage = message;
    } catch (error) {
      this.actionError = formatError(error);
    } finally {
      this.activeActionId = null;
    }
  }

  openRenameDialog(profile: VaultProfile): void {
    this.renameTarget = profile;
    this.renameDialogName = profile.name;
    this.renameDialogOpen = true;
  }

  async submitRename(): Promise<void> {
    if (!this.renameTarget || !this.host.rename) return;
    const name = this.renameDialogName.trim();
    if (!name) {
      this.actionError = "Vault name is required";
      return;
    }
    const profile = this.renameTarget;
    await this.runAction(
      profile,
      () => this.host.rename!(profile, name),
      "Vault renamed",
    );
    if (!this.actionError) this.renameDialogOpen = false;
  }

  async moveRecentVault(profile: VaultProfile): Promise<void> {
    if (!this.host.move) return;
    this.activeActionId = profile.id;
    this.actionError = "";
    this.actionMessage = "";
    try {
      if (!(await this.host.move(profile))) return;
      await this.refresh();
      this.actionMessage = "Vault moved";
    } catch (error) {
      this.actionError = formatError(error);
    } finally {
      this.activeActionId = null;
    }
  }

  copyVaultId(profile: VaultProfile): Promise<void> {
    return this.runAction(
      profile,
      () => this.host.copyId!(profile),
      "Vault ID copied",
    );
  }
  revealRecentVault(profile: VaultProfile): Promise<void> {
    return this.runAction(profile, () => this.host.reveal!(profile));
  }
  removeRecentVault(profile: VaultProfile): Promise<void> {
    return this.runAction(
      profile,
      () => this.host.remove!(profile),
      "Vault removed from recent projects",
    );
  }
  async updateAppearance(mode: DesktopLauncherAppearance): Promise<void> {
    await this.invoke(async () => {
      await this.host.saveAppearance(mode);
      this.appearanceMode = mode;
      this.applyAppearance(mode);
    });
  }
}
