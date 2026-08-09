import type { Meta, StoryObj } from "@storybook/svelte-vite";
import type { App } from "@lapis-notes/api";
import { AllProperties } from "@lapis-notes/markdown";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import * as exampleSources from "./AllProperties.example-sources";
import PanelDemo from "./PanelDemo.svelte";
import type { PanelDemoLayout } from "./create-panel-demo";
import "./AllProperties.docs.css";

const meta = {
  title: "Workspace/Panels/Markdown/All Properties",
  component: AllProperties,
  args: {
    app: undefined as unknown as App,
  },
  argTypes: {
    app: {
      control: false,
      description:
        "Initialized Lapis App supplied by the registered All Properties view.",
    },
  },
  // CSF indexer requires a literal review tag for Visual Delta sidebar status.
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      canvas: { className: "panel-demo-docs-canvas" },
      description: {
        component:
          "All Properties receives the initialized Lapis App. Workspace placement belongs to the shell layout demonstrated by each story, not to the component API.",
      },
      story: { height: "700px", inline: false },
    },
  },
} satisfies Meta<typeof AllProperties>;

export default meta;
type Story = StoryObj<typeof meta>;
type AllPropertiesLayout = Exclude<PanelDemoLayout, "comparison">;
type StoryRender = NonNullable<Story["render"]>;

function renderPlacement(layout: AllPropertiesLayout): StoryRender {
  return (() => ({
    Component: PanelDemo,
    props: { kind: "all-properties", layout },
  })) as StoryRender;
}

