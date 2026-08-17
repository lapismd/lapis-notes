import { ExplorerPanel } from "@lapis-notes/file-explorer";
import type { ExplorerController } from "@lapismd/design-core/workspace/explorer";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
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

const kind = "explorer" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Explorer/Panels/Explorer",
  component: ExplorerPanel,
  args: { controller: undefined as unknown as ExplorerController },
  argTypes: {
    controller: {
      control: false,
      description:
        "Explorer controller supplied by the registered plugin view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Explorer is a placement-neutral vault tree rendered by the production plugin panel.",
      },
    },
  },
} satisfies Meta<typeof ExplorerPanel>;

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
        "lapis-editor-explorer",
        args,
      );
      await expect(panel.getByText("Notes")).toBeVisible();
      await expect(
        panel.getByRole("button", { name: "Create File" }),
      ).toBeVisible();
      const notes = panel.getByText("Notes");
      notes.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await expect(body.findByText("Copy Path")).resolves.toBeVisible();
      expect(body.queryByText("From system root")).toBeNull();
      expect(body.queryByText("As Lapis URL")).toBeNull();
      expect(body.queryByText("Open in default app")).toBeNull();
      expect(body.queryByText("Reveal in Finder")).toBeNull();
      expect(body.queryByText("Reveal in File Explorer")).toBeNull();
      expect(body.queryByText("Reveal in file manager")).toBeNull();
      await userEvent.keyboard("{Escape}");
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Explorer in the middle workspace with standard top-tab chrome.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Explorer selected in real stacked tabs.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Explorer in its canonical left-sidebar placement.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Explorer moved to the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Explorer inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Explorer as a grouped right-sidebar item.",
);
