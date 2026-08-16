import type { App } from "@lapis-notes/api";
import { HistoryPlugin, HistoryPanel } from "@lapis-notes/history";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  expectPanelPlacement,
  panelDemoApp,
} from "../_shared/panels/panel-story-helpers";
import {
  compareCurrentSource,
  comparePreviousSource,
  compareSelectedSource,
  restoreSource,
} from "./Compare.example-sources";
import "../_shared/panels/Panel.docs.css";

const meta = {
  title: "Plugins/History/Compare",
  component: HistoryPanel,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description: "Initialized Lapis App supplied by the History view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      canvas: { className: "panel-demo-docs-canvas" },
      story: WORKSPACE_SHELL_DOCS_STORY,
      description: {
        component:
          "History compare reuses one main-area tab: FileDiff for stored pairs and one-way MergeEditor against the live file.",
      },
    },
  },
} satisfies Meta<typeof HistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function compareParameters(source: string, description: string, baseline: string) {
  return {
    ...workspaceCatalogParameters(`plugin-history-compare-${baseline}`),
    layout: "fullscreen",
    docs: {
      canvas: { className: "panel-demo-docs-canvas" },
      story: WORKSPACE_SHELL_DOCS_STORY,
      description: { story: description },
      source: { code: source, language: "ts", type: "code" },
    },
    visualDelta: {
      images: [
        `/visual-baselines/stories/plugins/history/compare/${baseline}-chromium.png`,
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  };
}

async function readyHistory(
  canvasElement: HTMLElement,
  args: Record<string, unknown>,
) {
  await expectPanelPlacement(
    canvasElement,
    "history",
    "right-sidebar",
    "history-panel",
    args,
  );
  const app = panelDemoApp(canvasElement);
  const plugin = app.plugins.plugins.get("history");
  if (!(plugin instanceof HistoryPlugin)) {
    throw new Error("History plugin is not registered");
  }
  const model = await plugin.getHistoryViewModel();
  const revisions = model.history?.revisions ?? [];
  if (!model.filePath || revisions.length < 2) {
    throw new Error("Expected seeded History revisions");
  }
  return { app, plugin, model, revisions };
}

const renderHistoryCompare: NonNullable<Story["render"]> = (() => ({
  Component: PanelDemo,
  props: { kind: "history", layout: "right-sidebar" },
})) as NonNullable<Story["render"]>;

async function waitForCompare(
  canvasElement: HTMLElement,
  mode?: "current" | "previous" | "selected",
) {
  await waitFor(
    () => {
      const compare = canvasElement.querySelector(
        '[data-testid="history-compare-panel"]',
      );
      expect(compare).not.toBeNull();
      if (mode) expect(compare).toHaveAttribute("data-compare-mode", mode);
    },
    { timeout: 12_000 },
  );
  return canvasElement.querySelector(
    '[data-testid="history-compare-panel"]',
  ) as HTMLElement;
}

function compareViewHeader(compare: HTMLElement): HTMLElement {
  const leaf = compare.closest('[data-ui-part="leaf-content"]');
  const header = leaf?.querySelector(
    '[data-ui-component="workspace-view-header"]',
  );
  if (!(header instanceof HTMLElement)) {
    throw new Error("Expected the history-compare view header");
  }
  return header;
}

async function expectCompareBreadcrumbs(
  canvasElement: HTMLElement,
  compare: HTMLElement,
  app: App,
) {
  const header = compareViewHeader(compare);
  const breadcrumbs = header.querySelector('[data-ui-part="breadcrumbs"]');
  expect(breadcrumbs).not.toBeNull();
  const trail = within(breadcrumbs as HTMLElement);
  const historyCrumb = trail.getByRole("button", { name: "History" });
  expect(historyCrumb).toBeVisible();
  expect(trail.getByRole("button", { name: "Notes" })).toBeVisible();
  const title = header.querySelector('[data-ui-part="title"]');
  expect(title).toHaveTextContent("Welcome.md");
  expect(title?.tagName.toLowerCase()).toBe("span");

  expect(app.workspace.getLeavesOfType("history")).toHaveLength(1);
  await userEvent.click(historyCrumb);
  await waitFor(() => {
    expect(app.workspace.getLeavesOfType("history")).toHaveLength(1);
    expect(
      canvasElement.querySelector('[data-testid="history-panel"]'),
    ).not.toBeNull();
  });

  app.workspace.getLeavesOfType("history")[0]!.detach();
  await waitFor(() => {
    expect(app.workspace.getLeavesOfType("history")).toHaveLength(0);
  });
  await userEvent.click(trail.getByRole("button", { name: "History" }));
  await waitFor(() => {
    expect(app.workspace.getLeavesOfType("history")).toHaveLength(1);
    expect(
      canvasElement.querySelector('[data-testid="history-panel"]'),
    ).not.toBeNull();
  });
}

function expectFlushedCompare(compare: HTMLElement) {
  const chrome = compare.querySelector('[data-ui-part="chrome"]');
  expect(chrome).not.toBeNull();
  expect(
    Number.parseFloat(getComputedStyle(chrome as HTMLElement).borderBottomWidth),
  ).toBeGreaterThan(0);
  const surface =
    compare.querySelector('[data-ui-component="merge-editor"]') ??
    compare.querySelector('[data-ui-component="file-diff"]');
  expect(surface).not.toBeNull();
  const style = getComputedStyle(surface as HTMLElement);
  expect(style.borderTopWidth).toBe("0px");
  expect(style.borderRightWidth).toBe("0px");
  expect(style.borderLeftWidth).toBe("0px");
  expect(style.borderRadius).toBe("0px");
  const revision = compare.querySelector<HTMLElement>(
    ".history-compare__revision",
  );
  const stats = revision?.querySelector<HTMLElement>(
    '[data-ui-component="file-change-stats"]',
  );
  expect(revision).not.toBeNull();
  expect(stats).not.toBeNull();
  expect(getComputedStyle(revision!).justifyContent).toBe("space-between");
  expect(stats!.getBoundingClientRect().left).toBeGreaterThan(
    revision!.getBoundingClientRect().left +
      revision!.getBoundingClientRect().width / 2,
  );
}

function paneViewport(compare: HTMLElement, side: "left" | "right") {
  return compare.querySelector<HTMLElement>(
    `[data-ui-part="file-diff-pane"][data-side="${side}"] [data-ui-part="scroll-area-viewport"]`,
  );
}

function expectFilledScrollArea(compare: HTMLElement) {
  const surface =
    compare.querySelector<HTMLElement>('[data-ui-component="merge-editor"]') ??
    compare.querySelector<HTMLElement>('[data-ui-component="file-diff"]');
  expect(surface).not.toBeNull();
  const areas = surface!.querySelectorAll(
    '[data-ui-component="scroll-area"][data-ui-part="scroll-area"]',
  );
  expect(areas.length).toBeGreaterThan(0);
  const compareBox = compare.getBoundingClientRect();
  const surfaceBox = surface!.getBoundingClientRect();
  expect(Math.abs(surfaceBox.bottom - compareBox.bottom)).toBeLessThan(2);
  const footer = surface!.querySelector<HTMLElement>(
    ".ui-diff-merge-editor__footer",
  );
  const bars = [
    ...surface!.querySelectorAll<HTMLElement>(
      '[data-ui-part="scroll-area-scrollbar"][data-orientation="horizontal"]',
    ),
  ];
  const limit = footer?.getBoundingClientRect().top ?? surfaceBox.bottom;
  for (const bar of bars) {
    const box = bar.getBoundingClientRect();
    expect(box.bottom).toBeLessThanOrEqual(limit + 2);
    expect(box.bottom).toBeGreaterThan(limit - 16);
  }
  const hosts = [
    ...surface!.querySelectorAll<HTMLElement>(
      '[data-ui-part="file-diff-pane"], [data-ui-part="merge-view"]',
    ),
  ];
  for (const host of hosts) {
    const viewport = host.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    );
    const fill = host.querySelector<HTMLElement>(
      ".ui-diff-file-diff__pane-stack, .ui-diff-merge-editor__gutter",
    );
    expect(viewport).not.toBeNull();
    expect(fill).not.toBeNull();
    expect(fill!.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(
      viewport!.getBoundingClientRect().bottom - 16,
    );
  }
}

async function expectUnwrappedSplit(compare: HTMLElement) {
  const viewModeButton = compare.querySelector<HTMLElement>(
    '[data-testid="history-compare-view-mode"]',
  );
  expect(viewModeButton).not.toBeNull();
  expect(
    compare.querySelectorAll('[data-testid="history-compare-view-mode"]'),
  ).toHaveLength(1);
  expect(viewModeButton).toHaveAttribute("data-view-mode", "unified");
  expect(viewModeButton).toHaveAttribute("aria-label", "Unified diff");
  await userEvent.click(viewModeButton!);
  await waitFor(() => {
    expect(viewModeButton).toHaveAttribute("data-view-mode", "split");
    expect(viewModeButton).toHaveAttribute("aria-label", "Split diff");
    const left = paneViewport(compare, "left");
    const right = paneViewport(compare, "right");
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(left!.getBoundingClientRect().right).toBeLessThanOrEqual(
      right!.getBoundingClientRect().left + 1,
    );
    expect(left!.scrollWidth).toBeGreaterThan(left!.clientWidth);
  });
  const left = paneViewport(compare, "left")!;
  const right = paneViewport(compare, "right")!;
  left.scrollLeft = 48;
  left.dispatchEvent(new Event("scroll"));
  expect(right.scrollLeft).toBe(48);
  const surface = compare.querySelector<HTMLElement>(
    '[data-ui-component="file-diff"]',
  );
  expect(surface).not.toBeNull();
  for (const host of surface!.querySelectorAll<HTMLElement>(
    '[data-ui-part="file-diff-pane"]',
  )) {
    const viewport = host.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    );
    const stack = host.querySelector<HTMLElement>(
      ".ui-diff-file-diff__pane-stack",
    );
    expect(viewport).not.toBeNull();
    expect(stack).not.toBeNull();
    expect(stack!.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(
      viewport!.getBoundingClientRect().bottom - 16,
    );
  }
}

async function expectWrapToggle(compare: HTMLElement) {
  const wrapButton = compare.querySelector(
    '[data-testid="history-compare-wrap"]',
  );
  expect(wrapButton).not.toBeNull();
  expect(wrapButton).toHaveAttribute("aria-pressed", "false");
  expect(compare).toHaveAttribute("data-wrap", "false");
  await userEvent.click(wrapButton!);
  await waitFor(() => {
    expect(wrapButton).toHaveAttribute("aria-pressed", "true");
    expect(compare).toHaveAttribute("data-wrap", "true");
    const pressed = getComputedStyle(wrapButton as HTMLElement);
    expect(pressed.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(pressed.backgroundColor).not.toBe("transparent");
    const surface =
      compare.querySelector('[data-ui-component="merge-editor"]') ??
      compare.querySelector('[data-ui-component="file-diff"]');
    expect(surface).toHaveAttribute("data-wrap", "true");
    const probe = [
      ...compare.querySelectorAll(
        ".ui-diff-merge-editor__line, .ui-diff-file-diff__text",
      ),
    ].find((node) =>
      (node.textContent ?? "").includes("History compare wrap probe"),
    );
    expect(probe).toBeDefined();
    expect(getComputedStyle(probe as HTMLElement).whiteSpace).toBe("pre-wrap");
    expect((probe as HTMLElement).clientHeight).toBeGreaterThan(20);
    expect((probe as HTMLElement).scrollWidth).toBeLessThanOrEqual(
      (probe as HTMLElement).clientWidth + 1,
    );
  });
}

export const CompareCurrent: Story = {
  name: "Compare current",
  parameters: compareParameters(
    compareCurrentSource,
    "One-way MergeEditor compares the selected revision on the left with the live file on the right.",
    "current",
  ),
  render: renderHistoryCompare,
  play: async ({ args, canvasElement }) => {
    const { app, plugin, model, revisions } = await readyHistory(
      canvasElement,
      args,
    );
    await plugin.openHistoryCompareView({
      filePath: model.filePath!,
      revisionId: revisions[0]!.revisionId,
      compareMode: "current",
    });
    const compare = await waitForCompare(canvasElement, "current");
    await waitFor(() => {
      expect(
        canvasElement.querySelector('[data-ui-component="merge-editor"]'),
      ).not.toBeNull();
      expect(canvasElement.querySelectorAll('[data-testid="history-panel"]')).toHaveLength(
        1,
      );
    });
    expectFlushedCompare(compare);
    expectFilledScrollArea(compare);
    await expectWrapToggle(compare);
    await expectCompareBreadcrumbs(canvasElement, compare, app);
    expect(app.workspace.getLeavesOfType("history")).toHaveLength(1);
    expect(app.workspace.getLeavesOfType("history-compare")).toHaveLength(1);
  },
};

export const ComparePrevious: Story = {
  name: "Compare previous",
  parameters: compareParameters(
    comparePreviousSource,
    "FileDiff shows the selected revision against the previous stored snapshot.",
    "previous",
  ),
  render: renderHistoryCompare,
  play: async ({ args, canvasElement }) => {
    const { app, plugin, model, revisions } = await readyHistory(
      canvasElement,
      args,
    );
    await plugin.openHistoryCompareView({
      filePath: model.filePath!,
      revisionId: revisions[0]!.revisionId,
      compareMode: "previous",
    });
    const compare = await waitForCompare(canvasElement, "previous");
    expect(
      canvasElement.querySelector('[data-ui-component="file-diff"]'),
    ).not.toBeNull();
    expectFlushedCompare(compare);
    expectFilledScrollArea(compare);
    await expectUnwrappedSplit(compare);
    await expectWrapToggle(compare);
    expect(app.workspace.getLeavesOfType("history")).toHaveLength(1);
  },
};

export const CompareSelected: Story = {
  name: "Compare selected",
  parameters: compareParameters(
    compareSelectedSource,
    "FileDiff compares two anchored timeline revisions without replacing the History leaf.",
    "selected",
  ),
  render: renderHistoryCompare,
  play: async ({ args, canvasElement }) => {
    const { app, plugin, model, revisions } = await readyHistory(
      canvasElement,
      args,
    );
    plugin.toggleCompareAnchor(model.filePath!, revisions[1]!.revisionId);
    await plugin.openHistoryCompareView({
      filePath: model.filePath!,
      revisionId: revisions[0]!.revisionId,
      compareMode: "selected",
      otherRevisionId: revisions[1]!.revisionId,
    });
    await waitForCompare(canvasElement, "selected");
    expect(
      canvasElement.querySelector('[data-ui-component="file-diff"]'),
    ).not.toBeNull();
    expect(canvasElement.querySelectorAll('[data-testid="history-panel"]')).toHaveLength(
      1,
    );
    expect(app.workspace.getLeavesOfType("history")).toHaveLength(1);
  },
};

export const RestoreRevision: Story = {
  name: "Restore revision",
  parameters: compareParameters(
    restoreSource,
    "Restore writes through the vault API, records a restore revision, and keeps the History leaf mounted.",
    "restore",
  ),
  render: renderHistoryCompare,
  play: async ({ args, canvasElement }) => {
    const { app, plugin, model, revisions } = await readyHistory(
      canvasElement,
      args,
    );
    const older = revisions[revisions.length - 1]!;
    await plugin.openHistoryCompareView({
      filePath: model.filePath!,
      revisionId: older.revisionId,
      compareMode: "current",
    });
    await waitForCompare(canvasElement, "current");
    const restoreButton = canvasElement.querySelector(
      '[data-testid="history-compare-panel"] button[aria-label="Restore this revision"]',
    );
    expect(restoreButton).not.toBeNull();
    await userEvent.click(restoreButton!);
    await waitFor(async () => {
      const file = app.vault.getFileByPath(model.filePath!);
      expect(file).not.toBeNull();
      expect(await app.vault.cachedRead(file!)).toBe(older.content);
      const history = await plugin.getHistoryViewModel();
      expect(history.history?.revisions[0]?.eventType).toBe("restore");
      expect(app.workspace.getLeavesOfType("history")).toHaveLength(1);
    });
  },
};
