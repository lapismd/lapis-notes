import type { App } from "@lapis-notes/api";
import { Backlinks } from "@lapis-notes/markdown";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectAsyncQueryFailureAndRecovery,
  expectLinkPanelAlignment,
  expectLinkPreviewHoverHandoff,
  expectLinkPreviewPlacement,
  expectMarkdownDocumentScroll,
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  panelDemoApp,
  placementParameters,
  triggerMetadataReset,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "backlinks" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Markdown/Panels/Backlinks",
  component: Backlinks,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description:
        "Initialized Lapis App supplied by the Markdown plugin view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Backlinks accepts only the initialized Lapis App. It groups linked and exact unlinked mentions for the active Markdown note.",
      },
    },
  },
} satisfies Meta<typeof Backlinks>;

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
        "backlinks-panel",
        args,
      );
      await waitFor(() => {
        expect(panel.getByText("Linked mentions")).toBeVisible();
        expect(panel.getByText("Unlinked mentions")).toBeVisible();
        expect(panel.getAllByRole("button", { name: /^Ideas/ })).toHaveLength(
          2,
        );
        expect(panel.getByRole("button", { name: /^Research/ })).toBeVisible();
      });
      await expectLinkPanelAlignment(canvasElement, "backlinks-panel");
      if (layout === "middle-top-tabs" || layout === "stacked-tabs") {
        await expectMarkdownDocumentScroll(canvasElement);
      }
      if (layout === "middle-top-tabs") {
        const app = panelDemoApp(canvasElement);
        const file = app.vault.getFileByPath("Notes/Research.md");
        if (!file) throw new Error("Missing seeded Research note");
        const current = await app.vault.read(file);
        await app.vault.modify(file, `${current}\nSee [[Welcome]].\n`);
        await waitFor(() => {
          expect(
            panel.getAllByRole("button", { name: /^Research/ }),
          ).toHaveLength(2);
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
      await userEvent.type(search, "research");
      if (layout === "middle-top-tabs") {
        await expect(
          panel.getAllByRole("button", { name: /^Research/ }),
        ).toHaveLength(2);
      } else {
        await expect(
          panel.getByRole("button", { name: /^Research/ }),
        ).toBeVisible();
      }
      if (layout === "middle-top-tabs") {
        const previewTrigger = panel.getAllByRole("button", {
          name: /^Open Research:/,
        })[0]!;
        await expect(previewTrigger).toHaveAttribute("aria-haspopup", "dialog");
        await userEvent.hover(previewTrigger);
        await waitFor(
          () => {
            expect(
              canvasElement.ownerDocument.querySelector<HTMLElement>(
                '[data-ui-component="hover-card"][data-ui-part="hover-card-content"]',
              ),
            ).toBeVisible();
          },
          { timeout: 5_000 },
        );
        const preview = canvasElement.ownerDocument.querySelector<HTMLElement>(
          '[data-ui-component="hover-card"][data-ui-part="hover-card-content"]',
        );
        if (!preview) throw new Error("Missing Backlinks preview");
        expect(preview.getBoundingClientRect().width).toBeGreaterThanOrEqual(
          400,
        );
        const fileEmbed = preview.querySelector<HTMLElement>(
          '[data-ui-component="file-embed"]',
        );
        expect(fileEmbed).toBeVisible();
        expect(fileEmbed?.querySelector(".lapis-file-embed__title")).toBeNull();
        expect(
          fileEmbed?.querySelector(".mira-embed.internal-embed"),
        ).toBeNull();
        expect(
          within(preview).getByRole("button", { name: "Open Research.md" }),
        ).toBeVisible();
        await waitFor(() => {
          expect(preview.querySelector("[data-markdown-embed]")).toBeVisible();
        });
        await waitFor(() =>
          expectLinkPreviewPlacement(previewTrigger, preview, false),
        );
        await expectLinkPreviewHoverHandoff(previewTrigger, preview);
        await userEvent.keyboard("{Escape}");
        await userEvent.click(previewTrigger);
        await waitFor(() => {
          expect(
            (
              panelDemoApp(canvasElement).workspace.activeLeaf?.view as {
                file?: { path?: string };
              }
            ).file?.path,
          ).toBe("Notes/Research.md");
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
  "Backlinks beside its target note with linked and unlinked mention groups visible.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Backlinks selected in real stacked tabs beside its target note.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Backlinks in the left sidebar with only its target note in the body.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Backlinks in the right sidebar with only its target note in the body.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Backlinks inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Backlinks as the only view in a grouped right-sidebar item.",
);

export const QueryFailure: Story = {
  name: "Query failure and recovery",
  parameters: placementParameters(
    kind,
    "middle-top-tabs",
    sources.MiddleTopTabs,
    "Backlinks surfaces an indexed-query failure and recovers after invalidation.",
  ),
  render: renderPlacement("middle-top-tabs"),
  play: async ({ args, canvasElement }) => {
    const panel = await expectPanelPlacement(
      canvasElement,
      kind,
      "middle-top-tabs",
      "backlinks-panel",
      args,
    );
    const app = panelDemoApp(canvasElement);
    await expectAsyncQueryFailureAndRecovery({
      target: app.metadataCache,
      method: "queryLinks",
      trigger: () => triggerMetadataReset(app),
      expectFailure: () =>
        waitFor(() => {
          expect(panel.getByRole("alert")).toHaveTextContent(
            "Storybook metadata query failure",
          );
        }),
      expectRecovery: () =>
        waitFor(() => {
          const livePanel = within(
            canvasElement.querySelector<HTMLElement>(
              '[data-testid="backlinks-panel"]',
            )!,
          );
          expect(livePanel.queryByRole("alert")).not.toBeInTheDocument();
          expect(livePanel.getByText("Linked mentions")).toBeVisible();
        }),
    });
  },
};