function visualParameters(catalogId: string, baselineImage: string) {
  return {
    ...workspaceCatalogParameters(catalogId),
    layout: "fullscreen",
    visualDelta: {
      images: [baselineImage],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  };
}

const sourceMarker: Record<AllPropertiesLayout, string> = {
  "middle-top-tabs": '"panel-middle"',
  "stacked-tabs": '"main-stacked-tabs"',
  "left-sidebar": '"panel-left"',
  "right-sidebar": '"panel-right"',
  "bottom-panel": '"all-properties-bottom-group"',
  "sidebar-group": '"all-properties-group"',
};

type DocsSourceParameters = {
  docs?: {
    canvas?: {
      className?: string;
    };
    source?: {
      code?: string;
      language?: string;
      type?: string;
    };
    story?: {
      height?: string;
      inline?: boolean;
    };
  };
};

async function expectConsumerSource(
  parameters: DocsSourceParameters,
  layout: AllPropertiesLayout,
) {
  await expect(parameters.docs?.canvas?.className).toBe(
    "panel-demo-docs-canvas",
  );
  await expect(parameters.docs?.story?.height).toBe("700px");
  await expect(parameters.docs?.story?.inline).toBe(false);

  const source = parameters.docs?.source;
  await expect(source?.language).toBe("ts");
  await expect(source?.type).toBe("code");
  await expect(source?.code).toContain(
    'import { WorkspaceShell } from "@lapis-notes/workspace";',
  );
  await expect(source?.code).toContain("app.workspace.changeLayout(layout)");
  await expect(source?.code).toContain(sourceMarker[layout]);
  await expect(source?.code).not.toContain("PanelDemo");
}

async function expectAllPropertiesPlacement(
  canvasElement: HTMLElement,
  layout: AllPropertiesLayout,
  args: Record<string, unknown>,
) {
  await expect(args).not.toHaveProperty("kind");
  await expect(args).not.toHaveProperty("layout");

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

  const expectedSurface = {
    "middle-top-tabs": "body",
    "stacked-tabs": "body",
    "left-sidebar": "left-sidebar",
    "right-sidebar": "right-sidebar",
    "bottom-panel": "bottom-panel",
    "sidebar-group": "right-sidebar",
  }[layout];
  const surfaceHost = panel.closest(
    "[data-workspace-surface]",
  ) as HTMLElement | null;
  if (!surfaceHost) {
    throw new Error(`Missing workspace surface host for ${layout}`);
  }
  await expect(surfaceHost).toHaveAttribute(
    "data-workspace-surface",
    expectedSurface,
  );
  const viewHost = panel.closest(
    '[data-ui-component="workspace-view-host"]',
  ) as HTMLElement | null;
  if (!viewHost) {
    throw new Error(`Missing WorkspaceViewHost for ${layout}`);
  }
  const storyWindow = canvasElement.ownerDocument.defaultView;
  if (!storyWindow) {
    throw new Error("Missing Storybook preview window");
  }
  const usesSidebarPaint =
    layout === "left-sidebar" || layout === "right-sidebar";
  const paintHost = usesSidebarPaint
    ? surfaceHost
    : (canvasElement.querySelector(
        '[data-workspace-surface="body"]',
      ) as HTMLElement | null);
  if (!paintHost) {
    throw new Error(`Missing expected paint host for ${layout}`);
  }
  const viewBackground = storyWindow.getComputedStyle(viewHost).backgroundColor;
  await expect(viewBackground).toBe(
    storyWindow.getComputedStyle(paintHost).backgroundColor,
  );
  await expect(storyWindow.getComputedStyle(panel).backgroundColor).toBe(
    viewBackground,
  );
  const stickyChrome = panel.querySelector<HTMLElement>(
    '[data-ui-part="chrome"]',
  );
  if (!stickyChrome) {
    throw new Error(`Missing sticky panel chrome for ${layout}`);
  }
  await expect(
    storyWindow.getComputedStyle(stickyChrome).backgroundColor,
  ).toBe(viewBackground);
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
  parameters: {
    ...visualParameters(
      "workspace-panels-all-properties",
      "/visual-baselines/stories/workspace/panels/middle-top-tabs-chromium.png",
    ),
    docs: {
      description: {
        story:
          "All Properties as the only middle workspace leaf with standard top-tab chrome.",
      },
      source: {
        code: exampleSources.MiddleTopTabs,
        language: "ts",
        type: "code",
      },
    },
  },
  name: "Middle (Top Tabs)",
  render: renderPlacement("middle-top-tabs"),
  play: async ({ args, canvasElement, parameters }) => {
    await expectAllPropertiesPlacement(canvasElement, "middle-top-tabs", args);
    await expectConsumerSource(parameters, "middle-top-tabs");
  },
};

export const StackedTabs: Story = {
  parameters: {
    ...visualParameters(
      "workspace-panels-all-properties-stacked-tabs",
      "/visual-baselines/stories/workspace/panels/stacked-tabs-chromium.png",
    ),
    docs: {
      description: {
        story:
          "All Properties selected inside the real stacked-tabs workspace presentation.",
      },
      source: {
        code: exampleSources.StackedTabs,
        language: "ts",
        type: "code",
      },
    },
  },
  name: "Stacked Tabs",
  render: renderPlacement("stacked-tabs"),
  play: async ({ args, canvasElement, parameters }) => {
    await expectAllPropertiesPlacement(canvasElement, "stacked-tabs", args);
    await expectConsumerSource(parameters, "stacked-tabs");
  },
};

export const LeftSidebar: Story = {
  parameters: {
    ...visualParameters(
      "workspace-panels-all-properties-left-sidebar",
      "/visual-baselines/stories/workspace/panels/left-sidebar-chromium.png",
    ),
    docs: {
      description: {
        story: "All Properties as the only open item in the left sidebar.",
      },
      source: {
        code: exampleSources.LeftSidebar,
        language: "ts",
        type: "code",
      },
    },
  },
  name: "Left Sidebar",
  render: renderPlacement("left-sidebar"),
  play: async ({ args, canvasElement, parameters }) => {
    await expectAllPropertiesPlacement(canvasElement, "left-sidebar", args);
    await expectConsumerSource(parameters, "left-sidebar");
  },
};

export const RightSidebar: Story = {
  parameters: {
    ...visualParameters(
      "workspace-panels-all-properties-right-sidebar",
      "/visual-baselines/stories/workspace/panels/right-sidebar-chromium.png",
    ),
    docs: {
      description: {
        story: "All Properties as the only open item in the right sidebar.",
      },
      source: {
        code: exampleSources.RightSidebar,
        language: "ts",
        type: "code",
      },
    },
  },
  name: "Right Sidebar",
  render: renderPlacement("right-sidebar"),
  play: async ({ args, canvasElement, parameters }) => {
    await expectAllPropertiesPlacement(canvasElement, "right-sidebar", args);
    await expectConsumerSource(parameters, "right-sidebar");
  },
};

export const BottomPanel: Story = {
  parameters: {
    ...visualParameters(
      "workspace-panels-all-properties-bottom-panel",
      "/visual-baselines/stories/workspace/panels/bottom-panel-chromium.png",
    ),
    docs: {
      description: {
        story:
          "All Properties as a group in the real open bottom-panel dock beneath an empty workspace.",
      },
      source: {
        code: exampleSources.BottomPanel,
        language: "ts",
        type: "code",
      },
    },
  },
  name: "Bottom Panel",
  render: renderPlacement("bottom-panel"),
  play: async ({ args, canvasElement, parameters }) => {
    await expectAllPropertiesPlacement(canvasElement, "bottom-panel", args);
    await expectConsumerSource(parameters, "bottom-panel");
  },
};

export const SidebarGroup: Story = {
  parameters: {
    ...visualParameters(
      "workspace-panels-all-properties-sidebar-group",
      "/visual-baselines/stories/workspace/panels/sidebar-group-chromium.png",
    ),
    docs: {
      description: {
        story:
          "All Properties expanded as the only panel in a grouped right-sidebar item.",
      },
      source: {
        code: exampleSources.SidebarGroup,
        language: "ts",
        type: "code",
      },
    },
  },
  name: "Sidebar As a Group",
  render: renderPlacement("sidebar-group"),
  play: async ({ args, canvasElement, parameters }) => {
    await expectAllPropertiesPlacement(canvasElement, "sidebar-group", args);
    await expectConsumerSource(parameters, "sidebar-group");
  },
};
