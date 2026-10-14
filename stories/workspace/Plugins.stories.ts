import "./Plugins.docs.css";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { PluginBrowser } from "@lapis-notes/workspace";
import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { WORKSPACE_SHELL_DOCS_STORY } from "./docs-parameters";
import { workspaceCatalogParameters } from "../catalog/catalog.mjs";
import PluginManagementSurface from "./PluginManagementSurface.svelte";
import {
  pluginsBrowserLayout,
  pluginsBrowserOpeningLayout,
  type PluginsPlacement,
} from "./plugins-browser-layout";

const exampleFor = (
  placement: PluginsPlacement,
) => `import { App, MemoryVaultAdapter, MemoryAppDatabase } from "@lapis-notes/api";
import { PluginsView, WorkspaceShell } from "@lapis-notes/workspace";
const adapter = new MemoryVaultAdapter({ ".obsidian/workspace.json": JSON.stringify(${JSON.stringify(pluginsBrowserLayout(placement), null, 2)}) });
const app = new App({ adapter, appDatabase: new MemoryAppDatabase("plugins-review") });
app.workspace.registerView("plugins", leaf => new PluginsView(leaf));
await app.vault.load();
await app.configuration.load();
await app.workspace.loadLayout();
<WorkspaceShell {app} />`;
const example = exampleFor("middle-top-tabs");
const appLinkExample = example
  .replace(
    'from "@lapis-notes/api";',
    'from "@lapis-notes/api";\nimport { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";',
  )
  .replace(
    "PluginsView, WorkspaceShell",
    "PluginsView, WorkspaceShell, openPluginBrowser",
  )
  .replace(
    "await app.workspace.loadLayout();",
    "await app.workspace.loadLayout();\nawait getWorkspaceHostBinding(app.workspace).controller.start();",
  )
  .replace(
    "<WorkspaceShell {app} />",
    `let active = true;
const unregisterLink = app.urls.registerProtocolHandler("plugins", async params => {
  if (!active || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(params.id ?? "")) return;
  if (params.version !== undefined && !/^[A-Za-z0-9][A-Za-z0-9.+-]{0,127}$/.test(params.version)) return;
  await openPluginBrowser(app, params.id, () => active, params.version);
  if (active) getWorkspaceHostBinding(app.workspace).controller.settings.close();
});
// Select a version indexed by the configured registry.
await app.urls.dispatch("lapis://plugins?id=lapis-graph&version=2026.6.6");
// During App teardown: active = false; unregisterLink();
<WorkspaceShell {app} />`,
  );
const placementParameters = (placement: PluginsPlacement, story: string) => ({
  ...workspaceCatalogParameters(
    `workspace-plugins-${placement === "sidebar-group" ? "sidebar-as-a-group" : placement}`,
  ),
  docs: {
    description: { story },
    source: { code: exampleFor(placement), language: "svelte", type: "code" },
  },
});
const meta = {
  title: "Workspace/Plugins",
  component: PluginBrowser,
  tags: ["test", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      story: WORKSPACE_SHELL_DOCS_STORY,
      canvas: { className: "plugins-docs-canvas" },
      source: { code: example, language: "svelte", type: "code" },
    },
  },
  argTypes: {
    app: { control: false },
    navigation: { control: false },
    onstatechange: { control: false },
  },
} satisfies Meta<typeof PluginBrowser>;
export default meta;
type Story = StoryObj<typeof meta>;
const render =
  (
    placement: PluginsPlacement,
    scenario:
      | "catalog"
      | "catalog-v2"
      | "community-reference"
      | "updates"
      | "installed"
      | "failure"
      | "install-failure"
      | "empty" = "community-reference",
    browserState: Record<string, unknown> = {},
  ) =>
  () => ({
    Component: PluginManagementSurface,
    props: { surface: "browser", placement, scenario, browserState },
  });
