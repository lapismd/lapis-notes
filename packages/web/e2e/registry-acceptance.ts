import { expect, type Page } from "@playwright/test";
import type { PluginDistributionManager } from "@lapis-notes/api/plugin-distribution-host";

type RegistryAcceptanceApp = {
  pluginDistribution: PluginDistributionManager;
  plugins: {
    isPluginEnabled(id: string): boolean;
    getCommunityPluginDiagnostics(id: string): unknown;
  };
  vault: {
    adapter: { read(path: string): Promise<string> };
  };
};

export async function installRegistryPlugin(
  page: Page,
  pluginId: string,
  activation: "immediate" | "deferred-service" = "immediate",
): Promise<void> {
  const installed = await page.evaluate(async (id) => {
    const app = (window as typeof window & { app: RegistryAcceptanceApp }).app;
    await app.pluginDistribution.refreshCatalog({ force: true });
    const entry = app.pluginDistribution.getCatalogEntry(id);
    if (!entry) throw new Error(`Registry has no release for ${id}`);
    const record = await app.pluginDistribution.install(id, { enable: true });
    return {
      id: record.pluginId,
      version: record.installedVersion,
      expectedVersion: entry.latestVersion,
      enabled: app.plugins.isPluginEnabled(id),
      checksum: record.releaseManifestSha256,
      provenance: record.provenance,
      restartRequired: record.restartRequired,
      diagnostics: app.plugins.getCommunityPluginDiagnostics(id),
      serviceWorkerControlled: Boolean(navigator.serviceWorker.controller),
    };
  }, pluginId);
  expect(installed.id).toBe(pluginId);
  expect(installed.version).toBe(installed.expectedVersion);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const app = (window as typeof window & { app: RegistryAcceptanceApp })
          .app;
        return JSON.parse(
          await app.vault.adapter.read(".lapis/community-plugins.json"),
        ) as string[];
      }),
    )
    .toContain(pluginId);
  expect(installed.restartRequired).toBe(false);
  if (activation === "deferred-service") {
    expect(installed.enabled, JSON.stringify(installed)).toBe(false);
    expect(installed.diagnostics).toMatchObject({
      state: "dormant",
      activationMode: "not-activated",
      lastFailureMessage: null,
    });
  } else {
    expect(installed.enabled, JSON.stringify(installed)).toBe(true);
  }
  expect(installed.checksum).toMatch(/^[a-f0-9]{64}$/u);
  expect(installed.provenance).toBeDefined();
}

export async function createBrowserVault(
  page: Page,
  name: string,
): Promise<void> {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Create a vault" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Return to previous vault" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Create New Vault/ }).click();
  const dialog = page.getByRole("dialog", { name: "New Browser Vault" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Create vault" }),
  ).toBeDisabled();
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Create vault" }).click();
  await expect(
    page.getByRole("button", { name: /Current workspace:/ }),
  ).toContainText(name);
  await expect(page.getByText("DB Owner", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => {
      const app = (
        window as typeof window & {
          app: {
            plugins: {
              plugins: Map<string, { enabled: boolean }>;
            };
          };
        }
      ).app;
      return [...app.plugins.plugins.entries()]
        .map(([id, plugin]) => ({ id, enabled: plugin.enabled }))
        .sort((left, right) => left.id.localeCompare(right.id));
    }),
  ).toEqual([
    { id: "lapis-file-explorer", enabled: true },
    { id: "lapis-source-editor", enabled: true },
    { id: "markdown", enabled: true },
    { id: "search", enabled: true },
  ]);
}
