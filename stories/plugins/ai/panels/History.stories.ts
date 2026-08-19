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
          "AI History is a folder-aware, local-first conversation tree. It follows the active note scope, shows a dimmed creation-folder path, and remains placement-neutral across the workspace.",
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
      expect(panelElement).toHaveAttribute("data-creation-scope", "Notes");
      const creationPath = panel.getByTestId("ai-history-creation-scope");
      expect(creationPath).toHaveTextContent("Notes");

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
      const chrome = panelElement?.querySelector<HTMLElement>(
        '[data-ui-part="chrome"]',
      );
      const searchPill = chrome?.querySelector<HTMLElement>(
        ".cv-search-filter-bar__search-pill",
      );
      const actions = chrome?.querySelector<HTMLElement>(
        ".cv-search-filter-bar__actions",
      );
      expect(chrome).not.toBeNull();
      expect(searchPill).not.toBeNull();
      expect(actions).not.toBeNull();
      const chromeBox = chrome!.getBoundingClientRect();
      const pillBox = searchPill!.getBoundingClientRect();
      const actionsBox = actions!.getBoundingClientRect();
      const clusterCenter =
        (Math.min(pillBox.left, actionsBox.left) +
          Math.max(pillBox.right, actionsBox.right)) /
        2;
      expect(
        Math.abs(clusterCenter - (chromeBox.left + chromeBox.right) / 2),
      ).toBeLessThan(8);

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

      const newChat = panel.getByRole("button", { name: "New chat in Notes" });
      expect(newChat).toBeVisible();
      await userEvent.hover(newChat);
      await waitFor(() => {
        expect(
          canvasElement.ownerDocument.body.querySelector(
            '[data-slot="tooltip-content"]',
          ),
        ).toHaveTextContent("New chat in Notes");
      });
      await userEvent.unhover(newChat);
      await waitFor(() => {
        expect(
          canvasElement.ownerDocument.body.querySelector(
            '[data-slot="tooltip-content"]',
          ),
        ).toBeNull();
      });

      const expandAll = panel.getByRole("button", {
        name: "Expand all conversation folders",
      });
      await userEvent.hover(expandAll);
      await waitFor(() => {
        expect(
          canvasElement.ownerDocument.body.querySelector(
            '[data-slot="tooltip-content"]',
          ),
        ).toHaveTextContent("Expand all conversation folders");
      });
      await userEvent.unhover(expandAll);
      await waitFor(() => {
        expect(
          canvasElement.ownerDocument.body.querySelector(
            '[data-slot="tooltip-content"]',
          ),
        ).toBeNull();
      });

      await userEvent.click(expandAll);
      await waitFor(() => {
        expect(
          panel.getByRole("treeitem", {
            name: "Projects/Atlas, 1 conversation",
          }),
        ).toBeVisible();
      });
      const countRights = [
        ...panelElement.querySelectorAll<HTMLElement>(".ai-history__count"),
      ].map((count) => count.getBoundingClientRect().right);
      expect(countRights.length).toBeGreaterThan(1);
      expect(Math.max(...countRights) - Math.min(...countRights)).toBeLessThan(
        2,
      );

      await userEvent.click(
        panel.getByRole("treeitem", { name: "Projects, 1 conversation" }),
      );
      await waitFor(() => {
        expect(panelElement).toHaveAttribute("data-creation-scope", "Projects");
        expect(creationPath).toHaveTextContent("Projects");
        expect(
          panel.getByRole("button", { name: "New chat in Projects" }),
        ).toBeVisible();
      });
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