async function ready(element: HTMLElement) {
  await waitFor(() =>
    expect(
      element.querySelector('[data-app-shell-ready="true"]'),
    ).not.toBeNull(),
  );
  await waitFor(() =>
    expect(
      element.querySelectorAll('[data-ui-component="plugin-browser"]'),
    ).toHaveLength(1),
  );
  await waitFor(() =>
    expect(getComputedStyle(element.ownerDocument.body).pointerEvents).not.toBe(
      "none",
    ),
  );
  const canvas = within(element);
  return canvas;
}
function placementPlay(placement: PluginsPlacement) {
  return async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Make Lapis Notes yours." });
    await expect(
      canvas.getByRole("heading", { name: "Categories" }),
    ).toBeVisible();
    const browser = canvasElement.querySelector(
      '[data-ui-component="plugin-browser"]',
    ) as HTMLElement;
    const hosts = {
      "middle-top-tabs": "workspace-tabs",
      "stacked-tabs": "workspace-stacked-tabs",
      "left-sidebar": "workspace-sidebar",
      "right-sidebar": "workspace-sidebar",
      "bottom-panel": "workspace-bottom-panel-group",
      "sidebar-group": "workspace-sidebar-group",
    };
    expect(
      browser.closest(`[data-ui-component="${hosts[placement]}"]`),
    ).not.toBeNull();
    const viewHost = browser.closest(
      '[data-ui-component="workspace-view-host"]',
    ) as HTMLElement;
    expect(viewHost).not.toBeNull();
    expect(getComputedStyle(browser).backgroundColor).toBe(
      getComputedStyle(viewHost).backgroundColor,
    );
    await userEvent.click(
      canvas.getByRole("link", { name: "AI, 1 plugin", exact: true }),
    );
    await userEvent.click(
      canvas.getByRole("link", { name: "Open AI Assistant", exact: true }),
    );
    await canvas.findByRole("heading", { name: "AI Assistant", exact: true });
    const detailBreadcrumbs = browser.querySelector(
      '[data-ui-part="registry-detail-breadcrumbs"]',
    );
    expect(detailBreadcrumbs).not.toBeNull();
    if (placement === "left-sidebar" || placement === "right-sidebar") {
      await expect(detailBreadcrumbs).toBeVisible();
      expect(detailBreadcrumbs).toHaveTextContent("Registry");
      expect(detailBreadcrumbs).toHaveTextContent("Plugins");
      expect(detailBreadcrumbs).toHaveTextContent("AI Assistant");
    } else {
      await expect(detailBreadcrumbs).not.toBeVisible();
    }
    const app = (
      canvasElement.querySelector(
        '[data-testid="plugin-management-story"]',
      ) as HTMLElement & { __lapisApp: App }
    ).__lapisApp;
    const before = app.workspace.getLeavesOfType("plugins")[0];
    const ribbon = canvasElement.querySelector(
      'button[data-hint-target-id="ribbon:app:plugins"]',
    ) as HTMLButtonElement;
    expect(ribbon).toHaveAccessibleName("Plugins");
    await userEvent.click(ribbon);
    await waitFor(() =>
      expect(app.workspace.getLeavesOfType("plugins")).toHaveLength(1),
    );
    expect(app.workspace.getLeavesOfType("plugins")[0]).toBe(before);
  };
}
export const MiddleTopTabs: Story = {
  name: "Middle (Top Tabs)",
  render: render("middle-top-tabs"),
  parameters: placementParameters(
    "middle-top-tabs",
    "The Plugins homepage occupies one main workspace tab; the ribbon reuses it.",
  ),
  play: placementPlay("middle-top-tabs"),
};
export const RibbonOpensPlugins: Story = {
  name: "Ribbon Opens Plugins",
  render: () => ({
    Component: PluginManagementSurface,
    props: {
      surface: "browser",
      scenario: "community-reference",
      initiallyClosed: true,
    },
  }),
  parameters: {
    ...workspaceCatalogParameters("workspace-plugins-ribbon-opens-plugins"),
    docs: {
      description: {
        story:
          "The app ribbon creates and activates Plugins from an empty workspace, then reuses it.",
      },
      source: {
        code: `import { App, MemoryVaultAdapter, MemoryAppDatabase } from "@lapis-notes/api";
import { PluginsView, WorkspaceShell } from "@lapis-notes/workspace";
const app = new App({ adapter: new MemoryVaultAdapter({ ".obsidian/workspace.json": JSON.stringify(${JSON.stringify(pluginsBrowserOpeningLayout(), null, 2)}) }), appDatabase: new MemoryAppDatabase("plugins-opening") });
app.workspace.registerView("plugins", leaf => new PluginsView(leaf));
app.workspace.leftRibbon.addItem({ id: "plugins", title: "Plugins", icon: "package", callback: async () => {
  const leaf = app.workspace.getLeavesOfType("plugins")[0] ?? app.workspace.getLeaf(true);
  if (leaf.view.getViewType() !== "plugins") await leaf.setViewState({ type: "plugins", state: {} });
  if (leaf.view instanceof PluginsView) leaf.view.home();
  await app.workspace.revealLeaf(leaf);
  app.workspace.activateLeaf(leaf);
} });
await app.vault.load();
await app.configuration.load();
await app.workspace.loadLayout();
<WorkspaceShell {app} />`,
        language: "svelte",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-ready="true"]')).not.toBeNull(),
    );
    expect(
      canvas.queryByRole("heading", { name: "Make Lapis Notes yours." }),
    ).toBeNull();
    const ribbon = canvasElement.querySelector<HTMLButtonElement>(
      '[data-hint-target-id="ribbon:app:plugins"]',
    )!;
    await userEvent.click(ribbon);
    await expect(
      await canvas.findByRole("heading", { name: "Make Lapis Notes yours." }),
    ).toBeVisible();
    await userEvent.click(ribbon);
    await waitFor(() =>
      expect(
        canvasElement.querySelectorAll('[data-ui-component="plugin-browser"]'),
      ).toHaveLength(1),
    );
    const app = (
      canvasElement.querySelector(
        '[data-testid="plugin-management-story"]',
      ) as HTMLElement & { __lapisApp: App }
    ).__lapisApp;
    expect(app.workspace.activeLeaf?.view.getViewType()).toBe("plugins");
    expect(app.workspace.getLeavesOfType("plugins")).toHaveLength(1);
  },
};
export const StackedTabs: Story = {
  name: "Stacked Tabs",
  render: render("stacked-tabs"),
  parameters: placementParameters(
    "stacked-tabs",
    "The real Plugins view inside stacked workspace tabs.",
  ),
  play: placementPlay("stacked-tabs"),
};
export const LeftSidebar: Story = {
  name: "Left Sidebar",
  render: render("left-sidebar"),
  parameters: placementParameters(
    "left-sidebar",
    "The Plugins browser responds to a narrow ungrouped left-sidebar host.",
  ),
  play: placementPlay("left-sidebar"),
};
export const RightSidebar: Story = {
  name: "Right Sidebar",
  render: render("right-sidebar"),
  parameters: placementParameters(
    "right-sidebar",
    "The same browser on the right workspace sidebar.",
  ),
  play: placementPlay("right-sidebar"),
};
export const BottomPanel: Story = {
  name: "Bottom Panel",
  render: render("bottom-panel"),
  parameters: placementParameters(
    "bottom-panel",
    "The browser fills a real grouped bottom-panel leaf.",
  ),
  play: placementPlay("bottom-panel"),
};
export const SidebarAsAGroup: Story = {
  name: "Sidebar As a Group",
  render: render("sidebar-group"),
  parameters: placementParameters(
    "sidebar-group",
    "The browser fills a real sidebar group and the ribbon reveals that existing group.",
  ),
  play: placementPlay("sidebar-group"),
};
export const CategoryDetailsAndInstall: Story = {
  parameters: {
    ...workspaceCatalogParameters(
      "workspace-plugins-category-details-and-install",
    ),
    docs: {
      description: {
        story:
          "A category opens the filtered directory and inline verified media details; install feedback and Back preserve the directory.",
      },
    },
  },
  render: render("middle-top-tabs", "catalog-v2"),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Make Lapis Notes yours." });
    await userEvent.click(
      canvas.getByRole("link", {
        name: "Visualization, 1 plugin",
        exact: true,
      }),
    );
    await expect(
      canvas.getByRole("region", {
        name: "Plugin directory results",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Remove Visualization filter" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("link", { name: "Open Graph", exact: true }),
    );
    await expect(
      await canvas.findByRole("heading", { name: "Graph", exact: true }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole("button", { name: /Open Graph banner/ }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: /Open Graph banner/ }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole("heading", { name: "Graph media viewer" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Install in Lapis", exact: true }),
    );
    await expect(
      await canvas.findByRole("button", { name: "Installed", exact: true }),
    ).toBeDisabled();
    const back = canvas.getByRole("button", { name: "Back to plugins" });
    expect(getComputedStyle(back).borderRadius).toBe("50%");
    await userEvent.click(back);
    await expect(
      canvas.getByRole("button", { name: "Remove Visualization filter" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove Visualization filter" }),
    );
    await expect(canvas.getByText("3 results", { exact: true })).toBeVisible();
  },
};
export const UpdatePlugin: Story = {
  parameters: {
    ...workspaceCatalogParameters("workspace-plugins-update-plugin"),
    docs: {
      description: {
        story:
          "Updating a registered plugin uses the shared distribution state and replaces the action with Installed.",
      },
    },
  },
  render: render("middle-top-tabs", "installed"),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Make Lapis Notes yours." });
    await userEvent.click(
      canvas.getByRole("link", { name: "Updates", exact: true }),
    );
    await userEvent.click(
      canvas.getByRole("link", { name: "Open Graph", exact: true }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Update", exact: true }),
    );
    await expect(
      await canvas.findByRole("button", { name: "Installed", exact: true }),
    ).toBeDisabled();
    const header = within(
      canvasElement.querySelector(
        '[data-ui-component="workspace-view-header"]',
      ) as HTMLElement,
    );
    await userEvent.click(
      header.getByRole("button", { name: "Plugins", exact: true }),
    );
    await expect(
      canvas.getByRole("button", {
        name: "Remove Updates filter",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "No plugins match", exact: true }),
    ).toBeVisible();
    await userEvent.click(
      header.getByRole("button", { name: "Registry", exact: true }),
    );
    await expect(
      canvas.queryByRole("region", { name: "Updates", exact: true }),
    ).toBeNull();
  },
};
export const InstallFailure: Story = {
  parameters: {
    ...workspaceCatalogParameters("workspace-plugins-install-failure"),
    docs: {
      description: {
        story:
          "A rejected install remains visible with its diagnostic and a retry action.",
      },
    },
  },
  render: render("middle-top-tabs", "install-failure"),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Make Lapis Notes yours." });
    await userEvent.click(
      canvas.getByRole("link", { name: "Plugins", exact: true }),
    );
    await userEvent.click(
      canvas.getByRole("link", { name: "Open Graph", exact: true }),
    );
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Install in Lapis",
        exact: true,
      }),
    );
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "runtime metadata is invalid",
    );
    await expect(
      canvas.getByRole("button", { name: "Retry install", exact: true }),
    ).toHaveTextContent("Retry install");
  },
};
export const CatalogUnavailable: Story = {
  parameters: {
    ...workspaceCatalogParameters("workspace-plugins-catalog-unavailable"),
    docs: {
      description: {
        story: "Initial catalog errors show a retryable unavailable state.",
      },
    },
  },
  render: render("middle-top-tabs", "failure"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Plugins unavailable" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Retry", exact: true }),
    ).toBeVisible();
  },
};
export const EmptyRegistry: Story = {
  parameters: {
    ...workspaceCatalogParameters("workspace-plugins-empty-registry"),
    docs: {
      description: {
        story: "An empty configured registry renders the shared empty state.",
      },
    },
  },
  render: render("middle-top-tabs", "empty"),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("heading", {
        name: "No plugins available",
      }),
    ).toBeVisible();
  },
};

