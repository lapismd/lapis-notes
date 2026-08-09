import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import PanelDemo from "./PanelDemo.svelte";
import type { PanelDemoLayout } from "./create-panel-demo";

const meta = {
  title: "Workspace/Panels/Markdown/All Properties",
  component: PanelDemo,
  // CSF indexer requires a literal review tag for Visual Delta sidebar status.
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      canvas: { className: "panel-demo-docs-canvas" },
      story: { height: "22rem" },
    },
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;
type AllPropertiesLayout = Exclude<PanelDemoLayout, "comparison">;

function storyParameters(
  catalogId: string,
  description: string,
  baselineImage: string,
) {
  return {
    ...workspaceCatalogParameters(catalogId),
    layout: "fullscreen",
    docs: {
      description: { story: description },
    },
    visualDelta: {
      images: [baselineImage],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  };
}

async function expectAllPropertiesPlacement(
  canvasElement: HTMLElement,
  layout: AllPropertiesLayout,
) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("panel-demo-status")).toHaveTextContent(
        "ready",
      );
      expect(canvas.getAllByTestId("all-properties-panel")).toHaveLength(1);
      expect(
        canvasElement.querySelector(".markdown-view") ||
          canvasElement.querySelector(
            '[data-ui-component="markdown-mira-preview"]',
          ) ||
          canvasElement.querySelector(".markdown-view__editor"),
      ).toBeNull();
    },
    { timeout: 12_000 },
  );

  const panel = canvas.getByTestId("all-properties-panel");
  const scoped = within(panel);
  await expect(
    scoped.getByRole("button", { name: "Sort properties" }),
  ).toBeVisible();
  const searchToggle = scoped.getByRole("button", {
    name: "Search properties",
  });
  await expect(searchToggle).toBeVisible();

  const expectedHost = {
    "middle-top-tabs": "workspace-tabs",
    "stacked-tabs": "workspace-stacked-tabs",
    "left-sidebar": "workspace-sidebar",
    "right-sidebar": "workspace-sidebar",
    "bottom-panel": "workspace-bottom-panel-group",
    "sidebar-group": "workspace-sidebar-group",
  }[layout];
  const host = panel.closest(
    `[data-ui-component="${expectedHost}"]`,
  ) as HTMLElement | null;
  await expect(host).not.toBeNull();

  const sidebarLayout =
    layout === "left-sidebar" ||
    layout === "right-sidebar" ||
    layout === "sidebar-group";
  await expect(panel).toHaveAttribute(
    "data-surface",
    sidebarLayout ? "sidebar" : "body",
  );
  if (layout === "left-sidebar" || layout === "right-sidebar") {
    await expect(host).toHaveAttribute(
      "data-workspace-sidebar-side",
      layout === "left-sidebar" ? "left" : "right",
    );
  }
  if (layout === "bottom-panel") {
    await expect(
      canvas.getByRole("button", { name: "Collapse All properties" }),
    ).toBeVisible();
  }

  await userEvent.click(searchToggle);
  const search = scoped.getByRole("textbox", { name: "Search properties" });
  await userEvent.type(search, "status");
  await expect(search).toHaveValue("status");
  await expect(scoped.getByText("status")).toBeVisible();
  await expect(scoped.queryByText("tags")).not.toBeInTheDocument();
  await userEvent.click(searchToggle);
  await expect(
    scoped.queryByRole("textbox", { name: "Search properties" }),
  ).not.toBeInTheDocument();
}

export const MiddleTopTabs: Story = {
  parameters: storyParameters(
    "workspace-panels-all-properties",
    "All Properties as the only middle workspace leaf with standard top-tab chrome.",
    "/visual-baselines/stories/workspace/panels/middle-top-tabs-chromium.png",
  ),
  name: "Middle (Top Tabs)",
  args: { kind: "all-properties", layout: "middle-top-tabs" },
  play: async ({ canvasElement }) => {
    await expectAllPropertiesPlacement(canvasElement, "middle-top-tabs");
  },
};

export const StackedTabs: Story = {
  parameters: storyParameters(
    "workspace-panels-all-properties-stacked-tabs",
    "All Properties selected inside the real stacked-tabs workspace presentation.",
    "/visual-baselines/stories/workspace/panels/stacked-tabs-chromium.png",
  ),
  name: "Stacked Tabs",
  args: { kind: "all-properties", layout: "stacked-tabs" },
  play: async ({ canvasElement }) => {
    await expectAllPropertiesPlacement(canvasElement, "stacked-tabs");
  },
};

export const LeftSidebar: Story = {
  parameters: storyParameters(
    "workspace-panels-all-properties-left-sidebar",
    "All Properties as the only open item in the left sidebar.",
    "/visual-baselines/stories/workspace/panels/left-sidebar-chromium.png",
  ),
  name: "Left Sidebar",
  args: { kind: "all-properties", layout: "left-sidebar" },
  play: async ({ canvasElement }) => {
    await expectAllPropertiesPlacement(canvasElement, "left-sidebar");
  },
};

export const RightSidebar: Story = {
  parameters: storyParameters(
    "workspace-panels-all-properties-right-sidebar",
    "All Properties as the only open item in the right sidebar.",
    "/visual-baselines/stories/workspace/panels/right-sidebar-chromium.png",
  ),
  name: "Right Sidebar",
  args: { kind: "all-properties", layout: "right-sidebar" },
  play: async ({ canvasElement }) => {
    await expectAllPropertiesPlacement(canvasElement, "right-sidebar");
  },
};

export const BottomPanel: Story = {
  parameters: storyParameters(
    "workspace-panels-all-properties-bottom-panel",
    "All Properties as a group in the real open bottom-panel dock beneath an empty workspace.",
    "/visual-baselines/stories/workspace/panels/bottom-panel-chromium.png",
  ),
  name: "Bottom Panel",
  args: { kind: "all-properties", layout: "bottom-panel" },
  play: async ({ canvasElement }) => {
    await expectAllPropertiesPlacement(canvasElement, "bottom-panel");
  },
};

export const SidebarGroup: Story = {
  parameters: storyParameters(
    "workspace-panels-all-properties-sidebar-group",
    "All Properties expanded as the only panel in a grouped right-sidebar item.",
    "/visual-baselines/stories/workspace/panels/sidebar-group-chromium.png",
  ),
  name: "Sidebar As a Group",
  args: { kind: "all-properties", layout: "sidebar-group" },
  play: async ({ canvasElement }) => {
    await expectAllPropertiesPlacement(canvasElement, "sidebar-group");
  },
};
