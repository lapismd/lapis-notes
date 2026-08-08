import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import PanelDemo from "./PanelDemo.svelte";

const meta = {
  title: "Workspace/Panels/Markdown",
  component: PanelDemo,
  // CSF indexer requires a literal tags array (not an imported binding).
  tags: ["skip-visual", "test"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function panelStoryMeta(catalogId: string, description: string) {
  return {
    tags: ["skip-visual", "test"],
    parameters: {
      ...workspaceCatalogParameters(catalogId),
      layout: "fullscreen",
      docs: {
        description: { story: description },
      },
    },
  };
}

async function waitForPanelDemo(
  canvasElement: HTMLElement,
  testId: string,
) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("panel-demo-status")).toHaveTextContent(
        "ready",
      );
      expect(canvas.getAllByTestId(testId).length).toBeGreaterThanOrEqual(2);
      expect(
        canvasElement.querySelector(".markdown-view") ||
          canvasElement.querySelector(
            '[data-ui-component="markdown-mira-preview"]',
          ) ||
          canvasElement.querySelector(".markdown-view__editor"),
      ).toBeTruthy();
    },
    { timeout: 12_000 },
  );
}

async function expectDualPanels(
  canvas: ReturnType<typeof within>,
  testId: string,
) {
  const panels = canvas.getAllByTestId(testId);
  await expect(panels.length).toBeGreaterThanOrEqual(2);
  return panels.map((panel) => within(panel));
}

export const AllProperties: Story = {
  ...panelStoryMeta(
    "workspace-panels-all-properties",
    "Compares All Properties in the main split (beside a Mira markdown leaf) vs the right sidebar. Left sidebar is collapsed.",
  ),
  args: { kind: "all-properties" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForPanelDemo(canvasElement, "all-properties-panel");
    const [panel] = await expectDualPanels(canvas, "all-properties-panel");
    await expect(
      panel.getByRole("button", { name: "Sort properties" }),
    ).toBeVisible();
    await expect(
      panel.getByRole("button", { name: "Search properties" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(panel.getByText("title")).toBeVisible();
      expect(panel.getByText("tags")).toBeVisible();
      expect(panel.getByText("status")).toBeVisible();
    });
  },
};

export const FileProperties: Story = {
  ...panelStoryMeta(
    "workspace-panels-file-properties",
    "Compares File Properties in the main split vs the right sidebar, with Mira markdown owning the active note.",
  ),
  args: { kind: "file-properties" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForPanelDemo(canvasElement, "file-properties-panel");
    const [panel] = await expectDualPanels(canvas, "file-properties-panel");
    await expect(
      panel.getByRole("heading", { name: "File properties" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(panel.getByText("Notes/Welcome.md")).toBeVisible();
      expect(panel.getByDisplayValue("title")).toBeVisible();
      expect(panel.getByDisplayValue("Welcome")).toBeVisible();
      expect(panel.getByDisplayValue("status")).toBeVisible();
    });
    await expect(
      panel.getByRole("button", { name: /Add property/i }),
    ).toBeVisible();
  },
};

export const Outline: Story = {
  ...panelStoryMeta(
    "workspace-panels-outline",
    "Compares Outline in the main split vs the right sidebar against a Mira markdown leaf.",
  ),
  args: { kind: "outline" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForPanelDemo(canvasElement, "outline-panel");
    const [panel] = await expectDualPanels(canvas, "outline-panel");
    await expect(panel.getByRole("heading", { name: "Outline" })).toBeVisible();
    await waitFor(() => {
      expect(
        panel.getByRole("button", { name: "Welcome to Lapis Notes" }),
      ).toBeVisible();
      expect(panel.getByRole("button", { name: "Links" })).toBeVisible();
    });
  },
};

export const Backlinks: Story = {
  ...panelStoryMeta(
    "workspace-panels-backlinks",
    "Compares Backlinks in the main split vs the right sidebar against a Mira markdown leaf.",
  ),
  args: { kind: "backlinks" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForPanelDemo(canvasElement, "backlinks-panel");
    const [panel] = await expectDualPanels(canvas, "backlinks-panel");
    await expect(
      panel.getByRole("heading", { name: "Backlinks" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(
        panel.getByRole("button", { name: "Ideas.markdown" }),
      ).toBeVisible();
    });
  },
};

export const OutgoingLinks: Story = {
  ...panelStoryMeta(
    "workspace-panels-outgoing-links",
    "Compares Outgoing Links in the main split vs the right sidebar against a Mira markdown leaf.",
  ),
  args: { kind: "outgoing-links" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForPanelDemo(canvasElement, "outgoing-links-panel");
    const [panel] = await expectDualPanels(canvas, "outgoing-links-panel");
    await expect(
      panel.getByRole("heading", { name: "Outgoing links" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(panel.getByRole("button", { name: "Ideas" })).toBeVisible();
    });
  },
};

export const Tags: Story = {
  ...panelStoryMeta(
    "workspace-panels-tags",
    "Compares Tags in the main split vs the right sidebar against a Mira markdown leaf.",
  ),
  args: { kind: "tags" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForPanelDemo(canvasElement, "tags-panel");
    const [panel] = await expectDualPanels(canvas, "tags-panel");
    await expect(panel.getByRole("heading", { name: "Tags" })).toBeVisible();
    await waitFor(() => {
      expect(panel.getByText("#demo")).toBeVisible();
      expect(panel.getByText("#markdown")).toBeVisible();
      expect(panel.getByText("#ideas")).toBeVisible();
    });
  },
};
