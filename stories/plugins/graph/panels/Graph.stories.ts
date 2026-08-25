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

const kind = "graph" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Graph/Panels/Graph",
  component: GraphControlsOverlay,
  args: {
    isLocal: false,
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
          "Graph preserves the legacy canvas and controls while reading the indexed vault through the bundled Graph plugin.",
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
        "graph-panel",
        args,
      );
      await waitFor(() => {
        expect(panel.getByText(/\d+ nodes • \d+ links/)).toBeVisible();
        expect(panel.getByLabelText("Toggle graph settings")).toBeVisible();
      });
      const app = panelDemoApp(canvasElement);
      expect(app.plugins.plugins.get("lapis-graph")).toBeInstanceOf(
        GraphPlugin,
      );

      await userEvent.click(panel.getByLabelText("Focus active file"));
      await userEvent.click(panel.getByLabelText("Zoom in"));
      await userEvent.click(panel.getByLabelText("Reset view"));
      await userEvent.click(panel.getByLabelText("Toggle graph settings"));
      const dialog = await panel.findByRole("dialog", {
        name: "Graph settings",
      });
      const displayTrigger = within(dialog).getByRole("button", {
        name: "Display",
      });
      const displayTriggerStyle = getComputedStyle(displayTrigger);
      expect(displayTriggerStyle.alignItems).toBe("center");
      expect(displayTriggerStyle.gap).toBe("12px");
      expect(displayTriggerStyle.fontWeight).toBe("600");
      expect(displayTriggerStyle.paddingInlineStart).toBe("16px");
      await userEvent.hover(displayTrigger);
      expect(getComputedStyle(displayTrigger).textDecorationLine).toBe("none");
      await userEvent.unhover(displayTrigger);
      expect(
        displayTrigger.querySelector('[data-indicator-glyph="chevron-right"]'),
      ).toBeVisible();
      const graphRoot = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="graph"]',
      );
      expect(graphRoot).not.toBeNull();
      const graphStyle = getComputedStyle(graphRoot!);
      expect(graphStyle.getPropertyValue("--ui-graph-node-note").trim()).toBe(
        graphStyle.getPropertyValue("--muted-foreground").trim(),
      );
      expect(
        graphStyle.getPropertyValue("--ui-graph-node-label-hover").trim(),
      ).toBe(
        graphStyle.getPropertyValue("--ui-graph-surface-foreground").trim(),
      );
      for (const role of [
        "--graph-text",
        "--graph-line",
        "--graph-node",
        "--graph-node-unresolved",
        "--graph-node-focused",
        "--graph-node-tag",
        "--graph-node-attachment",
      ]) {
        expect(graphStyle.getPropertyValue(role).trim()).not.toBe("");
      }
      await userEvent.click(within(dialog).getByText("Filters"));
      await expect(within(dialog).getByLabelText("Search files")).toBeVisible();
      await expect(within(dialog).getByLabelText("Show tags")).toBeVisible();

      if (layout === "middle-top-tabs") {
        await expectAsyncQueryFailureAndRecovery({
          target: app.metadataCache,
          method: "queryMetadataPage",
          trigger: () => triggerMetadataReset(app),
          expectFailure: async () => {
            await waitFor(() => expect(panel.getByRole("alert")).toBeVisible());
          },
          expectRecovery: async () => {
            await waitFor(() => {
              expect(panel.queryByRole("alert")).toBeNull();
              expect(panel.getByText(/\d+ nodes • \d+ links/)).toBeVisible();
            });
          },
        });

        await userEvent.click(
          within(dialog).getByRole("button", { name: /Groups/ }),
        );
        await userEvent.click(
          within(dialog).getByRole("button", { name: "Add group" }),
        );
        const groupQuery = within(dialog).getByLabelText("Group 1 query");
        await userEvent.type(groupQuery, "path:Code");
        await waitFor(() => expect(groupQuery).toHaveValue("path:Code"));

        await userEvent.click(displayTrigger);
        await userEvent.click(
          within(dialog).getByRole("button", { name: "Animate graph" }),
        );
        const stopAnimation = await within(dialog).findByRole("button", {
          name: "Stop graph animation",
        });
        await userEvent.click(stopAnimation);

        await userEvent.click(
          within(dialog).getByRole("button", { name: "Forces" }),
        );
        expect(
          within(dialog).getByRole("slider", { name: "Center force" }),
        ).toHaveAttribute("aria-valuemax", "1");
        expect(
          within(dialog).getByRole("slider", { name: "Link distance" }),
        ).toHaveAttribute("aria-valuemax", "500");
      }
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Global Graph in a main-area top tab over an indexed linked vault.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Global Graph inside the real stacked-tabs presentation.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Global Graph remains placement-independent in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Global Graph rendered in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Global Graph inside the real grouped bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Global Graph inside a grouped right-sidebar item.",
);