const reviewParameters = (
  id: string,
  description: string,
  state: Record<string, unknown>,
  placement: PluginsPlacement = "middle-top-tabs",
) => ({
  ...workspaceCatalogParameters(`workspace-plugins-${id}`),
  docs: {
    description: { story: description },
    source: {
      code: exampleFor(placement).replace(
        JSON.stringify(pluginsBrowserLayout(placement), null, 2),
        JSON.stringify(pluginsBrowserLayout(placement, state), null, 2),
      ),
      language: "svelte",
      type: "code",
    },
  },
});
const appLinkParameters = (
  id: string,
  description: string,
  version = "2026.6.6",
) => {
  const parameters = reviewParameters(id, description, {
    route: { page: "landing" },
  });
  return {
    ...parameters,
    docs: {
      ...parameters.docs,
      source: {
        code: appLinkExample.replace("version=2026.6.6", `version=${version}`),
        language: "svelte",
        type: "code",
      },
    },
  };
};
const directoryReview = {
  route: { page: "directory" },
  directory: { categories: ["ai"] },
};
const detailReview = { route: { page: "plugin", pluginId: "ai" } };
export const Directory: Story = {
  name: "Directory",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "community-reference", directoryReview),
  parameters: reviewParameters(
    "directory",
    "Community filter groups, selected checkmarks, removable chips, card/list controls and typography using the same reference plugin data.",
    directoryReview,
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const filter = await canvas.findByRole("button", { name: /^AI\s+1$/ });
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(
      filter.querySelector('[data-filter-icon="check"]'),
    ).not.toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove AI filter", exact: true }),
    );
    await expect(filter).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(filter);
    await expect(
      canvas.getByRole("button", { name: "Remove AI filter", exact: true }),
    ).toBeVisible();
  },
};
export const PluginDetails: Story = {
  name: "Plugin Details",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "community-reference", detailReview),
  parameters: reviewParameters(
    "plugin-details",
    "Community detail hero, author identity, gallery, overview, metadata, health and related-plugin layout; reviews and comments remain excluded.",
    detailReview,
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "AI Assistant", exact: true }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "About", exact: true }),
    ).toBeVisible();
    for (const heading of ["Author", "Related plugins"]) {
      await expect(
        Number(
          getComputedStyle(
            canvas.getByRole("heading", { name: heading, exact: true }),
          ).fontWeight,
        ),
      ).toBeGreaterThanOrEqual(700);
    }
    await expect(
      canvas.getByRole("button", { name: "Install in Lapis", exact: true }),
    ).toBeEnabled();
  },
};
export const PluginChangelog: Story = {
  name: "Plugin Changelog",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "community-reference", detailReview),
  parameters: reviewParameters(
    "plugin-changelog",
    "Community structured changelog cards, version/status chips and typography.",
    detailReview,
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "AI Assistant", exact: true });
    await userEvent.click(
      canvas.getByRole("tab", { name: "Changelog", exact: true }),
    );
    await expect(
      canvas.getByRole("heading", {
        name: "Better defaults, smoother DX",
        exact: true,
      }),
    ).toBeVisible();
  },
};
export const MediaViewer: Story = {
  name: "Media Viewer",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "community-reference", detailReview),
  parameters: reviewParameters(
    "media-viewer",
    "Community full-screen media viewer with the same Split, Light and Dark controls and carousel navigation.",
    detailReview,
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "AI Assistant", exact: true });
    await userEvent.click(
      canvas.getByRole("button", { name: /Open AI Assistant banner/ }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole("radio", { name: "Dark", exact: true }),
    ).toBeChecked();
    await userEvent.click(
      body.getByRole("radio", { name: "Light", exact: true }),
    );
    await expect(
      body.getByRole("radio", { name: "Light", exact: true }),
    ).toBeChecked();
  },
};

