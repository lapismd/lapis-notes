import { expect, test } from "@playwright/test";
import { createBrowserVault } from "./registry-acceptance";

// The serialized browser boundary follows the existing host-acceptance ports.
type BrowserApp = {
  vault: {
    mkpath(path: string): Promise<void>;
    adapter: {
      write(path: string, value: string): Promise<void>;
      read(path: string): Promise<string>;
    };
  };
  configuration: {
    updatePluginData(id: string, value: unknown): Promise<void>;
    updateConfigurationOption(key: string, value: unknown): Promise<void>;
    getPluginData(id: string): unknown;
  };
  workspace: {
    getBottomLeaf(): {
      setViewState(state: {
        type: string;
        state: Record<string, unknown>;
      }): Promise<void>;
    };
    flushLayout(): Promise<void>;
  };
  fileEditingSessions: { settleOperations(): Promise<void> };
  plugins: {
    plugins: Map<string, unknown>;
    getCommunityPluginDiagnostics(
      id: string,
    ): { lastFailureMessage: string | null } | undefined;
  };
};

test("cold Web skips legacy AI and Terminal without connections or data loss", async ({
  page,
}) => {
  const sockets: string[] = [];
  page.on("websocket", (socket) => sockets.push(socket.url()));
  await createBrowserVault(page, "Retained desktop features");
  const originalInstallation = await page.evaluate(async () => {
    const app = (window as unknown as { app: BrowserApp }).app;
    for (const id of ["ai", "terminal"]) {
      const path = `.lapis/plugins/${id}`;
      await app.vault.mkpath(path);
      await app.vault.adapter.write(
        `${path}/manifest.json`,
        JSON.stringify({
          id,
          name: id,
          version: "1.0.0",
          minAppVersion: "0.0.0",
          author: "legacy",
          description: "Retained older Web installation",
          isDesktopOnly: false,
          supportedRuntimes: ["web"],
        }),
      );
      await app.vault.adapter.write(
        `${path}/main.js`,
        `
        globalThis.__retiredDesktopPluginEvaluated = true;
        module.exports = class extends require("obsidian").Plugin {};
      `,
      );
      await app.vault.adapter.write(
        `${path}/data.json`,
        JSON.stringify({ retained: id }),
      );
    }
    await app.vault.adapter.write(
      ".lapis/community-plugins.json",
      '["ai","terminal"]',
    );
    const timestamp = new Date(0).toISOString();
    const installed = JSON.stringify({
      schemaVersion: 1,
      updatedAt: timestamp,
      plugins: Object.fromEntries(
        ["ai", "terminal"].map((pluginId) => [
          pluginId,
          {
            pluginId,
            installedVersion: "1.0.0",
            installedAt: timestamp,
            updatedAt: timestamp,
            provenance: "official",
            files: [],
            enabled: pluginId === "ai",
            retained: "keep-installation-fields",
          },
        ]),
      ),
    });
    await app.vault.adapter.write(".lapis/installed-plugins.json", installed);
    await app.configuration.updatePluginData("ai", {
      conversations: [{ id: "kept-chat", text: "Keep this" }],
    });
    await app.configuration.updatePluginData("terminal", {
      shell: "/bin/sh",
      cwd: "notes",
    });
    for (const prefix of ["web.agentRuntime", "web.terminalHost"]) {
      await app.configuration.updateConfigurationOption(
        `${prefix}.url`,
        "ws://127.0.0.1:43199",
      );
      await app.configuration.updateConfigurationOption(
        `${prefix}.token`,
        "obsolete-secret",
      );
    }
    await app.configuration.updateConfigurationOption(
      "other.token",
      "keep-unrelated",
    );
    const leaf = app.workspace.getBottomLeaf();
    await leaf.setViewState({
      type: "terminal",
      state: { retainedMarker: "keep-terminal-view" },
    });
    await app.workspace.flushLayout();
    await app.fileEditingSessions.settleOperations();
    return installed;
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Current workspace:/ }),
  ).toContainText("Retained desktop features");
  const retained = await page.evaluate(async () => {
    const app = (window as unknown as { app: BrowserApp }).app;
    const read = (path: string) => app.vault.adapter.read(path);
    return {
      evaluated: Boolean(
        (window as unknown as Record<string, unknown>)
          .__retiredDesktopPluginEvaluated,
      ),
      active: ["ai", "terminal"].filter((id) => app.plugins.plugins.has(id)),
      failures: ["ai", "terminal"].map(
        (id) =>
          app.plugins.getCommunityPluginDiagnostics(id)?.lastFailureMessage,
      ),
      data: [
        app.configuration.getPluginData("ai"),
        app.configuration.getPluginData("terminal"),
      ],
      configuration: JSON.parse(await read(".lapis/app.json")),
      enabled: JSON.parse(await read(".lapis/community-plugins.json")),
      installedRecords: await read(".lapis/installed-plugins.json"),
      layout: await read(".lapis/workspace.json"),
      installedData: await Promise.all(
        ["ai", "terminal"].map(async (id) =>
          JSON.parse(await read(`.lapis/plugins/${id}/data.json`)),
        ),
      ),
    };
  });
  expect(retained.evaluated).toBe(false);
  expect(retained.active).toEqual([]);
  expect(retained.failures).toHaveLength(2);
  for (const failure of retained.failures)
    expect(failure).toContain("desktop-only");
  expect(retained.data).toEqual([
    { conversations: [{ id: "kept-chat", text: "Keep this" }] },
    { shell: "/bin/sh", cwd: "notes" },
  ]);
  expect(Object.hasOwn(retained.configuration, "web.agentRuntime.token")).toBe(
    false,
  );
  expect(Object.hasOwn(retained.configuration, "web.terminalHost.token")).toBe(
    false,
  );
  expect(retained.configuration["other.token"]).toBe("keep-unrelated");
  expect(retained.enabled).toEqual(["ai", "terminal"]);
  expect(retained.installedRecords).toBe(originalInstallation);
  expect(retained.layout).toContain("keep-terminal-view");
  expect(retained.installedData).toEqual([
    { retained: "ai" },
    { retained: "terminal" },
  ]);
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  await expect(page.getByText("Agent server", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Terminal server", { exact: true })).toHaveCount(
    0,
  );
  expect(sockets.filter((url) => url.includes(":43199"))).toEqual([]);
});
