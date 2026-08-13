import type { App } from "@lapis-notes/api";
import { SearchPanel } from "@lapis-notes/search";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
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

function resolveTokenColor(element: HTMLElement, token: string): string {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;background:var(${token})`;
  element.append(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return color;
}

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
      const tree = panel.getByRole("tree", { name: "Search results" });
      const fileTreeItem = within(tree)
        .getAllByRole("treeitem")
        .find((item) => item.getAttribute("aria-level") === "1");
      expect(fileTreeItem).toBeDefined();
      await expect(fileTreeItem!).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(fileTreeItem!);
      await expect(fileTreeItem!).toHaveAttribute("aria-expanded", "true");
      expect(
        within(tree)
          .getAllByRole("treeitem")
          .some((item) => item.getAttribute("aria-level") === "2"),
      ).toBe(true);
      expect(within(tree).getAllByText("lexical").length).toBeGreaterThan(0);
      const resultRow = fileTreeItem!;
      const searchPanel = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"]',
      )!;
      const resultsBody = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"] .search-panel__tree-inset',
      )!;
      const resultLabel = resultRow.querySelector<HTMLElement>(
        ".search-panel__file-label",
      );
      const countBadge = resultRow.querySelector<HTMLElement>(
        ".search-panel__count-badge",
      );
      const modeBadge = resultRow.querySelector<HTMLElement>(
        ".search-panel__mode-badge",
      );
      expect(resultLabel).not.toBeNull();
      expect(countBadge).not.toBeNull();
      expect(modeBadge).not.toBeNull();
      const resultsRect = resultsBody.getBoundingClientRect();
      const resultRect = resultRow.getBoundingClientRect();
      const labelRect = resultLabel!.getBoundingClientRect();
      const countRect = countBadge!.getBoundingClientRect();
      const modeRect = modeBadge!.getBoundingClientRect();
      expect(resultRect.left - resultsRect.left).toBeGreaterThanOrEqual(5);
      expect(resultsRect.right - resultRect.right).toBeGreaterThanOrEqual(5);
      expect(Math.abs(countRect.width - countRect.height)).toBeLessThan(1);
      expect(countRect.top).toBeLessThan(labelRect.top + 2);
      expect(resultRect.right - countRect.right).toBeGreaterThanOrEqual(0);
      expect(getComputedStyle(countBadge!).backgroundColor).toBe(
        "rgba(0, 0, 0, 0)",
      );
      expect(getComputedStyle(countBadge!).borderTopWidth).toBe("0px");
      expect(getComputedStyle(countBadge!).fontFamily).toBe(
        getComputedStyle(searchPanel).fontFamily,
      );
      expect(getComputedStyle(countBadge!).color).not.toBe(
        getComputedStyle(searchPanel).color,
      );
      await userEvent.hover(resultRow);
      await waitFor(() =>
        expect(getComputedStyle(modeBadge!).backgroundColor).not.toBe(
          getComputedStyle(resultRow).backgroundColor,
        ),
      );
      await userEvent.unhover(resultRow);
      expect(Math.abs(modeRect.left - labelRect.left)).toBeLessThan(1);
      expect(modeRect.top).toBeGreaterThan(labelRect.top);
      const editor = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"] .cm-editor',
      );
      expect(editor).not.toBeNull();
      expect(
        editor?.querySelectorAll(".cm-content .cm-line > span").length,
      ).toBeGreaterThan(0);
      expect(
        canvasElement.querySelectorAll('[data-testid="search-panel"] mark')
          .length,
      ).toBeGreaterThan(0);
      expect(within(tree).getAllByText("content").length).toBeGreaterThan(0);
      const firstMatch = within(tree)
        .getAllByRole("treeitem")
        .find((item) => item.getAttribute("aria-level") === "2")!;
      const matchList = firstMatch.closest<HTMLElement>(
        ".search-panel__match-list",
      )!;
      const matchListBody = matchList.querySelector<HTMLElement>(
        '[data-ui-part="sidebar-menu-sub"]',
      )!;
      const matchText = firstMatch.querySelector<HTMLElement>(
        ".search-panel__match-text",
      )!;
      const matchKey = firstMatch.querySelector<HTMLElement>(
        ".search-panel__match-key",
      )!;
      const matchTextRect = matchText.getBoundingClientRect();
      const matchKeyRect = matchKey.getBoundingClientRect();
      const matchListRect = matchList.getBoundingClientRect();
      const firstMatchRect = firstMatch.getBoundingClientRect();
      expect(Math.abs(matchListRect.left - resultRect.left)).toBeLessThan(1);
      expect(Math.abs(matchListRect.right - resultRect.right)).toBeLessThan(1);
      expect(firstMatchRect.left - matchListRect.left).toBeLessThan(2);
      expect(matchListRect.right - firstMatchRect.right).toBeLessThan(2);
      expect(getComputedStyle(matchList).borderTopWidth).not.toBe("0px");
      const primarySurface = resolveTokenColor(
        searchPanel,
        "--ui-workspace-view-background",
      );
      const secondarySurface = resolveTokenColor(
        searchPanel,
        "--ui-workspace-view-secondary-background",
      );
      expect(getComputedStyle(searchPanel).backgroundColor).toBe(
        primarySurface,
      );
      expect(getComputedStyle(matchList).backgroundColor).toBe(
        secondarySurface,
      );
      expect(getComputedStyle(matchListBody).backgroundColor).toBe(
        secondarySurface,
      );
      expect(secondarySurface).not.toBe(primarySurface);
      expect(getComputedStyle(modeBadge!).backgroundColor).toBe(
        secondarySurface,
      );
      expect(getComputedStyle(matchKey).backgroundColor).toBe(primarySurface);
      expect(Math.abs(matchKeyRect.left - matchTextRect.left)).toBeLessThan(1);
      expect(matchKeyRect.top).toBeGreaterThanOrEqual(matchTextRect.bottom);
      await userEvent.hover(firstMatch);
      await waitFor(() =>
        expect(getComputedStyle(matchKey).backgroundColor).not.toBe(
          getComputedStyle(firstMatch).backgroundColor,
        ),
      );
      await userEvent.unhover(firstMatch);

      const contentMatch = within(tree)
        .getAllByRole("treeitem")
        .find(
          (item) =>
            item.getAttribute("aria-level") === "2" &&
            item
              .querySelector(".search-panel__match-key")
              ?.textContent?.trim() === "content",
        )!;
      expect(contentMatch).toBeDefined();
      const contentShell = contentMatch.closest<HTMLElement>(
        ".search-panel__match-shell",
      )!;
      const contextBefore = within(contentShell).getByRole("button", {
        name: "Show more context before this match",
      });
      const contextAfter = within(contentShell).getByRole("button", {
        name: "Show more context after this match",
      });
      const contentShellRect = contentShell.getBoundingClientRect();
      const beforeRect = contextBefore.getBoundingClientRect();
      const afterRect = contextAfter.getBoundingClientRect();
      expect(contentShellRect.right - beforeRect.right).toBeGreaterThanOrEqual(
        0,
      );
      expect(beforeRect.top - contentShellRect.top).toBeGreaterThanOrEqual(0);
      expect(contentShellRect.right - afterRect.right).toBeGreaterThanOrEqual(
        0,
      );
      expect(contentShellRect.bottom - afterRect.bottom).toBeGreaterThanOrEqual(
        0,
      );

      const initialContextText = contentMatch.textContent?.length ?? 0;
      const initialContextHeight = contentShell.getBoundingClientRect().height;
      await userEvent.click(contextBefore);
      await waitFor(() => {
        expect(contentMatch.textContent?.length ?? 0).toBeGreaterThan(
          initialContextText,
        );
        expect(contentShell.getBoundingClientRect().height).toBeGreaterThan(
          initialContextHeight,
        );
      });
      const beforeExpandedText = contentMatch.textContent ?? "";
      const beforeExpandedHeight = contentShell.getBoundingClientRect().height;
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      const stableBeforeMatch = within(tree)
        .getAllByRole("treeitem")
        .find(
          (item) =>
            item.getAttribute("aria-level") === "2" &&
            item
              .querySelector(".search-panel__match-key")
              ?.textContent?.trim() === "content",
        )!;
      expect(stableBeforeMatch.textContent).toBe(beforeExpandedText);
      expect(
        stableBeforeMatch
          .closest<HTMLElement>(".search-panel__match-shell")!
          .getBoundingClientRect().height,
      ).toBe(beforeExpandedHeight);
      await expect(fileTreeItem!).toHaveAttribute("aria-expanded", "true");
      const beforeExpandedLength = stableBeforeMatch.textContent?.length ?? 0;
      await userEvent.click(
        within(stableBeforeMatch).getByRole("button", {
          name: "Show more context after this match",
        }),
      );
      await waitFor(() => {
        const expandedMatch = within(tree)
          .getAllByRole("treeitem")
          .find(
            (item) =>
              item.getAttribute("aria-level") === "2" &&
              item
                .querySelector(".search-panel__match-key")
                ?.textContent?.trim() === "content",
          )!;
        expect(expandedMatch.textContent?.length ?? 0).toBeGreaterThan(
          beforeExpandedLength,
        );
      });
      const afterExpandedMatch = within(tree)
        .getAllByRole("treeitem")
        .find(
          (item) =>
            item.getAttribute("aria-level") === "2" &&
            item
              .querySelector(".search-panel__match-key")
              ?.textContent?.trim() === "content",
        )!;
      const afterExpandedText = afterExpandedMatch.textContent ?? "";
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      const stableAfterMatch = within(tree)
        .getAllByRole("treeitem")
        .find(
          (item) =>
            item.getAttribute("aria-level") === "2" &&
            item
              .querySelector(".search-panel__match-key")
              ?.textContent?.trim() === "content",
        )!;
      expect(stableAfterMatch.textContent).toBe(afterExpandedText);
      await expect(fileTreeItem!).toHaveAttribute("aria-expanded", "true");
      const highlightedMatch = stableAfterMatch.querySelector<HTMLElement>("mark")!;
      expect(highlightedMatch).not.toBeNull();
      searchPanel.style.setProperty(
        "--ui-search-highlight-background",
        "rgb(255 217 102)",
      );
      searchPanel.style.setProperty(
        "--ui-search-highlight-foreground",
        "rgb(62 48 0)",
      );
      await waitFor(() => {
        expect(getComputedStyle(highlightedMatch).backgroundColor).toBe(
          "rgb(255, 217, 102)",
        );
        expect(getComputedStyle(highlightedMatch).color).toBe("rgb(62, 48, 0)");
      });
      searchPanel.style.removeProperty("--ui-search-highlight-background");
      searchPanel.style.removeProperty("--ui-search-highlight-foreground");

      const resultCopyButton = panel.getByRole("button", {
        name: "Copy search results",
      });
      const sortButton = panel.getByRole("button", {
        name: /Filename \(A to Z\)/,
      });
      await expect(resultCopyButton).toHaveClass(
        "search-panel__summary-control",
      );
      await expect(sortButton).toHaveClass("search-panel__summary-control");
      const restingSortBackground =
        getComputedStyle(sortButton).backgroundColor;
      await userEvent.click(sortButton);
      await expect(sortButton).toHaveAttribute("aria-expanded", "true");
      await waitFor(() =>
        expect(getComputedStyle(sortButton).backgroundColor).not.toBe(
          restingSortBackground,
        ),
      );
      await userEvent.keyboard("{Escape}");
      expect(
        canvasElement.querySelector(".search-panel__semantic-status"),
      ).toBeNull();

      await userEvent.click(
        panel.getByRole("button", { name: "Expand filter options" }),
      );
      const fileTypePicker = panel.getByRole("button", {
        name: "Filter by file type",
      });
      await expect(fileTypePicker).toBeVisible();
      await userEvent.click(fileTypePicker);
      await userEvent.click(
        within(canvasElement.ownerDocument.body).getByRole("option", {
          name: "Markdown",
        }),
      );
      await expect(fileTypePicker).toHaveTextContent("Markdown");
      await expect(fileTypePicker).toHaveAttribute("data-active", "true");
      await expect(panel.getByText("Vault search syntax")).toBeVisible();

      if (layout === "middle-top-tabs") {
        const writeText = fn(async () => undefined);
        Object.defineProperty(navigator.clipboard, "writeText", {
          configurable: true,
          value: writeText,
        });
        const settings = panel.getByRole("region", {
          name: "Search view settings",
        });
        const collapseResults = within(settings).getByRole("switch", {
          name: "Collapse results",
        });
        await userEvent.click(collapseResults);
        await expect(collapseResults).toHaveAttribute(
          "data-state",
          "unchecked",
        );
        await expect(fileTreeItem!).toHaveAttribute("aria-expanded", "true");
        await userEvent.click(fileTreeItem!);
        await expect(fileTreeItem!).toHaveAttribute("aria-expanded", "false");
        const explainTerms = within(settings).getByRole("switch", {
          name: "Explain search terms",
        });
        const matchCase = within(settings).getByRole("switch", {
          name: "Match case",
        });
        const showMoreContext = within(settings).getByRole("switch", {
          name: "Show more context",
        });
        const semanticStructured = within(settings).getByRole("switch", {
          name: /^Semantic search in structured queries/,
        });
        await userEvent.click(matchCase);
        await userEvent.click(showMoreContext);
        await userEvent.click(semanticStructured);
        await expect(matchCase).toHaveAttribute("data-state", "checked");
        await expect(showMoreContext).toHaveAttribute("data-state", "checked");
        await expect(semanticStructured).toHaveAttribute(
          "data-state",
          "checked",
        );
        await expect(fileTreeItem!).toHaveAttribute("aria-expanded", "false");
        await userEvent.click(explainTerms);
        await expect(panel.getByText(/Matching filenames/)).toBeVisible();
        const retrievalPicker = panel.getByRole("button", {
          name: "Filter by retrieval mode",
        });
        await userEvent.click(retrievalPicker);
        await userEvent.click(
          within(canvasElement.ownerDocument.body).getByRole("option", {
            name: "Lexical",
          }),
        );
        await expect(retrievalPicker).toHaveTextContent("Lexical");
        await expect(retrievalPicker).toHaveAttribute("data-active", "true");

        await userEvent.click(
          panel.getByRole("button", { name: /Filename \(A to Z\)/ }),
        );
        await userEvent.click(
          within(document.body).getByRole("button", {
            name: "Modified (new to old)",
          }),
        );
        await expect(
          panel.getByRole("button", { name: /Modified \(new to old\)/ }),
        ).toBeVisible();

        await userEvent.click(
          panel.getByRole("button", { name: "Copy search results" }),
        );
        await expect(writeText).toHaveBeenCalledWith(
          expect.stringContaining("Notes/Welcome.md"),
        );
        await userEvent.click(
          panel.getByRole("button", { name: "Clear search" }),
        );
        await expect(
          panel.getByRole("heading", { name: "Recent searches" }),
        ).toBeVisible();
        await userEvent.click(panel.getByRole("button", { name: "Welcome" }));
        await waitFor(() =>
          expect(panel.getByText("Notes/Welcome.md")).toBeVisible(),
        );
        const currentTree = panel.getByRole("tree", { name: "Search results" });
        const currentFileTreeItem = within(currentTree)
          .getAllByRole("treeitem")
          .find((item) => item.getAttribute("aria-level") === "1")!;
        if (currentFileTreeItem.getAttribute("aria-expanded") !== "true") {
          await userEvent.click(currentFileTreeItem);
        }
        await userEvent.click(
          within(currentTree)
            .getAllByRole("treeitem")
            .find((item) => item.getAttribute("aria-level") === "2")!,
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
