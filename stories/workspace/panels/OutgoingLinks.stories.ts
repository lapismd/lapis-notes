import type { App } from "@lapis-notes/api";
import { OutgoingLinks } from "@lapis-notes/markdown";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "./PanelDemo.svelte";
import { panelExampleSources } from "./Panel.example-sources";
import type { PanelDemoLayout } from "./create-panel-demo";
import {
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
          "Outgoing Links accepts only the initialized Lapis App. It groups resolved links and exact unresolved note-name mentions from the active note.",
      },
    },
  },
} satisfies Meta<typeof OutgoingLinks>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function renderPlacement(layout: PanelDemoLayout): StoryRender {
  return (() => ({
    Component: PanelDemo,
    props: { kind, layout },
  })) as StoryRender;
}

async function expectDocumentLinkPreview(
  canvasElement: HTMLElement,
  panelElement: HTMLElement,
): Promise<void> {
  const ownerDocument = canvasElement.ownerDocument;
  const trigger = canvasElement.querySelector<HTMLElement>(
    '.markdown-view__editor [data-link-preview-trigger][data-link-preview-path="Ideas"]',
  );
  if (!trigger)
    throw new Error("Missing Welcome.md Ideas link preview trigger");

  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await userEvent.hover(trigger);
  await waitFor(
    () => {
      expect(
        ownerDocument.querySelector<HTMLElement>(
          '[data-mira-link-preview-content][data-link-preview-path="Ideas"]',
        ),
      ).toBeVisible();
    },
    { timeout: 5_000 },
  );

  const preview = ownerDocument.querySelector<HTMLElement>(
    '[data-mira-link-preview-content][data-link-preview-path="Ideas"]',
  );
  if (!preview) throw new Error("Missing Mira document link preview");
  const viewport = ownerDocument.documentElement;

  expect(ownerDocument.body.contains(preview)).toBe(true);
  expect(
    preview.closest('[data-ui-component="workspace-view-host"]'),
  ).toBeNull();
  expect(preview).toHaveTextContent("Ideas.markdown");
  expect(preview.querySelector(".mira-link-preview__markdown")).toBeVisible();
  expect(["top", "right", "bottom", "left"]).toContain(
    preview.getAttribute("data-side"),
  );

  const panelHost = panelElement.closest<HTMLElement>(
    '[data-ui-component="workspace-view-host"]',
  );
  if (!panelHost) throw new Error("Missing adjacent Outgoing Links view host");
  await waitFor(
    () => {
      const previewRect = preview.getBoundingClientRect();
      const panelRect = panelHost.getBoundingClientRect();
      const overlapLeft = Math.max(previewRect.left, panelRect.left);
      const overlapRight = Math.min(previewRect.right, panelRect.right);
      const overlapTop = Math.max(previewRect.top, panelRect.top);
      const overlapBottom = Math.min(previewRect.bottom, panelRect.bottom);

      expect(previewRect.width).toBeGreaterThanOrEqual(400);
      expect(previewRect.left).toBeGreaterThanOrEqual(0);
      expect(previewRect.top).toBeGreaterThanOrEqual(0);
      expect(previewRect.right).toBeLessThanOrEqual(viewport.clientWidth + 1);
      expect(previewRect.bottom).toBeLessThanOrEqual(viewport.clientHeight + 1);
      expect(overlapRight - overlapLeft).toBeGreaterThan(8);
      expect(overlapBottom - overlapTop).toBeGreaterThan(8);
      expect(
        ownerDocument
          .elementFromPoint(
            overlapLeft + (overlapRight - overlapLeft) / 2,
            overlapTop + Math.min((overlapBottom - overlapTop) / 2, 24),
          )
          ?.closest("[data-mira-link-preview-content]"),
      ).toBe(preview);
    },
    { timeout: 3_000 },
  );

  await userEvent.keyboard("{Escape}");
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
      if (layout === "middle-top-tabs" || layout === "stacked-tabs") {
        await expectMarkdownDocumentScroll(canvasElement);
      }

      const panelElement = canvasElement.querySelector<HTMLElement>(
        '[data-testid="outgoing-links-panel"]',
      );
      const iconScope = panelElement?.closest<HTMLElement>(
        '[data-ui-component="workspace-tabs"], [data-ui-component="workspace-stacked-tabs"], [data-ui-component="workspace-sidebar"], [data-ui-component="workspace-bottom-panel-group"], [data-ui-component="workspace-sidebar-group"]',
      );
      expect(iconScope).not.toBeNull();
      expect(
        iconScope?.querySelector("svg.lucide-external-link"),
      ).not.toBeNull();

      if (layout === "middle-top-tabs") {
        if (!panelElement) throw new Error("Missing Outgoing Links panel");
        await expectDocumentLinkPreview(canvasElement, panelElement);

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
      await expect(panel.getByRole("button", { name: /^Ideas/ })).toBeVisible();
      if (layout === "middle-top-tabs") {
        const previewTrigger = panel.getAllByRole("button", {
          name: /^Open Ideas:/,
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
        if (!preview) throw new Error("Missing Outgoing Links preview");
        expect(preview).toHaveTextContent("Ideas.markdown");
        expect(preview.getBoundingClientRect().width).toBeGreaterThanOrEqual(
          400,
        );
        expect(
          preview.querySelector('[data-ui-component="file-embed"]'),
        ).toBeVisible();
        expect(
          preview.querySelector(".mira-embed.internal-embed"),
        ).toBeVisible();
        expect(preview.querySelector("[data-markdown-embed]")).toBeVisible();
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
