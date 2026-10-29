import "./Plugins.docs.css";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { PluginBrowser } from "@lapis-notes/workspace";
import type { App, PluginCatalogDetail } from "@lapis-notes/api";
import PluginRegistrySnapshotSurface from "./PluginRegistrySnapshotSurface.svelte";
import { pluginsBrowserLayout } from "./plugins-browser-layout";
import { snapshotKeys, snapshotSource } from "./registry-snapshot";
import provenance from "./registry-snapshot/provenance.json";
import { workspaceCatalogParameters } from "../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "./docs-parameters";

const source = (state: Record<string, unknown>) => `<script lang="ts">
import { onMount } from "svelte";
import { App, MemoryVaultAdapter, MemoryAppDatabase } from "@lapis-notes/api";
import { PluginsView, WorkspaceShell } from "@lapis-notes/workspace";
// Serve the unchanged snapshot v2 directory at /registry-review/v2.
const originalFetch = window.fetch.bind(window);
const transport: typeof fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
  return url.origin === "https://registry.local.lapis.md"
    ? originalFetch("/registry-review" + url.pathname, init)
    : originalFetch(input, init);
};
const app = new App({
  version: "0.1.0",
  configPath: ".lapis/app.json",
  adapter: new MemoryVaultAdapter({
    ".lapis/app.json": "{}",
    ".lapis/workspace.json": JSON.stringify(${JSON.stringify(pluginsBrowserLayout("middle-top-tabs", state), null, 2)})
  }),
  appDatabase: new MemoryAppDatabase("registry-review"),
  markdownRenderer: async () => {}, // No document leaves or signed Markdown in this snapshot.
  pluginDistributionOptions: {
    registries: [${JSON.stringify(snapshotSource)}],
    trustedKeys: ${JSON.stringify(snapshotKeys)},
    fetch: transport
  }
});
app.workspace.registerView("plugins", leaf => new PluginsView(leaf));
let ready = $state(false);
onMount(() => {
  let disposed = false;
  const previousFetch = window.fetch;
  window.fetch = transport;
  void (async () => {
    await app.vault.load();
    await app.configuration.load();
    await app.pluginDistribution.refreshCatalog();
    if (disposed) return;
    await app.workspace.loadLayout();
    if (!disposed) ready = true;
  })();
  return () => {
    disposed = true;
    if (window.fetch === transport) window.fetch = previousFetch;
    void (async () => {
      await app.workspace.disposeWorkspaceHost();
      await app.metadataCache.dispose();
      await app.appDatabase.close();
    })();
  };
});
</script>
{#if ready}<WorkspaceShell {app} />{/if}`;

const meta = {
  title: "Workspace/Plugins Registry Snapshot",
  component: PluginBrowser,
  tags: ["test", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: WORKSPACE_SHELL_DOCS_STORY,
      canvas: { className: "plugins-docs-canvas" },
    },
  },
  argTypes: {
    app: { control: false },
    navigation: { control: false },
    onstatechange: { control: false },
  },
} satisfies Meta<typeof PluginBrowser>;
export default meta;
type Story = StoryObj<typeof PluginRegistrySnapshotSurface>;

const parameters = (
  id: string,
  description: string,
  state: Record<string, unknown>,
) => ({
  ...workspaceCatalogParameters(`workspace-plugins-snapshot-${id}`),
  docs: {
    description: {
      story: `${description} Captured ${provenance.capturedAt.slice(0, 10)} from the local signed release preview; 12 plugins, no Community. This is snapshot evidence, not production registry or install acceptance.`,
    },
    source: { code: source(state), language: "svelte", type: "code" },
  },
});
const render =
  (browserState: Record<string, unknown> = {}) =>
  () => ({
    Component: PluginRegistrySnapshotSurface,
    props: { browserState },
  });
async function ready(element: HTMLElement) {
  await waitFor(() =>
    expect(
      element.querySelector('[data-app-shell-ready="true"]'),
    ).not.toBeNull(),
  );
  const root = element.querySelector(
    '[data-testid="registry-snapshot-story"]',
  ) as HTMLElement & {
    __lapisApp: App;
    __snapshotDetails: Record<string, PluginCatalogDetail>;
  };
  const app = root.__lapisApp;
  expect(app.pluginDistribution.search()).toHaveLength(12);
  expect(Object.keys(root.__snapshotDetails)).toHaveLength(12);
  expect(app.pluginDistribution.getCatalogEntry("community")).toBeUndefined();
  expect(app.pluginDistribution.listSources()).toHaveLength(1);
  expect(app.pluginDistribution.listSources()[0]).toMatchObject({
    phase: "ready",
    installReady: true,
  });
  for (const entry of app.pluginDistribution.search()) {
    expect(root.__snapshotDetails[entry.id].schemaVersion).toBe(2);
    expect(entry.detail).toBe(
      `https://registry.local.lapis.md/v2/plugins/${entry.id}.json`,
    );
    expect(root.__snapshotDetails[entry.id].latestVersion).toBe(
      entry.latestVersion,
    );
  }
  return { canvas: within(element), app, details: root.__snapshotDetails };
}