export const GraphDetails: Story = {
  name: "Graph Details",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "catalog-v2", {
    route: { page: "plugin", pluginId: "lapis-graph" },
  }),
  parameters: reviewParameters(
    "graph-details",
    "Graph details with distinct banner, overview and three gallery screenshots, each with preview, full, light and dark images.",
    { route: { page: "plugin", pluginId: "lapis-graph" } },
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await expectFixedBodyHeader(
      canvasElement,
      canvas.getByRole("button", { name: "Back to plugins" }),
    );
    await expect(
      await canvas.findByRole("button", { name: /Open Graph banner/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "Author", exact: true }),
    ).toBeVisible();
    for (const heading of ["Author", "About", "Details"]) {
      const el = canvas.getByRole("heading", { name: heading, exact: true });
      await expect(
        Number(getComputedStyle(el).fontWeight),
      ).toBeGreaterThanOrEqual(700);
    }
    const overview = canvas.getByRole("tab", { name: "Overview", exact: true });
    await expect(getComputedStyle(overview, "::after").height).toBe("2px");
    await expect(getComputedStyle(overview, "::after").opacity).toBe("1");
    const expectIndicatorOverDivider = (tab: HTMLElement) => {
      const list = tab.closest('[role="tablist"]') as HTMLElement;
      const indicator = getComputedStyle(tab, "::after");
      const indicatorBottom =
        tab.getBoundingClientRect().bottom -
        parseFloat(getComputedStyle(tab).borderBottomWidth) -
        parseFloat(indicator.bottom);
      const dividerBottom = list.getBoundingClientRect().bottom;
      const dividerTop =
        dividerBottom - parseFloat(getComputedStyle(list).borderBottomWidth);
      expect(
        indicatorBottom - parseFloat(indicator.height),
      ).toBeLessThanOrEqual(dividerTop + 0.01);
      expect(indicatorBottom).toBeCloseTo(dividerBottom, 1);
    };
    expectIndicatorOverDivider(overview);
    await userEvent.click(
      canvas.getByRole("tab", { name: "Changelog", exact: true }),
    );
    await expect(
      canvas.getByRole("tab", { name: "Changelog", exact: true }),
    ).toHaveAttribute("data-state", "active");
    expectIndicatorOverDivider(
      canvas.getByRole("tab", { name: "Changelog", exact: true }),
    );
    const releases = canvas.getByRole("tab", {
      name: "Releases 2",
      exact: true,
    });
    await userEvent.click(releases);
    await expect(releases).toHaveAttribute("data-state", "active");
    expectIndicatorOverDivider(releases);
    await userEvent.click(overview);
  },
};

