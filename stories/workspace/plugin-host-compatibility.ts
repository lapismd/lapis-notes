import type { StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import type { App } from "@lapis-notes/api";
import { PluginBrowser } from "@lapis-notes/workspace";
import PluginRegistrySnapshotSurface from "./PluginRegistrySnapshotSurface.svelte";

export const desktopOnlyAI: StoryObj<typeof PluginBrowser> = {
  tags: ["visual-pending"],
  parameters: {
    docs: {
      description: {
        story:
          "An older signed registry entry still advertises Web compatibility. Host policy keeps it discoverable while disabling installation with desktop guidance.",
      },
      source: {
        code: `import { App, MemoryVaultAdapter, MemoryAppDatabase } from "@lapis-notes/api";
import { PluginBrowser } from "@lapis-notes/workspace";
const app = new App({
  version: "0.1.0", adapter: new MemoryVaultAdapter({}),
  appDatabase: new MemoryAppDatabase("host-policy"), markdownRenderer: async () => {},
  unavailablePlugins: { ai: "desktop-only", terminal: "desktop-only" },
});
await app.vault.load();
await app.configuration.load();
await app.pluginDistribution.refreshCatalog();
<PluginBrowser {app} />`,
        language: "svelte",
        type: "code",
      },
    },
  },
  render: () => ({
    Component: PluginRegistrySnapshotSurface,
    props: {
      browserState: { route: { page: "plugin", pluginId: "ai" } },
      unavailablePlugins: { ai: "desktop-only", terminal: "desktop-only" },
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector(
      '[data-testid="registry-snapshot-story"]',
    ) as HTMLElement & { __lapisApp: App };
    await waitFor(() => expect(root?.__lapisApp).toBeDefined());
    await waitFor(() =>
      expect(root).toHaveAttribute("data-app-shell-ready", "true"),
    );
    expect(root.__lapisApp.pluginDistribution.getCompatibility?.("ai")).toEqual(
      { compatible: false, reasons: ["desktop-only"] },
    );
    const install = await canvas.findByRole("button", {
      name: "Install unavailable",
      exact: true,
    });
    await expect(install).toBeDisabled();
    expect(install).toHaveAttribute(
      "title",
      "This plugin is available in the desktop app.",
    );
  },
};