export const Landing: Story = {
  render: render(),
  parameters: parameters(
    "landing",
    "The homepage uses the actual catalog's category counts and optional-field fallbacks.",
    {},
  ),
  play: async ({ canvasElement }) => {
    const { canvas } = await ready(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Categories" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "AI, 1 plugin" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Graph, 1 plugin" }),
    ).toBeVisible();
  },
};
const directory = { route: { page: "directory" } };
export const Directory: Story = {
  render: render(directory),
  parameters: parameters(
    "directory",
    "All 12 real release-preview entries, with filters and search.",
    directory,
  ),
  play: async ({ canvasElement }) => {
    const { canvas } = await ready(canvasElement);
    await expect(
      await canvas.findByText("12 results", { exact: true }),
    ).toBeVisible();
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Search registry plugins" }),
      "Graph",
    );
    await expect(
      await canvas.findByText("1 result", { exact: true }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Open Graph" }),
    ).toBeVisible();
    await userEvent.clear(
      canvas.getByRole("textbox", { name: "Search registry plugins" }),
    );
    await expect(
      await canvas.findByText("12 results", { exact: true }),
    ).toBeVisible();
  },
};
const graph = { route: { page: "plugin", pluginId: "lapis-graph" } };
export const GraphDetails: Story = {
  render: render(graph),
  parameters: parameters(
    "graph-details",
    "Graph 0.1.3 with its distinct banner, overview, two gallery images, author and structured release notes.",
    graph,
  ),
  play: async ({ canvasElement }) => {
    const { canvas, details } = await ready(canvasElement);
    const detail = details["lapis-graph"];
    expect(detail.latestVersion).toBe("0.1.3");
    expect(detail.gallery).toHaveLength(2);
    expect(detail.appearance?.logo).toBeUndefined();
    expect(detail.content).toBeUndefined();
    await expect(
      await canvas.findByRole("heading", { name: "Graph" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Install in Lapis" }),
    ).toBeEnabled();
    const banner = await canvas.findByRole("button", {
      name: `Open Graph banner: ${detail.media!.banner!.alt}`,
    });
    await waitFor(() =>
      expect(banner.querySelector("img")?.naturalWidth).toBeGreaterThan(0),
    );
    await userEvent.click(banner);
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole("heading", {
      name: "Graph media viewer",
    });
    for (const mode of ["Dark", "Light", "Split"]) {
      await userEvent.click(body.getByRole("radio", { name: mode }));
      await expect(body.getByRole("radio", { name: mode })).toBeChecked();
      await waitFor(() => {
        const viewer = body.getByRole("dialog");
        expect(viewer.querySelector("img")?.naturalWidth).toBeGreaterThan(0);
      });
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
    await userEvent.click(canvas.getByRole("tab", { name: "Changelog" }));
    await expect(
      await canvas.findByText("Graph 0.1.3", { exact: true }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: /^Releases/ }));
    await expect(
      await within(
        canvas.getByRole("tabpanel", { name: /^Releases/ }),
      ).findByText("0.1.3", { exact: true }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: "Overview" }));
  },
};
const ai = { route: { page: "plugin", pluginId: "ai" } };
export const AiDetails: Story = {
  render: render(ai),
  parameters: parameters(
    "ai-details",
    "AI 0.1.4 with its actual three-image gallery and available schema fields.",
    ai,
  ),
  play: async ({ canvasElement }) => {
    const { canvas, details } = await ready(canvasElement);
    expect(details.ai.latestVersion).toBe("0.1.4");
    expect(details.ai.gallery).toHaveLength(3);
    await expect(
      await canvas.findByRole("heading", { name: "AI" }),
    ).toBeVisible();
    const banner = await canvas.findByRole("button", {
      name: `Open AI banner: ${details.ai.media!.banner!.alt}`,
    });
    await waitFor(() =>
      expect(banner.querySelector("img")?.naturalWidth).toBeGreaterThan(0),
    );
  },
};
