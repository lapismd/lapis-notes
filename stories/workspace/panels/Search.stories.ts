import type { App } from "@lapis-notes/api";
import { SearchPanel } from "@lapis-notes/search";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import PanelDemo from "./PanelDemo.svelte";
import { panelExampleSources } from "./Panel.example-sources";
import type { PanelDemoLayout } from "./create-panel-demo";
import {
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
} from "./panel-story-helpers";
import "./Panel.docs.css";

const kind = "search" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Workspace/Panels/Search/Search",
  component: SearchPanel,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description: "Initialized Lapis App supplied by the Search view.",
    },
    initialQuery: {
      control: false,
      description: "Optional query restored from workspace state.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Search composes Design Core SearchFilterBar with the Lapis query language and API-backed vault index.",
      },
    },
  },
} satisfies Meta<typeof SearchPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function renderPlacement(layout: PanelDemoLayout): StoryRender {
  return (() => ({ Component: PanelDemo, props: { kind, layout } })) as StoryRender;
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
        "search-panel",
        args,
      );
      const searchbox = panel.getByRole("searchbox", { name: "Search vault" });
      await userEvent.click(searchbox);
      await userEvent.type(searchbox, "Welcome");

      await waitFor(() => {
        expect(panel.getByText("Notes/Welcome.md")).toBeVisible();
        expect(panel.getByText(/result/)).toBeVisible();
      });
      const editor = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"] .cm-editor',
      );
      expect(editor).not.toBeNull();
      expect(
        editor?.querySelectorAll(".cm-content .cm-line > span").length,
      ).toBeGreaterThan(0);
      expect(
        canvasElement.querySelectorAll('[data-testid="search-panel"] mark').length,
      ).toBeGreaterThan(0);

      await userEvent.click(
        panel.getByRole("button", { name: "Expand filter options" }),
      );
      const markdownFacet = panel.getByRole("button", { name: "Markdown" });
      await expect(markdownFacet).toBeVisible();
      await userEvent.click(markdownFacet);
      await expect(markdownFacet).toHaveAttribute("aria-pressed", "true");
      await expect(panel.getByText("Vault search syntax")).toBeVisible();

      if (layout === "middle-top-tabs") {
        await userEvent.selectOptions(
          panel.getByRole("combobox", { name: "Sort search results" }),
          "modified-desc",
        );
        await userEvent.click(
          panel.getByRole("button", { name: "Open Notes/Welcome.md" }),
        );
        await waitFor(() => {
          expect(
            canvasElement.querySelector(
              '.markdown-view, [data-ui-component="markdown-mira-preview"]',
            ),
          ).not.toBeNull();
        });
      }
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Search in the middle workspace over the real indexed in-memory vault.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Search selected inside the real stacked-tabs presentation.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Search in its canonical left-sidebar placement.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Search remains placement-independent in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Search inside the real grouped bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Search inside a grouped right-sidebar item.",
);
