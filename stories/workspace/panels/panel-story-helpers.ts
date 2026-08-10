import type { App } from "@lapis-notes/api";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import {
  PANEL_LEAF_META,
  panelLayoutMarker,
  type PanelDemoKind,
  type PanelDemoLayout,
} from "./create-panel-demo";

export const PANEL_PLACEMENTS: Record<
  PanelDemoLayout,
  { name: string; suffix: string; baseline: string }
> = {
  "middle-top-tabs": {
    name: "Middle (Top Tabs)",
    suffix: "",
    baseline: "middle-top-tabs",
  },
  "stacked-tabs": {
    name: "Stacked Tabs",
    suffix: "-stacked-tabs",
    baseline: "stacked-tabs",
  },
  "left-sidebar": {
    name: "Left Sidebar",
    suffix: "-left-sidebar",
    baseline: "left-sidebar",
  },
  "right-sidebar": {
    name: "Right Sidebar",
    suffix: "-right-sidebar",
    baseline: "right-sidebar",
  },
  "bottom-panel": {
    name: "Bottom Panel",
    suffix: "-bottom-panel",
    baseline: "bottom-panel",
  },
  "sidebar-group": {
    name: "Sidebar As a Group",
    suffix: "-sidebar-group",
    baseline: "sidebar-group",
  },
};

export const PANEL_DOCS_PARAMETERS = {
  canvas: { className: "panel-demo-docs-canvas" },
  story: { height: "700px", inline: false },
};

export function panelDemoApp(canvasElement: HTMLElement): App {
  const storyWindow = canvasElement.ownerDocument.defaultView as
    | (Window & typeof globalThis & { app?: App })
    | null;
  if (!storyWindow?.app) throw new Error("Missing initialized panel demo App");
  return storyWindow.app;
}

