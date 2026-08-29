import type { Meta, StoryObj } from "@storybook/svelte-vite";
import {
  AiCatalogPanel,
  AiCatalogViewType,
  AiPlugin,
} from "@lapis-notes/ai";
import { expect, userEvent, waitFor } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  panelDemoApp,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "ai-catalog" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/AI/Panels/Catalog",
  component: AiCatalogPanel,
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "AI Catalog is a live explorer-aligned tree of application tools, slash commands, and skills nested under the plugin or folder that owns them.",
      },
    },
  },
} satisfies Meta<typeof AiCatalogPanel>;

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
        "ai-catalog",
        args,
      );
      expect(panel.getByRole("tree", { name: "AI catalog" })).toBeVisible();
      expect(panel.getByRole("treeitem", { name: "Search" })).toBeVisible();
      expect(panel.getByRole("treeitem", { name: "AI" })).toBeVisible();
      expect(
        panel.getAllByRole("treeitem", { name: "Tools" }).length,
      ).toBeGreaterThan(0);
      expect(panel.getByText("/search")).toBeVisible();
      expect(panel.getByText("/help")).toBeVisible();
      expect(panel.getByText("lapis-notes")).toBeVisible();
      const openReview = await waitFor(
        () => {
          const button = panel.getByRole("button", { name: "Open review" });
          expect(button).toBeVisible();
          return button;
        },
        { timeout: 12_000 },
      );
      const app = panelDemoApp(canvasElement);

      await userEvent.click(
        panel.getByRole("treeitem", { name: "notes_search" }),
      );
      expect(panel.getByText(/Search the user's Lapis Notes/i)).toBeVisible();

      await userEvent.click(panel.getByRole("button", { name: "Expand all" }));
      await waitFor(() => {
        expect(
          panel.getByRole("button", { name: "Collapse all" }),
        ).toBeVisible();
      });
      expect(app.workspace.getLeavesOfType(AiCatalogViewType)).toHaveLength(1);

      const checkbox = panel.getByRole("checkbox", {
        name: "Enable notes_search for the next chat",
      });
      expect(checkbox).toHaveAttribute("data-state", "checked");
      await userEvent.click(checkbox);
      await waitFor(() => {
        const plugin = app.plugins.plugins.get("ai");
        expect(plugin instanceof AiPlugin).toBe(true);
        if (!(plugin instanceof AiPlugin)) return;
        expect(plugin.getSettings().disabledAppToolNames).toContain(
          "notes_search",
        );
      });
      await userEvent.click(openReview);
      await waitFor(() => {
        expect(app.workspace.getActiveFile()?.path).toBe(
          "Notes/.agents/commands/review.md",
        );
      });
      await userEvent.type(panel.getByLabelText("Filter catalog"), "daily");
      await waitFor(() => {
        expect(panel.getByRole("button", { name: "Open daily" })).toBeVisible();
        expect(panel.queryByText("lapis-notes")).toBeNull();
      });

      await userEvent.click(panel.getByRole("button", { name: "Open daily" }));
      await waitFor(() => {
        expect(app.workspace.getActiveFile()?.path).toBe(
          "Notes/.agents/skills/daily/SKILL.md",
        );
      });

      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "AI Catalog beside an active Markdown note, nested by owner and kind.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "AI Catalog selected in real stacked tabs with the same owner and kind tree.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "AI Catalog in its canonical left-sidebar placement.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "AI Catalog moved to the right sidebar while remaining placement-neutral.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "AI Catalog inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "AI Catalog as a grouped right-sidebar item with placement-neutral paint.",
);
