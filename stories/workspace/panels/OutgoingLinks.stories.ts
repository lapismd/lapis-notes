import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
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

function resizeMainSplit(app: App, sizes: number[]): () => void {
  const renderer = getWorkspaceHostBinding(app.workspace).controller.renderer;
  const snapshot = renderer.getLayout();
  if (snapshot.main.kind !== "split") {
    throw new Error("Expected the Outgoing Links main split");
  }
  const originalSizes = [...snapshot.main.sizes];
  if (!renderer.setSplitSizes(snapshot.main.id, sizes)) {
    throw new Error("Could not constrain the Outgoing Links main split");
  }
  return () => {
    renderer.setSplitSizes(snapshot.main.id, originalSizes);
  };
}

async function replaceEditablePreview(
  preview: HTMLElement,
  value: string,
): Promise<void> {
  const renderedTarget = preview.querySelector<HTMLElement>(
    ".mira-editable-markdown-preview__preview [data-offset]",
  );
  if (!renderedTarget) throw new Error("Missing editable rendered content");
  await userEvent.click(renderedTarget);
  await waitFor(() => {
    expect(
      preview.querySelector("[data-editable-markdown-editor]"),
    ).toBeVisible();
  });

  const editor = preview.querySelector<HTMLElement>(".cm-content");
  if (!editor) throw new Error("Missing editable preview CodeMirror content");
  await userEvent.click(editor);
  await new Promise((resolve) => setTimeout(resolve, 50));
  await userEvent.keyboard("{Control>}a{/Control}");
  await userEvent.paste(value);
  expect(
    preview.querySelector(
      '[data-save-state="dirty"], [data-save-state="saving"]',
    ),
  ).toBeVisible();
  await waitFor(
    () => {
      expect(preview.querySelector('[data-save-state="saved"]')).toBeVisible();
    },
    { timeout: 3_000 },
  );
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
  expect(preview.querySelector(".mira-link-preview__title")).toBeNull();
  expect(preview.querySelector(".mira-link-preview__path")).toBeNull();
  expect(preview.querySelector(".mira-link-preview__markdown")).toBeVisible();
  const renderedMarkdown = preview.querySelector<HTMLElement>(
    ".mira-link-preview__markdown",
  );
  if (!renderedMarkdown) throw new Error("Missing rendered Mira preview");
  const renderedPadding = getComputedStyle(renderedMarkdown);
  expect(parseFloat(renderedPadding.paddingBlockStart)).toBeGreaterThanOrEqual(
    16,
  );
  expect(parseFloat(renderedPadding.paddingInlineStart)).toBeGreaterThanOrEqual(
    32,
  );
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

  const app = panelDemoApp(canvasElement);
  const ideasFile = app.vault.getFileByPath("Notes/Ideas.markdown");
  if (!ideasFile) throw new Error("Missing seeded Ideas note");
  const nextValue = "edited through the ordinary hover preview.";
  await replaceEditablePreview(preview, nextValue);
  await waitFor(async () => {
    expect(await app.vault.read(ideasFile)).toBe(nextValue);
  });
  await waitFor(() => {
    expect(getComputedStyle(preview).borderTopWidth).toBe("2px");
    const previewRect = preview.getBoundingClientRect();
    expect(previewRect.right).toBeLessThanOrEqual(viewport.clientWidth + 1);
    expect(previewRect.bottom).toBeLessThanOrEqual(viewport.clientHeight + 1);
    expect(
      ownerDocument
        .elementFromPoint(
          previewRect.left + Math.min(previewRect.width / 2, 24),
          previewRect.top + Math.min(previewRect.height / 2, 24),
        )
        ?.closest("[data-mira-link-preview-content]"),
    ).toBe(preview);
  });

  await userEvent.hover(panelElement);
  await new Promise((resolve) => setTimeout(resolve, 350));
  expect(preview).toBeVisible();
  expect(preview.querySelector('[data-editing="true"]')).toBeVisible();
  panelElement.querySelector<HTMLElement>("button")?.focus();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(preview).toBeVisible();
  expect(preview.querySelector('[data-editing="true"]')).toBeVisible();

  await userEvent.click(ownerDocument.body);
  await waitFor(() => {
    expect(
      ownerDocument.querySelector(
        '[data-mira-link-preview-content][data-link-preview-path="Ideas"]',
      ),
    ).not.toBeInTheDocument();
  });
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
        const app = panelDemoApp(canvasElement);
        const restoreDocumentSplit = resizeMainSplit(app, [25, 75]);
        try {
          await expectDocumentLinkPreview(canvasElement, panelElement);
        } finally {
          restoreDocumentSplit();
        }

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
        const app = panelDemoApp(canvasElement);
        const welcomeFile = app.vault.getFileByPath("Notes/Welcome.md");
        if (!welcomeFile) throw new Error("Missing seeded Welcome note");
        const navigationTrigger = panel.getAllByRole("button", {
          name: /^Open Ideas:/,
        })[0]!;
        await userEvent.click(navigationTrigger);
        await waitFor(
          () => {
            expect(
              (
                app.workspace.activeLeaf?.view as {
                  file?: { path?: string };
                }
              ).file?.path,
            ).toBe("Notes/Ideas.markdown");
          },
          { timeout: 5_000 },
        );
        const navigationLeaf = app.workspace.activeLeaf;
        if (!navigationLeaf) throw new Error("Missing navigation leaf");
        await navigationLeaf.openFile(welcomeFile);
        app.workspace.setActiveLeaf(navigationLeaf, { focus: true });
        await waitFor(() => {
          expect(
            panel.getAllByRole("button", { name: /^Open Ideas:/ })[0],
          ).toBeVisible();
        });

        const restorePanelSplit = resizeMainSplit(app, [75, 25]);
        await new Promise((resolve) => setTimeout(resolve, 50));
        const previewTrigger = panel.getAllByRole("button", {
          name: /^Open Ideas:/,
        })[0]!;
        try {
          await expect(previewTrigger).toHaveAttribute(
            "aria-haspopup",
            "dialog",
          );
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
          const preview =
            canvasElement.ownerDocument.querySelector<HTMLElement>(
              '[data-ui-component="hover-card"][data-ui-part="hover-card-content"]',
            );
          if (!preview) throw new Error("Missing Outgoing Links preview");
          expect(preview.getBoundingClientRect().width).toBeGreaterThanOrEqual(
            400,
          );
          const fileEmbed = preview.querySelector<HTMLElement>(
            '[data-ui-component="file-embed"]',
          );
          expect(fileEmbed).toBeVisible();
          expect(
            fileEmbed?.querySelector(".lapis-file-embed__title"),
          ).toBeNull();
          expect(
            fileEmbed?.querySelector(".mira-embed.internal-embed"),
          ).toBeNull();
          const openButton = within(preview).getByRole("button", {
            name: "Open Ideas.markdown",
          });
          expect(openButton).toBeVisible();
          const previewHeader = openButton.closest<HTMLElement>(
            ".lapis-file-embed__header",
          );
          if (!previewHeader) throw new Error("Missing sticky preview header");
          expect(getComputedStyle(previewHeader).position).toBe("sticky");
          expect(getComputedStyle(previewHeader).top).toBe("0px");
          await waitFor(() => {
            expect(
              preview.querySelector("[data-markdown-embed]"),
            ).toBeVisible();
          });
          const embeddedMarkdown = preview.querySelector<HTMLElement>(
            "[data-markdown-embed]",
          );
          if (!embeddedMarkdown) {
            throw new Error("Missing padded panel Markdown preview");
          }
          const embeddedPadding = getComputedStyle(embeddedMarkdown);
          expect(
            parseFloat(embeddedPadding.paddingBlockStart),
          ).toBeGreaterThanOrEqual(16);
          expect(
            parseFloat(embeddedPadding.paddingInlineStart),
          ).toBeGreaterThanOrEqual(32);
          await waitFor(() =>
            expectLinkPreviewPlacement(previewTrigger, preview),
          );
          await expectLinkPreviewHoverHandoff(previewTrigger, preview);

          const ideasFile = app.vault.getFileByPath("Notes/Ideas.markdown");
          if (!ideasFile) throw new Error("Missing seeded Ideas note");
          const nextValue = "edited through the panel FileEmbed preview.";
          await replaceEditablePreview(preview, nextValue);
          await waitFor(async () => {
            expect(await app.vault.read(ideasFile)).toBe(nextValue);
          });
          expect(getComputedStyle(preview).borderTopWidth).toBe("2px");
          await waitFor(() =>
            expectLinkPreviewPlacement(previewTrigger, preview),
          );

          await userEvent.hover(panelElement);
          await new Promise((resolve) => setTimeout(resolve, 350));
          expect(preview).toBeVisible();
          expect(preview.querySelector('[data-editing="true"]')).toBeVisible();
          searchToggle.focus();
          await new Promise((resolve) => setTimeout(resolve, 50));
          expect(preview).toBeVisible();
          expect(preview.querySelector('[data-editing="true"]')).toBeVisible();

          await userEvent.click(searchToggle);
          await waitFor(() => {
            expect(
              canvasElement.ownerDocument.querySelector(
                '[data-ui-component="hover-card"][data-ui-part="hover-card-content"]',
              ),
            ).not.toBeInTheDocument();
          });
        } finally {
          restorePanelSplit();
        }
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