async function atNarrowPane(
  canvasElement: HTMLElement,
  check: (
    canvas: ReturnType<typeof within>,
    browser: HTMLElement,
  ) => Promise<void>,
) {
  const canvas = await ready(canvasElement);
  const app = (
    canvasElement.querySelector(
      '[data-testid="plugin-management-story"]',
    ) as HTMLElement & { __lapisApp: App }
  ).__lapisApp;
  const renderer = getWorkspaceHostBinding(app.workspace).controller.renderer;
  const previous = renderer.getLayout().right.size;
  const browser = canvasElement.querySelector(
    '[data-ui-component="plugin-browser"]',
  ) as HTMLElement;
  try {
    renderer.setSidebarSize("right", 280);
    await waitFor(() => expect(browser.clientWidth).toBeLessThanOrEqual(280));
    await check(canvas, browser);
  } finally {
    renderer.setSidebarSize("right", previous);
  }
}

export const ResponsiveLanding: Story = {
  name: "Responsive Landing",
  tags: ["visual-pending"],
  render: render("right-sidebar"),
  parameters: reviewParameters(
    "responsive-landing",
    "Category tiles share filter icons and catalog counts; lanes and tiles wrap with the owning pane width.",
    {},
    "right-sidebar",
  ),
  play: async ({ canvasElement }) => {
    await atNarrowPane(canvasElement, async (canvas, browser) => {
      const categories = within(
        await canvas.findByRole("region", { name: "Categories", exact: true }),
      );
      const ai = categories.getByRole("link", {
        name: "AI, 1 plugin",
        exact: true,
      });
      const backup = categories.getByRole("link", {
        name: "Backup, 1 plugin",
        exact: true,
      });
      expect(ai.querySelector("svg")?.innerHTML).not.toBe(
        backup.querySelector("svg")?.innerHTML,
      );
      await waitFor(() => {
        const tiles = ai.parentElement as HTMLElement;
        expect(
          getComputedStyle(tiles).gridTemplateColumns.split(" "),
        ).toHaveLength(1);
        expect(browser.scrollWidth).toBeLessThanOrEqual(
          browser.clientWidth + 1,
        );
      });
    });
  },
};

