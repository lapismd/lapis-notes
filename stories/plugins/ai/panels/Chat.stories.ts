import { AiChatPanel, type AgentRuntime } from "@lapis-notes/ai";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect } from "storybook/test";
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

const kind = "ai-chat" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/AI/Panels/Chat",
  component: AiChatPanel,
  args: { runtime: undefined as unknown as AgentRuntime },
  argTypes: {
    runtime: {
      control: false,
      description: "Agent runtime selected by the owning AI plugin view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "AI Chat remains full-height and keeps its composer anchored across every workspace placement.",
      },
    },
  },
} satisfies Meta<typeof AiChatPanel>;

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
        "ai-chat-panel",
        args,
      );
      await expect(
        panel.getByRole("combobox", { name: "Message" }),
      ).toBeVisible();
      await expect(panel.getByText("Ask anything…")).toBeVisible();
      await expect(
        panel.getByRole("button", { name: "Effort and model" }),
      ).toBeVisible();
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "AI Chat in the middle workspace with its bottom composer visible.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "AI Chat selected in real stacked tabs.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "AI Chat in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "AI Chat in its canonical right-sidebar placement.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "AI Chat inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "AI Chat as a grouped right-sidebar item.",
);
