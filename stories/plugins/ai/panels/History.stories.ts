import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { AiHistoryPanel } from "@lapis-notes/ai";
import { expect, userEvent, waitFor } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "ai-history" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/AI/Panels/History",
  component: AiHistoryPanel,
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "AI History is a folder-aware, local-first conversation tree. It follows the active note scope while remaining placement-neutral across the workspace.",
      },
    },
  },
} satisfies Meta<typeof AiHistoryPanel>;

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
        "ai-conversation-history",
        args,
      );
      const panelElement = canvasElement.querySelector<HTMLElement>(
        '[data-testid="ai-conversation-history"]',
      );
      expect(panelElement).not.toBeNull();
      expect(panelElement).toHaveAttribute("data-current-scope", "Notes");

      const tree = panel.getByRole("tree", { name: "Conversation history" });
      const activeFolder = panel.getByRole("treeitem", {
        name: "Notes, 1 conversation",
      });
      expect(activeFolder).toHaveAttribute("aria-selected", "true");
      expect(activeFolder).toHaveAttribute("aria-expanded", "true");
      expect(
        panel.getByRole("button", { name: "Summarize project notes" }),
      ).toBeVisible();
      expect(panel.queryByText("Archived planning chat")).toBeNull();
      expect(tree.querySelectorAll('[role="treeitem"]')).not.toHaveLength(0);

      const search = panel.getByRole("searchbox", {
        name: "Search conversations",
      });
      await userEvent.type(search, "parser");
      await waitFor(() => {
        expect(
          panel.getByRole("button", { name: "Fix parser errors" }),
        ).toBeVisible();
        expect(
          panelElement?.querySelectorAll(".suggestion-highlight").length,
        ).toBeGreaterThan(0);
      });

      await userEvent.click(
        panel.getByRole("button", { name: "Clear search" }),
      );
      await waitFor(() => {
        expect(
          panel.getByRole("button", { name: "Summarize project notes" }),
        ).toBeVisible();
      });

      await userEvent.click(
        panel.getByRole("button", { name: "Show conversation options" }),
      );
      const archivedSwitch = panel.getByRole("switch", {
        name: "Show archived conversations",
      });
      await userEvent.click(archivedSwitch);
      expect(archivedSwitch).toHaveAttribute("data-state", "checked");
      await waitFor(() => {
        expect(panel.getByText("Archived planning chat")).toBeVisible();
        expect(
          panel.getByRole("treeitem", { name: "Notes, 2 conversations" }),
        ).toBeVisible();
      });

      expect(panel.getByRole("button", { name: "New chat" })).toBeVisible();
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "AI History alongside an active Markdown note, with its folder selected automatically.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "AI History selected in real stacked tabs while retaining active-note scope.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "AI History in the left sidebar using the same tree geometry as Explorer.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "AI History in its canonical right-sidebar placement.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "AI History inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "AI History as a grouped right-sidebar item with placement-neutral paint.",
);