export const ResponsiveDirectory: Story = {
  name: "Responsive Directory",
  tags: ["visual-pending"],
  render: render("right-sidebar", "community-reference", directoryReview),
  parameters: reviewParameters(
    "responsive-directory",
    "The narrow directory keeps filters reachable from its left-aligned body navigation, with the result count above search and tooltip-only Clear all.",
    directoryReview,
    "right-sidebar",
  ),
  play: async ({ canvasElement }) => {
    const preview = await ready(canvasElement);
    const previewSort = preview.getByRole("combobox", { name: "Sort plugins" });
    const previewView = previewSort
      .closest('[aria-label="Result controls"]')!
      .querySelector('[aria-label="View mode"]')!;
    await expect(previewView).not.toBeVisible();
    const previewToggle = preview.getByRole("button", {
      name: "Show plugin filters",
      exact: true,
    });
    expect(
      previewSort.getBoundingClientRect().top +
        previewSort.getBoundingClientRect().height / 2,
    ).toBeCloseTo(
      previewToggle.getBoundingClientRect().top +
        previewToggle.getBoundingClientRect().height / 2,
      1,
    );

    await atNarrowPane(canvasElement, async (canvas, browser) => {
      const toggle = await canvas.findByRole("button", {
        name: "Show plugin filters",
        exact: true,
      });
      const nav = toggle.closest("nav") as HTMLElement;
      expect(toggle).toHaveAttribute(
        "data-ui-component",
        "workspace-sidebar-toggle",
      );
      expect(toggle.getBoundingClientRect().left).toBeCloseTo(
        nav.getBoundingClientRect().left,
        1,
      );
      expect(toggle).toHaveAttribute("data-state", "collapsed");
      const breadcrumb = canvas.getByRole("navigation", {
        name: "breadcrumb",
        exact: true,
      });
      expect(breadcrumb).toHaveTextContent("Registry");
      expect(breadcrumb).toHaveTextContent("Plugins");
      expect(breadcrumb.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        toggle.getBoundingClientRect().right,
      );
      expect(breadcrumb.getBoundingClientRect().top).toBeLessThan(
        toggle.getBoundingClientRect().bottom,
      );
      const view = browser.querySelector('[aria-label="View mode"]')!;
      const tools = browser.querySelector('[aria-label="Result controls"]')!;
      expect(view).not.toBeVisible();
      expect(tools.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        breadcrumb.getBoundingClientRect().right,
      );
      const narrowSort = canvas.getByRole("combobox", { name: "Sort plugins" });
      expect(
        narrowSort.getBoundingClientRect().top +
          narrowSort.getBoundingClientRect().height / 2,
      ).toBeCloseTo(
        toggle.getBoundingClientRect().top +
          toggle.getBoundingClientRect().height / 2,
        1,
      );
      expect(tools.getBoundingClientRect().right).toBeLessThanOrEqual(
        nav.getBoundingClientRect().right + 1,
      );
      await userEvent.click(toggle);
      await expect(
        await canvas.findByRole("complementary", {
          name: "Plugin filters",
          exact: true,
        }),
      ).toBeVisible();
      const filters = canvas.getByRole("complementary", {
        name: "Plugin filters",
        exact: true,
      });
      expect(
        filters.querySelector('[data-ui-component="workspace-sidebar-toggle"]'),
      ).toBeNull();
      expect(toggle).toHaveAttribute("data-state", "expanded");
      await userEvent.click(
        canvas.getByRole("button", { name: "Close left sidebar", exact: true }),
      );
      await waitFor(() => expect(toggle).toHaveFocus());
      expect(toggle).toHaveAttribute("data-state", "collapsed");
      const search = canvas.getByRole("textbox", {
        name: "Search registry plugins",
      });
      const searchGroup = search.closest(
        '[data-ui-part="registry-search"]',
      ) as HTMLElement;
      expect(searchGroup).not.toBeNull();
      expect(searchGroup).toHaveTextContent("1 result");
      const clear = canvas.getByRole("button", {
        name: "Clear all filters",
        exact: true,
      });
      expect(clear.textContent?.trim()).toBe("");
      await userEvent.hover(clear);
      await expect(clear).toHaveAttribute("aria-describedby");
      const hint = await within(clear.ownerDocument.body).findByText(
        "Clear all filters",
        { exact: true },
      );
      await expect(hint).toHaveAttribute("data-ui-part", "tooltip-content");
      await expect(hint).toBeVisible();
      await userEvent.unhover(clear);
      await userEvent.click(clear);
      await waitFor(() => expect(searchGroup).toHaveTextContent("8 results"));
      await userEvent.click(
        within(breadcrumb).getByRole("link", { name: "Registry", exact: true }),
      );
      await expect(
        await canvas.findByRole("region", { name: "Categories", exact: true }),
      ).toBeVisible();
      await userEvent.click(
        canvas.getByRole("link", { name: "AI, 1 plugin", exact: true }),
      );
      await expect(
        await canvas.findByRole("navigation", {
          name: "breadcrumb",
          exact: true,
        }),
      ).toBeVisible();
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Show plugin filters",
          exact: true,
        }),
      );
      await waitFor(() =>
        expect(
          canvas.getAllByRole("complementary", {
            name: "Plugin filters",
            exact: true,
          }),
        ).toHaveLength(1),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Close left sidebar", exact: true }),
      );
      await waitFor(() =>
        expect(browser.scrollWidth).toBeLessThanOrEqual(
          browser.clientWidth + 1,
        ),
      );
    });
  },
};

export const ResponsiveDetails: Story = {
  name: "Responsive Details",
  tags: ["visual-pending"],
  render: render("right-sidebar", "community-reference", detailReview),
  parameters: reviewParameters(
    "responsive-details",
    "Detail hero, gallery, metadata and related cards stack inside a narrow workspace pane.",
    detailReview,
    "right-sidebar",
  ),
  play: async ({ canvasElement }) => {
    await atNarrowPane(canvasElement, async (canvas, browser) => {
      await canvas.findByRole("heading", { name: "AI Assistant", exact: true });
      const crumbs = browser.querySelector(
        '[data-ui-part="registry-detail-breadcrumbs"]',
      ) as HTMLElement;
      await expect(crumbs).toBeVisible();
      expect(crumbs.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        browser
          .querySelector(".registry-plugin-detail__hero")!
          .getBoundingClientRect().top,
      );
      await waitFor(() => {
        const hero = browser.querySelector(
          ".registry-plugin-detail__hero",
        ) as HTMLElement;
        const layout = browser.querySelector(
          ".registry-plugin-detail__layout",
        ) as HTMLElement;
        expect(
          getComputedStyle(hero).gridTemplateColumns.split(" "),
        ).toHaveLength(1);
        expect(
          getComputedStyle(layout).gridTemplateColumns.split(" "),
        ).toHaveLength(1);
        expect(browser.scrollWidth).toBeLessThanOrEqual(
          browser.clientWidth + 1,
        );
      });
      await userEvent.click(
        within(crumbs).getByRole("link", { name: "Plugins", exact: true }),
      );
      await expect(
        await canvas.findByRole("region", { name: "Categories", exact: true }),
      ).toBeVisible();
      await userEvent.click(
        canvas.getByRole("link", { name: "AI, 1 plugin", exact: true }),
      );
      await userEvent.click(
        canvas.getByRole("link", { name: "Open AI Assistant", exact: true }),
      );
      await canvas.findByRole("heading", { name: "AI Assistant", exact: true });
    });
  },
};

