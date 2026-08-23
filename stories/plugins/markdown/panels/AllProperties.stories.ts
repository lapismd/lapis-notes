import type { App } from "@lapis-notes/api";
import { AllProperties } from "@lapis-notes/markdown";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectAsyncQueryFailureAndRecovery,
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  panelDemoApp,
  placementParameters,
  triggerMetadataReset,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "all-properties" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Markdown/Panels/All Properties",
  component: AllProperties,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description:
        "Initialized Lapis App supplied by the registered All Properties view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "All Properties accepts only the initialized Lapis App. Placement belongs to the workspace layout, not to the panel API.",
      },
    },
  },
} satisfies Meta<typeof AllProperties>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function renderPlacement(layout: PanelDemoLayout): StoryRender {
  return (() => ({
    Component: PanelDemo,
    props: { kind, layout },
  })) as StoryRender;
}

function placementStory(
  layout: PanelDemoLayout,
  source: string,
  description: string,
): Story {
  return {
    name: PANEL_PLACEMENTS[layout].name,
    parameters: placementParameters(kind, layout, source, description),
    render: renderPlacement(layout),
    play: async ({ args, canvasElement, parameters }) => {
      const panel = await expectPanelPlacement(
        canvasElement,
        kind,
        layout,
        "all-properties-panel",
        args,
      );
      await expect(
        panel.getByRole("button", { name: "Sort properties" }),
      ).toBeVisible();
      const searchToggle = panel.getByRole("button", {
        name: "Search properties",
      });
      await userEvent.click(searchToggle);
      const search = panel.getByRole("textbox", { name: "Search properties" });
      await userEvent.type(search, "status");
      await expect(search).toHaveValue("status");
      await expect(panel.getByText("status")).toBeVisible();
      await expect(panel.queryByText("tags")).not.toBeInTheDocument();
      await userEvent.click(searchToggle);
      await expect(
        panel.queryByRole("textbox", { name: "Search properties" }),
      ).not.toBeInTheDocument();
      if (layout === "middle-top-tabs") {
        const app = panelDemoApp(canvasElement);
        await expectAsyncQueryFailureAndRecovery({
          target: app.metadataCache,
          method: "queryFacets",
          trigger: () => triggerMetadataReset(app),
          expectFailure: () =>
            waitFor(() => {
              expect(panel.getByRole("alert")).toHaveTextContent(
                "Storybook metadata query failure",
              );
            }),
          expectRecovery: () =>
            waitFor(() => {
              expect(panel.queryByRole("alert")).not.toBeInTheDocument();
              expect(panel.getByText("status")).toBeVisible();
            }),
        });
        await userEvent.click(panel.getByRole("button", { name: "status" }));
        await waitFor(() => {
          const searchPanel = within(canvasElement).getByTestId("search-panel");
          expect(
            within(searchPanel).getByRole("searchbox", {
              name: "Search vault",
            }),
          ).toHaveTextContent('["status"]');
        });
      }
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "All Properties as the only middle workspace leaf with standard top-tab chrome.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "All Properties selected inside the real stacked-tabs workspace presentation.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "All Properties as the only open item in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "All Properties as the only open item in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "All Properties as a group in the real open bottom-panel dock beneath an empty workspace.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "All Properties expanded as the only panel in a grouped right-sidebar item.",
);
