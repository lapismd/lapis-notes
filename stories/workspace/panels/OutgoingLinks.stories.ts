import type { App } from "@lapis-notes/api";
import { OutgoingLinks } from "@lapis-notes/markdown";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "./PanelDemo.svelte";
import { panelExampleSources } from "./Panel.example-sources";
import type { PanelDemoLayout } from "./create-panel-demo";
import {
  expectLinkPanelAlignment,
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  panelDemoApp,
  placementParameters,
} from "./panel-story-helpers";
import "./Panel.docs.css";

const kind = "outgoing-links" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Workspace/Panels/Markdown/Outgoing Links",
  component: OutgoingLinks,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description: "Initialized Lapis App supplied by the Markdown plugin view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Outgoing Links accepts only the initialized Lapis App. It groups resolved links and exact unresolved note-name mentions from the active note.",
      },
    },
  },
} satisfies Meta<typeof OutgoingLinks>;

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
        "outgoing-links-panel",
        args,
      );
      await waitFor(() => {
        expect(panel.getByText("Links")).toBeVisible();
        expect(panel.getByText("Unlinked mentions")).toBeVisible();
        expect(panel.getByRole("button", { name: /^Ideas/ })).toBeVisible();
        expect(panel.getByRole("button", { name: /^Research/ })).toBeVisible();
      });
      await expectLinkPanelAlignment(canvasElement, "outgoing-links-panel");

      const panelElement = canvasElement.querySelector<HTMLElement>(
        '[data-testid="outgoing-links-panel"]',
      );
      const iconScope = panelElement?.closest<HTMLElement>(
        '[data-ui-component="workspace-tabs"], [data-ui-component="workspace-stacked-tabs"], [data-ui-component="workspace-sidebar"], [data-ui-component="workspace-bottom-panel-group"], [data-ui-component="workspace-sidebar-group"]',
      );
      expect(iconScope).not.toBeNull();
      expect(iconScope?.querySelector("svg.lucide-external-link")).not.toBeNull();

      if (layout === "middle-top-tabs") {
        const app = panelDemoApp(canvasElement);
        const file = app.vault.getFileByPath("Notes/Welcome.md");
        if (!file) throw new Error("Missing seeded Welcome note");
        const current = await app.vault.read(file);
        await app.vault.modify(file, `${current}\nSee [[Research]].\n`);
        await waitFor(() => {
          const linkedSection = panel.getByText("Links").closest("section");
          const unlinkedSection = panel
            .getByText("Unlinked mentions")
            .closest("section");
          if (!linkedSection || !unlinkedSection) {
            throw new Error("Missing outgoing link sections");
          }
          expect(
            within(linkedSection).getByRole("button", { name: /^Research/ }),
          ).toBeVisible();
          expect(
            within(unlinkedSection).queryByRole("button", {
              name: /^Research/,
            }),
          ).not.toBeInTheDocument();
        });
      }
      const contextToggle = panel.getByRole("button", {
        name: "Show more context",
      });
      await userEvent.click(contextToggle);
      await expect(contextToggle).toHaveAttribute("aria-pressed", "true");
      const searchToggle = panel.getByRole("button", {
        name: "Search link results",
      });
      await userEvent.click(searchToggle);
      const search = panel.getByRole("textbox", {
        name: "Search link results",
      });
      await userEvent.type(search, "ideas");
      await expect(
        panel.getByRole("button", { name: /^Ideas/ }),
      ).toBeVisible();
      if (layout === "middle-top-tabs") {
        const previewTrigger = panel.getAllByRole("button", {
          name: /^Open Ideas:/,
        })[0]!;
        await expect(previewTrigger).toHaveAttribute("aria-haspopup", "dialog");
        await userEvent.hover(previewTrigger);
        await waitFor(() => {
          const preview = canvasElement.ownerDocument.querySelector(
            '[data-ui-component="popover"][data-ui-part="popover-content"]',
          );
          expect(preview).toBeVisible();
          expect(preview).toHaveTextContent("Ideas.markdown");
        });
        await userEvent.click(previewTrigger);
        await waitFor(() => {
          expect(
            (
              panelDemoApp(canvasElement).workspace.activeLeaf?.view as {
                file?: { path?: string };
              }
            ).file?.path,
          ).toBe("Notes/Ideas.markdown");
        });
        await userEvent.click(
          panel.getByRole("button", { name: "Change sort order" }),
        );
        await userEvent.click(
          within(canvasElement.ownerDocument.body).getByText(
            "Modified time (new to old)",
          ),
        );
      }
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Outgoing Links beside its source note with linked and unlinked result groups visible.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Outgoing Links selected in real stacked tabs beside its source note.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Outgoing Links in the left sidebar with only its source note in the body.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Outgoing Links in the right sidebar with only its source note in the body.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Outgoing Links inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Outgoing Links as the only view in a grouped right-sidebar item.",
);