export const UpdatesLanding: Story = {
  name: "Updates Landing",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "updates"),
  parameters: reviewParameters(
    "updates-landing",
    "The Community-style homepage lists two installed plugins with eligible updates; an incompatible update stays outside that section.",
    {},
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const updates = within(
      await canvas.findByRole("region", { name: "Updates", exact: true }),
    );
    await expect(
      updates.getByRole("link", { name: "Open AI Assistant", exact: true }),
    ).toBeVisible();
    await expect(
      updates.getByRole("link", { name: "Open Graph View", exact: true }),
    ).toBeVisible();
    await expect(
      updates.queryByRole("link", { name: "Open Slides", exact: true }),
    ).toBeNull();
  },
};
const updatesReview = {
  route: { page: "directory" },
  directory: { updatesOnly: true },
};
export const UpdatesDirectory: Story = {
  name: "Updates Directory",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "updates", updatesReview),
  parameters: reviewParameters(
    "updates-directory",
    "The removable Updates chip and Other filter row restrict the real directory to eligible installed upgrades, combine with search and restore from layout state.",
    updatesReview,
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const remove = await canvas.findByRole("button", {
      name: "Remove Updates filter",
      exact: true,
    });
    const filter = await canvas.findByRole("button", { name: /^Updates\s+2$/ });
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByText("2 results", { exact: true })).toBeVisible();
    const search = canvas.getByRole("textbox", {
      name: "Search registry plugins",
    });
    await userEvent.type(search, "graph");
    await expect(canvas.getByText("1 result", { exact: true })).toBeVisible();
    await userEvent.clear(search);
    await userEvent.click(remove);
    await expect(filter).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getByText("8 results", { exact: true })).toBeVisible();
    await userEvent.click(filter);
    await expect(canvas.getByText("2 results", { exact: true })).toBeVisible();
  },
};
const updateDetailReview = { route: { page: "plugin", pluginId: "graph" } };
export const UpdateDetails: Story = {
  name: "Update Details",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "updates", updateDetailReview),
  parameters: reviewParameters(
    "update-details",
    "Graph detail media, metadata and Community styling with an enabled Update button for the installed older version.",
    updateDetailReview,
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Graph View", exact: true });
    await expect(
      canvas.getByRole("button", { name: "Update", exact: true }),
    ).toBeEnabled();
    await expect(
      canvas.queryByRole("button", { name: "Install in Lapis", exact: true }),
    ).toBeNull();
  },
};

export const AppLinkReleaseSelection: Story = {
  name: "App Link Release Selection",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "installed"),
  parameters: appLinkParameters(
    "app-link-release-selection",
    "An app URL dismisses the owning Settings dialog, reuses the Plugins leaf, persists the requested historical release and keeps installation bound to that version when a newer update exists.",
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Make Lapis Notes yours." });
    const app = (
      canvasElement.querySelector(
        '[data-testid="plugin-management-story"]',
      ) as HTMLElement & { __lapisApp: App }
    ).__lapisApp;
    const leaf = app.workspace.getLeavesOfType("plugins")[0];
    const settings = getWorkspaceHostBinding(app.workspace).controller.settings;
    settings.open();
    await within(canvasElement.ownerDocument.body).findByRole("dialog", {
      name: "Settings",
    });
    await app.urls.dispatch("lapis://plugins?id=lapis-graph&version=0.1.0");
    await waitFor(() => expect(settings.dialogOpen).toBe(false));
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
    await canvas.findByRole("heading", { name: "Graph", exact: true });
    const selector = await canvas.findByRole("combobox", {
      name: "Select plugin version",
    });
    expect(selector).toHaveTextContent("0.1.0");
    await expect(
      await canvas.findByRole("button", { name: "Installed", exact: true }),
    ).toBeDisabled();
    expect(app.workspace.getLeavesOfType("plugins")).toEqual([leaf]);
    expect(leaf.view.getState().route).toEqual({
      page: "plugin",
      pluginId: "lapis-graph",
      version: "0.1.0",
    });
    const installedRecord =
      await app.pluginDistribution.getInstalled("lapis-graph");
    const replacementUpdate = (await app.pluginDistribution.listUpdates()).find(
      (candidate) => candidate.id === "lapis-graph",
    );
    if (!installedRecord || !replacementUpdate)
      throw new Error("The installed Graph update fixture is missing");
    installedRecord.installedVersion = "0.0.1";
    replacementUpdate.currentVersion = "0.0.1";
    replacementUpdate.targetVersion = "0.1.0";
    await app.urls.dispatch("web+lapis://plugins?id=lapis-graph&version=0.2.0");
    await expect(
      await canvas.findByRole("button", { name: "Update", exact: true }),
    ).toBeEnabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Update", exact: true }),
    );
    await expect(
      await canvas.findByRole("button", { name: "Installed", exact: true }),
    ).toBeDisabled();
    expect(
      (await app.pluginDistribution.getInstalled("lapis-graph"))
        ?.installedVersion,
    ).toBe("0.2.0");
    await app.urls.dispatch(
      "lapis-notes://plugins?id=lapis-graph&version=0.1.0",
    );
    const installationRequests: { id: string; version?: string }[] = [];
    const originalInstall = app.pluginDistribution.install.bind(
      app.pluginDistribution,
    );
    app.pluginDistribution.install = async (id, options) => {
      installationRequests.push({ id, version: options?.version });
      return originalInstall(id, options);
    };
    const install = await canvas.findByRole("button", {
      name: "Install in Lapis",
      exact: true,
    });
    await userEvent.click(install);
    const body = within(canvasElement.ownerDocument.body);
    const confirm = await body.findByRole("alertdialog", {
      name: "Install historical release?",
    });
    expect(confirm).toHaveTextContent("0.1.0");
    await userEvent.click(
      within(confirm).getByRole("button", {
        name: "Install 0.1.0",
        exact: true,
      }),
    );
    await waitFor(() => {
      expect(installationRequests).toEqual([
        { id: "lapis-graph", version: "0.1.0" },
      ]);
      expect(body.queryByRole("alertdialog")).toBeNull();
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none");
      expect(
        canvas.getByRole("button", { name: "Installed", exact: true }),
      ).toBeDisabled();
    });
    app.pluginDistribution.install = originalInstall;
  },
};

