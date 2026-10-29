import { createLapisFileUrl, Notice, type App } from "@lapis-notes/api";
import {
  getNativeDesktopPlatform,
  hasNativeDesktopCapability,
  NativeDesktopVaultAdapter,
  openNativeDesktopVaultPath,
  resolveNativeDesktopVaultPath,
  revealNativeDesktopVaultPath,
  type NativeDesktopPlatformOs,
} from "@lapis-notes/api/desktop-native";
import type { ExplorerNode } from "@lapismd/design-core/workspace/explorer";
import type { WorkspaceMenu } from "@lapismd/design-core/workspace/core";

export function hasNativeExplorerActions(
  adapter: App["vault"]["adapter"],
): adapter is NativeDesktopVaultAdapter {
  return (
    adapter instanceof NativeDesktopVaultAdapter &&
    hasNativeDesktopCapability("file-system-actions")
  );
}

export function revealInFileManagerLabel(
  os: NativeDesktopPlatformOs | undefined,
): string {
  if (os === "macos") return "Reveal in Finder";
  if (os === "windows") return "Reveal in File Explorer";
  return "Reveal in file manager";
}

export async function copyExplorerText(
  app: App,
  label: string,
  value: string,
): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText)
    throw new Error("Clipboard is unavailable");
  await navigator.clipboard.writeText(value);
  new Notice(`Copied ${label}`, undefined, app);
}

function vaultPath(node: ExplorerNode): string {
  return node.path === "/" ? "/" : node.path;
}

export function appendNativeExplorerMenu(
  menu: WorkspaceMenu,
  node: ExplorerNode,
  app: App,
): void {
  const adapter = app.vault.adapter;
  if (!hasNativeExplorerActions(adapter)) return;

  const copyPath = menu.entries.find(
    (entry) => entry.kind === "submenu" && entry.title === "Copy Path",
  );
  if (copyPath?.kind === "submenu") {
    copyPath.menu.addItem((item) =>
      item
        .setTitle("From system root")
        .onClick(() => copySystemRootPath(app, adapter, node)),
    );
    if (node.kind === "file") {
      copyPath.menu.addItem((item) =>
        item.setTitle("As Lapis URL").onClick(() => {
          return copyExplorerText(
            app,
            "Lapis URL",
            createLapisFileUrl(app.vault.getName(), vaultPath(node)),
          ).catch((error) => {
            report(app, error);
          });
        }),
      );
    }
  }

  menu.addSeparator();
  menu.addItem((item) =>
    item
      .setTitle("Open in default app")
      .onClick(() => openVaultPath(app, adapter, node)),
  );
  menu.addItem((item) =>
    item
      .setTitle(revealInFileManagerLabel(getNativeDesktopPlatform()?.os))
      .onClick(() => revealVaultPath(app, adapter, node)),
  );
}

async function copySystemRootPath(
  app: App,
  adapter: NativeDesktopVaultAdapter,
  node: ExplorerNode,
): Promise<void> {
  try {
    const absolute = await resolveNativeDesktopVaultPath(
      adapter.rootPath,
      vaultPath(node),
    );
    if (!absolute) throw new Error("Unable to resolve the system path");
    await copyExplorerText(app, "system path", absolute);
  } catch (error) {
    report(app, error);
  }
}

async function openVaultPath(
  app: App,
  adapter: NativeDesktopVaultAdapter,
  node: ExplorerNode,
): Promise<void> {
  try {
    await openNativeDesktopVaultPath(adapter.rootPath, vaultPath(node));
  } catch (error) {
    report(app, error);
  }
}

async function revealVaultPath(
  app: App,
  adapter: NativeDesktopVaultAdapter,
  node: ExplorerNode,
): Promise<void> {
  try {
    await revealNativeDesktopVaultPath(adapter.rootPath, vaultPath(node));
  } catch (error) {
    report(app, error);
  }
}

function report(app: App, error: unknown): void {
  new Notice(
    error instanceof Error ? error.message : String(error),
    undefined,
    app,
  );
}