export function placementParameters(
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
  source: string,
  description: string,
) {
  const placement = PANEL_PLACEMENTS[layout];
  const baselinePath =
    kind === "all-properties"
      ? `/visual-baselines/stories/workspace/panels/${placement.baseline}-chromium.png`
      : `/visual-baselines/stories/workspace/panels/${kind}/${placement.baseline}-chromium.png`;
  return {
    ...workspaceCatalogParameters(`workspace-panels-${kind}${placement.suffix}`),
    layout: "fullscreen",
    docs: {
      description: { story: description },
      source: { code: source, language: "ts", type: "code" },
    },
    visualDelta: {
      images: [baselinePath],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  };
}

export async function expectPanelSource(
  parameters: {
    docs?: {
      canvas?: { className?: string };
      source?: { code?: string; language?: string; type?: string };
      story?: { height?: string; inline?: boolean };
    };
  },
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
) {
  await expect(parameters.docs?.canvas?.className).toBe(
    "panel-demo-docs-canvas",
  );
  await expect(parameters.docs?.story?.height).toBe("700px");
  await expect(parameters.docs?.story?.inline).toBe(false);
  await expect(parameters.docs?.source?.language).toBe("ts");
  await expect(parameters.docs?.source?.type).toBe("code");

  const source = parameters.docs?.source?.code ?? "";
  await expect(source).toContain(
    'import { WorkspaceShell } from "@lapis-notes/workspace";',
  );
  await expect(source).toContain("app.workspace.changeLayout(layout)");
  await expect(source).toContain(`"${panelLayoutMarker(kind, layout)}"`);
  if (kind === "tags") {
    await expect(source).toContain(
      'import Tags from "../lapis-editor-demo/tags/tags.svelte";',
    );
  } else {
    await expect(source).toContain('from "@lapis-notes/markdown";');
  }
  await expect(source).not.toContain("PanelDemo");
  await expect(source).not.toContain("args.");
}

export async function expectPanelPlacement(
  canvasElement: HTMLElement,
  kind: PanelDemoKind,
  layout: PanelDemoLayout,
  testId: string,
  args: Record<string, unknown>,
) {
  await expect(args).not.toHaveProperty("kind");
  await expect(args).not.toHaveProperty("layout");

  const canvas = within(canvasElement);
  const requiresFile = PANEL_LEAF_META[kind].requiresFile;
  await waitFor(
    () => {
      expect(canvas.getByTestId("panel-demo-status")).toHaveTextContent(
        "ready",
      );
      expect(canvas.getAllByTestId(testId)).toHaveLength(1);
      const markdown =
        canvasElement.querySelector(".markdown-view") ||
        canvasElement.querySelector(
          '[data-ui-component="markdown-mira-preview"]',
        ) ||
        canvasElement.querySelector(".markdown-view__editor");
      if (requiresFile) expect(markdown).not.toBeNull();
      else expect(markdown).toBeNull();
    },
    { timeout: 12_000 },
  );

  const panel = canvas.getByTestId(testId);
  const expectedHost = {
    "middle-top-tabs": "workspace-tabs",
    "stacked-tabs": "workspace-stacked-tabs",
    "left-sidebar": "workspace-sidebar",
    "right-sidebar": "workspace-sidebar",
    "bottom-panel": "workspace-bottom-panel-group",
    "sidebar-group": "workspace-sidebar-group",
  }[layout];
  const host = panel.closest(
    `[data-ui-component="${expectedHost}"]`,
  ) as HTMLElement | null;
  await expect(host).not.toBeNull();

  const expectedSurface = {
    "middle-top-tabs": "body",
    "stacked-tabs": "body",
    "left-sidebar": "left-sidebar",
    "right-sidebar": "right-sidebar",
    "bottom-panel": "bottom-panel",
    "sidebar-group": "right-sidebar",
  }[layout];
  const surfaceHost = panel.closest(
    "[data-workspace-surface]",
  ) as HTMLElement | null;
  if (!surfaceHost) throw new Error(`Missing workspace surface for ${layout}`);
  await expect(surfaceHost).toHaveAttribute(
    "data-workspace-surface",
    expectedSurface,
  );

  const viewHost = panel.closest(
    '[data-ui-component="workspace-view-host"]',
  ) as HTMLElement | null;
  if (!viewHost) throw new Error(`Missing WorkspaceViewHost for ${layout}`);
  const storyWindow = canvasElement.ownerDocument.defaultView;
  if (!storyWindow) throw new Error("Missing Storybook preview window");
  const directSidebar =
    layout === "left-sidebar" || layout === "right-sidebar";
  const paintHost = directSidebar
    ? surfaceHost
    : (canvasElement.querySelector(
        '[data-workspace-surface="body"]',
      ) as HTMLElement | null);
  if (!paintHost) throw new Error(`Missing expected paint host for ${layout}`);
  const viewBackground = storyWindow.getComputedStyle(viewHost).backgroundColor;
  await expect(viewBackground).toBe(
    storyWindow.getComputedStyle(paintHost).backgroundColor,
  );
  await expect(storyWindow.getComputedStyle(panel).backgroundColor).toBe(
    viewBackground,
  );
  const stickyChrome = panel.querySelector<HTMLElement>(
    '[data-ui-part="chrome"]',
  );
  if (stickyChrome) {
    await expect(
      storyWindow.getComputedStyle(stickyChrome).backgroundColor,
    ).toBe(viewBackground);
  }

  if (directSidebar) {
    await expect(host).toHaveAttribute(
      "data-workspace-sidebar-side",
      layout === "left-sidebar" ? "left" : "right",
    );
  }
  if (layout === "bottom-panel" || layout === "sidebar-group") {
    await expect(
      within(host as HTMLElement).getByRole("button", {
        name: `Collapse ${PANEL_LEAF_META[kind].title}`,
      }),
    ).toBeVisible();
  }

  return within(panel);
}

export async function expectPanelAlignment(
  canvasElement: HTMLElement,
  testId: string,
) {
  const panelElement = canvasElement.querySelector<HTMLElement>(
    `[data-testid="${testId}"]`,
  );
  if (!panelElement) throw new Error(`Missing ${testId}`);
  const viewHost = panelElement.closest<HTMLElement>(
    '[data-ui-component="workspace-view-host"], .ui-workspace-imperative-view',
  );
  if (!viewHost) throw new Error(`Missing WorkspaceViewHost for ${testId}`);

  await expect(
    Math.abs(
      panelElement.getBoundingClientRect().width -
        viewHost.getBoundingClientRect().width,
    ),
  ).toBeLessThan(1);
  await expect(
    panelElement.querySelector('[data-ui-part="group-label"]'),
  ).toBeNull();
  await expect(panelElement.querySelector('[data-ui-part="meta"]')).toBeNull();
  await expect(getComputedStyle(panelElement).fontFamily).toBe(
    getComputedStyle(viewHost).fontFamily,
  );

  const panelContent = panelElement.querySelector<HTMLElement>(
    '[data-ui-part="content"]',
  );
  if (!panelContent) throw new Error(`Missing panel content for ${testId}`);
  const panelContentStyle = getComputedStyle(panelContent);
  const availableContentWidth =
    panelContent.getBoundingClientRect().width -
    Number.parseFloat(panelContentStyle.paddingLeft) -
    Number.parseFloat(panelContentStyle.paddingRight);

  return { panelElement, viewHost, panelContent, availableContentWidth };
}

export async function expectLinkPanelAlignment(
  canvasElement: HTMLElement,
  testId: string,
) {
  const alignment = await expectPanelAlignment(canvasElement, testId);
  const content = alignment.panelElement.querySelector<HTMLElement>(
    ".markdown-link-sidebar__content",
  );
  if (!content) throw new Error(`Missing link panel content for ${testId}`);
  await expect(
    Math.abs(
      content.getBoundingClientRect().width - alignment.availableContentWidth,
    ),
  ).toBeLessThan(1);

  const rows = Array.from(
    alignment.panelElement.querySelectorAll<HTMLElement>(
      ".markdown-link-sidebar__group-button, .markdown-link-sidebar__mention",
    ),
  );
  const counts = Array.from(
    alignment.panelElement.querySelectorAll<HTMLElement>(
      ".markdown-link-sidebar__count",
    ),
  );
  await expect(rows.length).toBeGreaterThan(1);
  await expect(counts.length).toBeGreaterThan(1);
  await expect(
    rows.every((row) => getComputedStyle(row).fontSize === "12px"),
  ).toBe(true);
  await expect(
    Math.max(...counts.map((count) => count.getBoundingClientRect().right)) -
      Math.min(...counts.map((count) => count.getBoundingClientRect().right)),
  ).toBeLessThan(1);

  return alignment;
}

export async function expectMarkdownDocumentScroll(
  canvasElement: HTMLElement,
) {
  const viewHost = canvasElement.querySelector<HTMLElement>(
    '[data-ui-component="workspace-view-host"][data-workspace-view-type="markdown"]',
  );
  if (!viewHost) throw new Error("Missing Markdown WorkspaceViewHost");

  const scrollRoot = viewHost.querySelector<HTMLElement>(
    ".cm-editor-scroll-area",
  );
  const viewport = scrollRoot?.querySelector<HTMLElement>(
    '[data-ui-component="scroll-area"][data-ui-part="scroll-area-viewport"]',
  );
  if (!scrollRoot || !viewport) {
    throw new Error("Missing Markdown editor ScrollArea");
  }
  const markdownView = viewHost.querySelector<HTMLElement>(".markdown-view");
  const codeMirrorScroller = viewHost.querySelector<HTMLElement>(
    ".cm-editor-content > .cm-editor > .cm-scroller",
  );
  if (!markdownView || !codeMirrorScroller) {
    throw new Error("Missing full-height Markdown editor surface");
  }

  const app = panelDemoApp(canvasElement);
  let documentEditor: {
    getValue(): string;
    setValue(value: string): void;
  } | null = null;
  app.workspace.iterateRootLeaves((leaf) => {
    const view = leaf.view as {
      file?: { path?: string };
      editor?: typeof documentEditor;
    };
    if (!documentEditor && view.file?.path === "Notes/Welcome.md") {
      documentEditor = view.editor ?? null;
    }
  });
  if (!documentEditor) throw new Error("Missing seeded Welcome editor");

  const originalContents = documentEditor.getValue();
  const overflowFixture = Array.from(
    { length: 80 },
    (_, index) => `Scroll regression line ${index + 1}.`,
  ).join("\n\n");
  const storyHost = canvasElement.querySelector<HTMLElement>(
    '[data-testid="panel-demo"]',
  );
  if (!storyHost) throw new Error("Missing panel demo story host");
  const initialStoryHeight = storyHost.style.height;
  const initialScrollTop = viewport.scrollTop;

  try {
    storyHost.style.height = "36rem";
    documentEditor.setValue(`${originalContents}\n\n${overflowFixture}\n`);
    await waitFor(() => {
      const viewHostHeight = viewHost.getBoundingClientRect().height;
      for (const surface of [markdownView, scrollRoot]) {
        expect(
          Math.abs(surface.getBoundingClientRect().height - viewHostHeight),
        ).toBeLessThan(1);
      }
      expect(["auto", "scroll"]).toContain(
        getComputedStyle(viewport).overflowY,
      );
      expect(getComputedStyle(codeMirrorScroller).overflowX).toBe("clip");
      expect(getComputedStyle(codeMirrorScroller).overflowY).toBe("visible");
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    });

    const maximumScrollTop = viewport.scrollHeight - viewport.clientHeight;
    const targetScrollTop = Math.min(initialScrollTop + 120, maximumScrollTop);
    viewport.scrollTop = targetScrollTop;
    await waitFor(() => {
      expect(viewport.scrollTop).toBe(targetScrollTop);
    });
  } finally {
    viewport.scrollTop = initialScrollTop;
    documentEditor.setValue(originalContents);
    storyHost.style.height = initialStoryHeight;
  }
}

export function expectLinkPreviewPlacement(
  trigger: HTMLElement,
  preview: HTMLElement,
  requireEditorOverlap = true,
) {
  const previewRect = preview.getBoundingClientRect();
  const ownerDocument = trigger.ownerDocument;
  const viewportWidth = preview.ownerDocument.documentElement.clientWidth;
  const viewportHeight = preview.ownerDocument.documentElement.clientHeight;

  expect(preview.ownerDocument).toBe(ownerDocument);
  expect(ownerDocument.body.contains(preview)).toBe(true);
  expect(preview.closest('[data-testid="panel-demo"]')).toBeNull();
  expect(previewRect.left).toBeGreaterThanOrEqual(0);
  expect(previewRect.top).toBeGreaterThanOrEqual(0);
  expect(previewRect.right).toBeLessThanOrEqual(viewportWidth + 1);
  expect(previewRect.bottom).toBeLessThanOrEqual(viewportHeight + 1);
  expect(["top", "right", "bottom", "left"]).toContain(
    preview.getAttribute("data-side"),
  );

  if (!requireEditorOverlap) return;

  const editor = ownerDocument.querySelector<HTMLElement>(
    '.markdown-view, [data-ui-component="markdown-mira-preview"], .markdown-view__editor',
  );
  const editorHost = editor?.closest<HTMLElement>(
    '[data-ui-component="workspace-view-host"]',
  );
  if (!editorHost) throw new Error("Missing adjacent Markdown editor host");
  const editorRect = editorHost.getBoundingClientRect();
  const overlapLeft = Math.max(previewRect.left, editorRect.left);
  const overlapRight = Math.min(previewRect.right, editorRect.right);
  const overlapTop = Math.max(previewRect.top, editorRect.top);
  const overlapBottom = Math.min(previewRect.bottom, editorRect.bottom);
  expect(overlapRight - overlapLeft).toBeGreaterThan(8);
  expect(overlapBottom - overlapTop).toBeGreaterThan(8);

  const hit = ownerDocument.elementFromPoint(
    overlapLeft + (overlapRight - overlapLeft) / 2,
    overlapTop + (overlapBottom - overlapTop) / 2,
  );
  expect(
    hit?.closest(
      '[data-ui-component="hover-card"][data-ui-part="hover-card-content"]',
    ),
  ).toBe(preview);
}

export async function expectLinkPreviewHoverHandoff(
  trigger: HTMLElement,
  preview: HTMLElement,
) {
  trigger.blur();
  await userEvent.unhover(trigger);
  await new Promise((resolve) => setTimeout(resolve, 180));
  expect(preview).toBeVisible();

  await userEvent.hover(preview);
  await new Promise((resolve) => setTimeout(resolve, 340));
  expect(preview).toBeVisible();
}