export const AppLinkUnavailableVersion: Story = {
  name: "App Link Unavailable Version",
  tags: ["visual-pending"],
  render: render("middle-top-tabs", "catalog-v2"),
  parameters: appLinkParameters(
    "app-link-unavailable-version",
    "An unknown requested version stays unavailable until the user explicitly chooses the latest verified release.",
    "99.0.0",
  ),
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Make Lapis Notes yours." });
    const app = (
      canvasElement.querySelector(
        '[data-testid="plugin-management-story"]',
      ) as HTMLElement & { __lapisApp: App }
    ).__lapisApp;
    await app.urls.dispatch("lapis://plugins?id=lapis-graph&version=99.0.0");
    await expect(
      await canvas.findByRole("heading", {
        name: "Plugin version unavailable",
      }),
    ).toBeVisible();
    expect(
      canvas.queryByRole("button", { name: "Install in Lapis", exact: true }),
    ).toBeNull();
    expect(
      canvas.queryByRole("combobox", { name: "Select plugin version" }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "View latest release" }),
    );
    await canvas.findByRole("heading", { name: "Graph", exact: true });
    expect(
      canvas.getByRole("combobox", { name: "Select plugin version" }),
    ).toHaveTextContent("0.2.0");
    for (const version of ["constructor", "toString"]) {
      await app.urls.dispatch(
        `lapis://plugins?id=lapis-graph&version=${version}`,
      );
      await expect(
        await canvas.findByRole("heading", {
          name: "Plugin version unavailable",
        }),
      ).toBeVisible();
      expect(
        canvas.queryByRole("button", { name: "Install in Lapis", exact: true }),
      ).toBeNull();
      await userEvent.click(
        canvas.getByRole("button", { name: "View latest release" }),
      );
      await canvas.findByRole("heading", { name: "Graph", exact: true });
    }
  },
};

async function expectFixedBodyHeader(
  canvasElement: HTMLElement,
  header: HTMLElement,
) {
  const viewport = canvasElement.querySelector<HTMLElement>(
    "[data-ui-component='plugin-browser'] [data-ui-part='body-content'] [data-ui-part='scroll-area-viewport']",
  )!;
  await waitFor(() =>
    expect(viewport.scrollHeight - viewport.clientHeight).toBeGreaterThan(100),
  );
  const initial = header.getBoundingClientRect().top;
  viewport.scrollTop = 150;
  await waitFor(() => {
    expect(viewport.scrollTop).toBeGreaterThan(100);
    expect(header.getBoundingClientRect().top).toBeCloseTo(initial, 1);
    expect(header.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
  });
  viewport.scrollTop = 0;
}

export const DetailImagesLoading: Story = {
  name: "Detail Images Loading",
  tags: ["visual-pending"],
  render: () => ({
    Component: PluginManagementSurface,
    props: {
      surface: "browser",
      scenario: "catalog-v2",
      imageState: "loading",
      browserState: { route: { page: "plugin", pluginId: "lapis-graph" } },
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Verified detail media reserves its signed dimensions and uses skeletons while fetching or decoding.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Graph", exact: true });
    await waitFor(() =>
      expect(
        canvasElement.querySelector(
          "[data-image-state='loading'] [data-ui-component='skeleton']",
        ),
      ).not.toBeNull(),
    );
    expect(
      canvasElement.querySelector("[data-image-state='failed']"),
    ).toBeNull();
  },
};
export const DetailImagesUnavailable: Story = {
  name: "Detail Images Unavailable",
  tags: ["visual-pending"],
  render: () => ({
    Component: PluginManagementSurface,
    props: {
      surface: "browser",
      scenario: "catalog-v2",
      imageState: "missing",
      browserState: { route: { page: "plugin", pluginId: "lapis-graph" } },
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Missing or failed verified images show an empty state without collapsing the detail layout.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("heading", { name: "Graph", exact: true });
    await waitFor(() =>
      expect(
        canvasElement.querySelector(
          "[data-image-state='failed'] [data-ui-component='empty']",
        ),
      ).not.toBeNull(),
    );
    await expect(
      canvas.getByRole("button", { name: "Install in Lapis" }),
    ).toBeEnabled();
  },
};
