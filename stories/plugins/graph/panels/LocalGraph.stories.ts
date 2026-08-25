import {
  DEFAULT_GRAPH_SETTINGS,
  GraphControlsOverlay,
  GraphPlugin,
} from "@lapis-notes/graph";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectAsyncQueryFailureAndRecovery,
  expectPanelPlacement,
  expectPanelSource,
  panelDemoApp,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
  triggerMetadataReset,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "local-graph" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Graph/Panels/Local Graph",
  component: GraphControlsOverlay,
  args: {
    isLocal: true,
    settings: DEFAULT_GRAPH_SETTINGS,
    statsText: "",
    statusText: "",
    statusKind: null,
    groupDiagnostics: {},
    isAnimating: false,
    onFocusActiveFile: fn(),
    onZoomIn: fn(),
    onZoomOut: fn(),
    onResetView: fn(),
    onRefreshGraph: fn(),
    onResetDefaults: fn(),
    onToggleAnimation: fn(),
    onSettingsPatch: fn(),
  },
  argTypes: {
    settings: { control: false },
    onFocusActiveFile: { control: false },
    onZoomIn: { control: false },
    onZoomOut: { control: false },
    onResetView: { control: false },
    onRefreshGraph: { control: false },
    onResetDefaults: { control: false },
    onToggleAnimation: { control: false },
    onSettingsPatch: { control: false },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Local Graph preserves the legacy canvas and depth controls around the active indexed note.",
      },
    },
  },
} satisfies Meta<typeof GraphControlsOverlay>;

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
        "local-graph-panel",
        args,
      );
      await waitFor(() => {
        expect(panel.queryByRole("alert")).toBeNull();
        expect(panel.getByLabelText("Toggle graph settings")).toBeVisible();
      });
      const app = panelDemoApp(canvasElement);
      expect(app.plugins.plugins.get("lapis-graph")).toBeInstanceOf(
        GraphPlugin,
      );
      await userEvent.click(panel.getByLabelText("Toggle graph settings"));
      const dialog = await panel.findByRole("dialog", {
        name: "Graph settings",
      });
      await userEvent.click(within(dialog).getByText("Local graph"));
      await expect(
        within(dialog).getByRole("slider", { name: "Depth" }),
      ).toBeVisible();

      if (layout === "middle-top-tabs") {
        await expectAsyncQueryFailureAndRecovery({
          target: app.metadataCache,
          method: "queryMetadata",
          trigger: () => triggerMetadataReset(app),
          expectFailure: async () => {
            await waitFor(() => expect(panel.getByRole("alert")).toBeVisible());
          },
          expectRecovery: async () => {
            await waitFor(() => expect(panel.queryByRole("alert")).toBeNull());
          },
        });
      }
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Local Graph beside its active note in a main-area top tab.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Local Graph inside the real stacked-tabs presentation.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Local Graph moved from its default side into the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Local Graph in its canonical right-sidebar placement.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Local Graph inside the real grouped bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Local Graph inside a grouped right-sidebar item.",
);
