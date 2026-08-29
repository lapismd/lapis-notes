import type { App } from "@lapis-notes/api";
import { HistoryPanel, HistoryPlugin } from "@lapis-notes/history";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectPanelPlacement,
  expectPanelSource,
  panelDemoApp,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "history" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/History/Panels/History",
  component: HistoryPanel,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description: "Initialized Lapis App supplied by the History view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "History lists AppDatabase file revisions for the focused note and opens a reused compare tab.",
      },
    },
  },
} satisfies Meta<typeof HistoryPanel>;

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
        "history-panel",
        args,
      );
      const app = panelDemoApp(canvasElement);
      await waitFor(() => {
        expect(panel.getByRole("list", { name: "File history" })).toBeVisible();
        expect(panel.getAllByRole("button").length).toBeGreaterThanOrEqual(2);
      });

      expect(
        await app.appDatabase.getFileHistory(".lapis/ignored.md"),
      ).toBeNull();
      expect(await app.appDatabase.getFileHistory(".jj/config")).toBeNull();

      const rows = panel
        .getAllByRole("button")
        .filter((button) => button.hasAttribute("data-revision-id"));
      expect(rows.length).toBeGreaterThanOrEqual(2);

      rows[0]!.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await userEvent.click(await body.findByText("Select for compare"));
      await waitFor(() => {
        expect(rows[0]).toHaveAttribute("data-compare-anchor", "true");
        expect(panel.getByTestId("history-compare-anchor")).toBeVisible();
      });

      rows[1]!.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      );
      const compareSelected = await body.findByText("Compare with selected");
      expect(compareSelected).not.toHaveAttribute("aria-disabled", "true");
      await userEvent.click(compareSelected);

      await waitFor(() => {
        expect(
          canvasElement.querySelector('[data-testid="history-compare-panel"]'),
        ).not.toBeNull();
        expect(
          canvasElement.querySelector('[data-ui-component="file-diff"]'),
        ).not.toBeNull();
      });
      expect(app.plugins.plugins.get("history")).toBeInstanceOf(HistoryPlugin);
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "History in the middle workspace over a seeded tracked note.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "History selected inside the real stacked-tabs presentation.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "History remains placement-independent in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "History in its canonical right-sidebar placement.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "History inside the real grouped bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "History inside a grouped right-sidebar item.",
);
