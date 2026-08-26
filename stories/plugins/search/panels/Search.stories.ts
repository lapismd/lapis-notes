import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { SearchPanel } from "@lapis-notes/search";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectAsyncQueryFailureAndRecovery,
  expectPanelPlacement,
  expectPanelSource,
  panelDemoApp,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
  triggerMetadataReset,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "search" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Search/Panels/Search",
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
      if (layout === "middle-top-tabs") {
        const startupItems = await getWorkspaceHostBinding(
          panelDemoApp(canvasElement).workspace,
        ).controller.commands.searchPalette("", { tab: "all" });
        expect(startupItems.some((item) => item.tab === "actions")).toBe(true);
        const startupFiles = startupItems.filter(
          (item) => item.providerId === "lapis-vault-files",
        );
        expect(startupFiles.length).toBeGreaterThan(0);
        expect(startupFiles.length).toBeLessThanOrEqual(5);
      }
      await userEvent.click(searchbox);
      const ownerDocument = canvasElement.ownerDocument;
      const completionTooltip = await waitFor(() => {
        const current = ownerDocument.body.querySelector<HTMLElement>(
          ".cm-tooltip-autocomplete",
        );
        expect(current).not.toBeNull();
        const currentRect = current!.getBoundingClientRect();
        expect(currentRect.left).toBeGreaterThanOrEqual(0);
        expect(currentRect.top).toBeGreaterThanOrEqual(0);
        return current!;
      });
      const completionPortal = completionTooltip.closest<HTMLElement>(
        ".cv-search-filter-bar__tooltip-layer",
      );
      const searchPanelRoot = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"]',
      );
      expect(completionPortal).not.toBeNull();
      expect(completionPortal!.parentElement).toBe(ownerDocument.body);
      expect(searchPanelRoot).not.toBeNull();
      expect(searchPanelRoot!.contains(completionTooltip)).toBe(false);
      const completionRect = completionTooltip.getBoundingClientRect();
      expect(completionRect.left).toBeGreaterThanOrEqual(0);
      expect(completionRect.top).toBeGreaterThanOrEqual(0);
      expect(completionRect.right).toBeLessThanOrEqual(
        ownerDocument.documentElement.clientWidth,
      );
      expect(completionRect.bottom).toBeLessThanOrEqual(
        ownerDocument.documentElement.clientHeight,
      );
      expect(completionRect.width).toBeGreaterThanOrEqual(280);
      expect(completionRect.width).toBeLessThanOrEqual(304);
      const completionOption =
        completionTooltip.querySelector<HTMLElement>("li[role='option']");
      expect(completionOption).not.toBeNull();
      const completionDetail = completionOption!.querySelector<HTMLElement>(
        ".cm-completionDetail",
      );
      expect(completionDetail).not.toBeNull();
      expect(getComputedStyle(completionDetail!).whiteSpace).toBe("normal");
      const optionRect = completionOption!.getBoundingClientRect();
      const hit = ownerDocument.elementFromPoint(
        optionRect.left + optionRect.width / 2,
        optionRect.top + optionRect.height / 2,
      );
      expect(completionOption!.contains(hit)).toBe(true);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => {
        expect(
          ownerDocument.body.querySelector(".cm-tooltip-autocomplete"),
        ).toBeNull();
      });
      await userEvent.type(searchbox, "Welcome");

      await waitFor(() => {
        expect(
          panel.getByRole("treeitem", {
            name: /Notes\/Welcome\.md, \d+ matches/,
          }),
        ).toBeVisible();
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
      const resultPath = resultRow
        .getAttribute("aria-label")!
        .replace(/, \d+ matches$/, "");
      const resultFilename = resultPath
        .split("/")
        .at(-1)!
        .replace(/\.[^.]+$/, "");
      const resultGroup = resultRow.closest<HTMLElement>(
        ".search-panel__result",
      )!;
      const matchList = resultGroup.querySelector<HTMLElement>(
        ".search-panel__match-list",
      )!;
      const matchHeader = matchList.querySelector<HTMLElement>(
        ".search-panel__match-header",
      )!;
      const matchPath = matchHeader.querySelector<HTMLElement>(
        ".search-panel__match-path",
      )!;
      const modeBadge = matchHeader.querySelector<HTMLElement>(
        ".search-panel__mode-badge",
      )!;
      const searchPanel = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"]',
      )!;
      const resultsBody = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"] .search-panel__tree-inset',
      )!;
      const resultsSurface = canvasElement.querySelector<HTMLElement>(
        '[data-testid="search-panel"] .search-panel__results',
      )!;
      const resultLabel = resultRow.querySelector<HTMLElement>(
        ".search-panel__file-label",
      );
      const countBadge = resultRow.querySelector<HTMLElement>(
        ".search-panel__count-badge",
      );
      expect(resultLabel).not.toBeNull();
      expect(countBadge).not.toBeNull();
      expect(modeBadge).not.toBeNull();
      expect(resultRow.querySelector(".search-panel__mode-badge")).toBeNull();
      expect(resultRow.querySelector(".search-panel__match-path")).toBeNull();
      expect(resultLabel!.textContent?.trim()).toBe(resultFilename);
      expect(getComputedStyle(resultLabel!).fontWeight).toBe("400");
      expect(matchPath.textContent?.trim()).toBe(resultPath);
      const resultsRect = resultsBody.getBoundingClientRect();
      const resultRect = resultRow.getBoundingClientRect();
      const labelRect = resultLabel!.getBoundingClientRect();
      const countRect = countBadge!.getBoundingClientRect();
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
      expect(matchHeader.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        firstMatchRect.top,
      );
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
      expect(getComputedStyle(resultsSurface).backgroundColor).toBe(
        primarySurface,
      );
      expect(getComputedStyle(matchList).backgroundColor).toBe(
        secondarySurface,
      );
      expect(getComputedStyle(matchListBody).backgroundColor).toBe(
        secondarySurface,
      );
      expect(secondarySurface).not.toBe(primarySurface);
      expect(getComputedStyle(modeBadge!).backgroundColor).toBe(primarySurface);
      expect(getComputedStyle(modeBadge!).backgroundColor).not.toBe(
        getComputedStyle(matchList).backgroundColor,
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
      const highlightedMatch =
        stableAfterMatch.querySelector<HTMLElement>("mark")!;
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
        const metadataApp = panelDemoApp(canvasElement);
        await expectAsyncQueryFailureAndRecovery({
          target: metadataApp.metadataCache,
          method: "queryFacets",
          trigger: () => triggerMetadataReset(metadataApp),
          expectFailure: () =>
            waitFor(() => {
              expect(panel.getByRole("alert")).toHaveTextContent(
                "Storybook metadata query failure",
              );
            }),
          expectRecovery: () =>
            waitFor(() => {
              expect(panel.queryByRole("alert")).not.toBeInTheDocument();
            }),
        });
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
        await expect(panel.getByText("Type to search.")).toBeVisible();
        expect(
          panel.queryByRole("heading", { name: "Recent searches" }),
        ).not.toBeInTheDocument();
        await userEvent.type(searchbox, "tag:#project/a");
        await waitFor(() => {
          expect(
            canvasElement.ownerDocument.body.querySelector(
              ".cm-tooltip-autocomplete",
            ),
          ).toBeTruthy();
        });
        await userEvent.keyboard("{Enter}");
        await waitFor(() => {
          expect(searchbox).toHaveTextContent("tag:#project/alpha");
          expect(searchbox).toHaveAttribute("aria-invalid", "false");
          expect(
            panel.getByRole("treeitem", {
              name: /Notes\/Welcome\.md, \d+ matches/,
            }),
          ).toBeVisible();
          expect(panel.queryByRole("alert")).not.toBeInTheDocument();
        });
        await userEvent.click(
          panel.getByRole("button", { name: "Copy search results" }),
        );
        await waitFor(() => {
          const chip = searchbox.querySelector<HTMLElement>(
            ".cv-search-filter-bar__predicate-chip",
          );
          expect(chip).not.toBeNull();
          expect(
            chip!.querySelector<HTMLElement>(
              ".cv-search-filter-bar__predicate-chip-label",
            ),
          ).toHaveTextContent("tag:#project/alpha");
        });
        await userEvent.click(
          panel.getByRole("button", { name: "Clear search" }),
        );
        await userEvent.type(searchbox, "tag:#project");
        const spacedTagOption = await waitFor(() => {
          const options = [
            ...canvasElement.ownerDocument.body.querySelectorAll<HTMLElement>(
              ".cm-tooltip-autocomplete li",
            ),
          ];
          expect(options.map((option) => option.textContent)).toContain(
            "#project alpha",
          );
          return options.find(
            (candidate) => candidate.textContent === "#project alpha",
          )!;
        });
        await userEvent.click(spacedTagOption);
        await waitFor(() => {
          expect(searchbox).toHaveTextContent('tag:"#project alpha"');
          expect(searchbox).toHaveAttribute("aria-invalid", "false");
          expect(
            panel.getByRole("treeitem", {
              name: /Notes\/Welcome\.md, \d+ matches/,
            }),
          ).toBeVisible();
          expect(panel.queryByRole("alert")).not.toBeInTheDocument();
        });
        await userEvent.click(
          panel.getByRole("button", { name: "Clear search" }),
        );
        await userEvent.type(searchbox, "file:FilenameOnly");
        await waitFor(() =>
          expect(
            panel.getByRole("treeitem", {
              name: /Notes\/FilenameOnly\.md, \d+ matches/,
            }),
          ).toBeVisible(),
        );
        const currentTree = panel.getByRole("tree", { name: "Search results" });
        const app = panelDemoApp(canvasElement);
        const searchLeaf = app.workspace.getLeavesOfType("search")[0];
        expect(searchLeaf).toBeDefined();
        const currentFileTreeItems = within(currentTree)
          .getAllByRole("treeitem")
          .filter((item) => item.getAttribute("aria-level") === "1");
        expect(currentFileTreeItems.length).toBeGreaterThan(0);
        for (const currentFileTreeItem of currentFileTreeItems) {
          await expect(currentFileTreeItem).toHaveAttribute("aria-expanded");
          if (currentFileTreeItem.getAttribute("aria-expanded") !== "true") {
            await userEvent.click(currentFileTreeItem);
          }
          const resultGroup = currentFileTreeItem.closest(
            ".search-panel__result",
          )!;
          const resultPath = currentFileTreeItem
            .getAttribute("aria-label")!
            .replace(/, \d+ matches$/, "");
          expect(
            within(resultGroup)
              .getAllByRole("treeitem")
              .some((item) => item.getAttribute("aria-level") === "2"),
          ).toBe(true);
          await expect(within(resultGroup).getByText(resultPath)).toBeVisible();
          await expect(within(resultGroup).getByText("lexical")).toBeVisible();
        }
        const filenameOnlyResult = currentFileTreeItems.find((item) =>
          item.getAttribute("aria-label")?.startsWith("Notes/FilenameOnly.md,"),
        )!;
        await expect(
          within(
            filenameOnlyResult.closest(".search-panel__result")!,
          ).getByText("name"),
        ).toBeVisible();
        await userEvent.click(
          panel.getByRole("button", { name: "Clear search" }),
        );
        await userEvent.type(searchbox, "Welcome");
        await waitFor(() =>
          expect(
            panel.getByRole("treeitem", {
              name: /Notes\/Welcome\.md, \d+ matches/,
            }),
          ).toBeVisible(),
        );
        const navigationTree = panel.getByRole("tree", {
          name: "Search results",
        });
        const navigationFile = within(navigationTree)
          .getAllByRole("treeitem")
          .find((item) => item.getAttribute("aria-level") === "1")!;
        if (navigationFile.getAttribute("aria-expanded") !== "true") {
          await userEvent.click(navigationFile);
        }
        await userEvent.click(
          within(navigationTree)
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
        expect(app.workspace.getLeavesOfType("search")).toContain(searchLeaf);
        expect(searchLeaf!.view.getViewType()).toBe("search");
        app.workspace.setActiveLeaf(searchLeaf!, { focus: false });
        app.workspace.revealLeaf(searchLeaf!);
        await waitFor(() => {
          expect(
            within(canvasElement).getByTestId("search-panel"),
          ).toBeVisible();
          expect(app.workspace.activeLeaf).toBe(searchLeaf);
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
