import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import {
  completionStatus,
  currentCompletions,
  startCompletion,
} from "@codemirror/autocomplete";
import { insertImageFiles } from "@lapismd/mira/core";
import {
  leafFilePath,
  type App,
  type Editor,
  type MemoryVaultAdapter,
} from "@lapis-notes/api";
import { refreshLanguageServiceDiagnostics } from "@lapis-notes/api/editor/language-service";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { findWorkspaceTab } from "@lapismd/design-core/workspace/core";
import { diagnosticCodeValue } from "@lapismd/design-core/workspace/problems";
import LapisEditorDemo, {
  settleLapisEditorDemoLifecycle,
} from "./LapisEditorDemo.svelte";
import { workspaceStoryMeta } from "../_shared";

const meta = {
  title: "Workspace/Lapis Editor Demo",
  component: LapisEditorDemo,
  beforeEach: async () => {
    await settleLapisEditorDemoLifecycle();
  },
} satisfies Meta<typeof LapisEditorDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function waitForReady(canvas: ReturnType<typeof within>) {
  await waitFor(
    () => {
      expect(canvas.getByTestId("lapis-editor-status")).toHaveTextContent(
        "ready",
      );
      expect(
        canvas
          .getByTestId("lapis-editor-demo")
          .querySelector('[data-app-shell-ready="true"]'),
      ).toBeInTheDocument();
    },
    { timeout: 15_000 },
  );
}

function visibleEditorContents(canvasElement: HTMLElement): HTMLElement[] {
  return [...canvasElement.querySelectorAll<HTMLElement>(".cm-content")].filter(
    (element) => element.getClientRects().length > 0,
  );
}

function editorLineContaining(
  canvasElement: HTMLElement,
  text: string,
): HTMLElement | null {
  return (
    [...canvasElement.querySelectorAll<HTMLElement>(".cm-line")].find((line) =>
      line.textContent?.includes(text),
    ) ?? null
  );
}

function activeStoryEditor(canvasElement: HTMLElement): Editor {
  const runtimeApp = activeStoryApp(canvasElement);
  const editor = (
    runtimeApp.workspace.activeLeaf?.view as { editor?: Editor } | undefined
  )?.editor;
  if (!editor) throw new Error("The active story leaf has no Lapis editor");
  return editor;
}

function activeStoryApp(canvasElement: HTMLElement): App {
  const runtimeApp = canvasElement.querySelector<
    HTMLElement & { __lapisApp?: App }
  >('[data-testid="lapis-editor-demo"]')?.__lapisApp;
  if (!runtimeApp) throw new Error("The editor story has no active Lapis app");
  return runtimeApp;
}

async function waitForBrowserFrame(canvasElement: HTMLElement): Promise<void> {
  await new Promise<void>((resolve) => {
    canvasElement.ownerDocument.defaultView!.requestAnimationFrame(() =>
      resolve(),
    );
  });
}

function countRootLeaves(app: App): number {
  let count = 0;
  app.workspace.iterateRootLeaves(() => {
    count += 1;
  });
  return count;
}

function expectRenderedWorkspaceTabActive(
  canvasElement: HTMLElement,
  app: App,
  leafId: string,
): void {
  const controller = getWorkspaceHostBinding(app.workspace).controller;
  expect(
    findWorkspaceTab(controller.renderer.layout, leafId)?.pane.activeItemId,
  ).toBe(leafId);
  const renderedTab = canvasElement.querySelector<HTMLElement>(
    `[data-workspace-tab-id="${leafId}"]`,
  );
  expect(renderedTab).not.toBeNull();
  expect(renderedTab).toHaveAttribute("data-active", "true");
  expect(
    renderedTab!.querySelector("[data-workspace-tab-title-trigger]"),
  ).toHaveAttribute("aria-pressed", "true");
}

async function persistedStoryConfiguration(
  canvasElement: HTMLElement,
): Promise<Record<string, unknown>> {
  return JSON.parse(
    await activeStoryApp(canvasElement).vault.adapter.read(
      ".obsidian/app.json",
    ),
  ) as Record<string, unknown>;
}

function moveStoryCursorToEnd(canvasElement: HTMLElement): void {
  const editor = activeStoryEditor(canvasElement);
  const line = editor.lastLine();
  editor.setCursor({ line, ch: editor.getLine(line).length });
  editor.focus();
}

function selectStoryText(canvasElement: HTMLElement, text: string): void {
  const editor = activeStoryEditor(canvasElement);
  const from = editor.getValue().indexOf(text);
  if (from < 0) throw new Error(`Story editor text not found: ${text}`);
  editor.setSelection(
    editor.offsetToPos(from),
    editor.offsetToPos(from + text.length),
  );
  editor.focus();
}

export const Ready: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-ready",
    "A runnable Lapis workspace boots required plugins over the public in-memory vault and exposes landing actions and vault-file search.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/ready-chromium.png",
  ),
  args: { scenario: "ready" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);

    await expect(
      canvas.getByRole("heading", { name: "No file is open" }),
    ).toBeVisible();
    const spellcheck = await waitFor(() => {
      const item = canvasElement.querySelector(
        '[data-status-bar-item-id="spellcheck:status"]',
      );
      expect(item).not.toBeNull();
      expect(item?.textContent).toMatch(/US|GB|CA|AU|IN/);
      return item as HTMLElement;
    });
    await userEvent.click(spellcheck);
    await waitFor(() => {
      const menus = within(canvasElement.ownerDocument.body);
      expect(menus.getByRole("menuitem", { name: "American" })).toBeVisible();
      expect(
        menus.getByRole("menuitem", { name: /automatic checking/i }),
      ).toBeVisible();
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        within(canvasElement.ownerDocument.body).queryByRole("menuitem", {
          name: "American",
        }),
      ).toBeNull();
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none");
    });
    await expect(
      canvas.getByRole("button", { name: "Create new note" }),
    ).toBeVisible();
    const landing = canvas.getByTestId("lapis-editor-landing");
    const empty = landing.querySelector<HTMLElement>(
      '[data-ui-component="workspace-empty"]',
    );
    const landingHost = landing.closest<HTMLElement>(
      '[data-ui-component="workspace-view-host"]',
    );
    await expect(empty).not.toBeNull();
    await expect(empty).toHaveAttribute("data-workspace-surface", "page");
    await expect(landingHost).not.toBeNull();
    await expect(getComputedStyle(empty!).backgroundColor).toBe(
      getComputedStyle(landingHost!).backgroundColor,
    );

    const explorerFixture = canvas.getByTestId("lapis-editor-explorer");
    const explorer = explorerFixture.querySelector<HTMLElement>(
      '[data-ui-component="workspace-explorer"]',
    );
    const explorerToolbar = explorer?.querySelector<HTMLElement>(
      '[data-ui-part="toolbar"]',
    );
    const explorerHost = explorer?.closest<HTMLElement>(
      '[data-ui-component="workspace-view-host"]',
    );
    await expect(explorer).not.toBeNull();
    await expect(explorerToolbar).not.toBeNull();
    await expect(explorerHost).not.toBeNull();
    await expect(getComputedStyle(explorer!).backgroundColor).toBe(
      getComputedStyle(explorerHost!).backgroundColor,
    );
    await expect(getComputedStyle(explorerToolbar!).backgroundColor).toBe(
      getComputedStyle(explorerHost!).backgroundColor,
    );
    expect(
      explorer!.querySelector(".ui-workspace-explorer__group-label"),
    ).toBeNull();
    await expect(
      within(explorer!).getByRole("list", { name: "Files" }),
    ).toBeVisible();
    const autoReveal = within(explorer!).getByRole("button", {
      name: "Auto-reveal current file",
    });
    await expect(autoReveal).toHaveAttribute("aria-pressed", "true");
    const autoRevealIcon = autoReveal.querySelector<HTMLElement>(
      '[data-ui-component="workspace-icon"]',
    );
    expect(autoRevealIcon).not.toBeNull();
    const accentProbe = document.createElement("span");
    accentProbe.style.color = "var(--ui-workspace-accent)";
    explorer!.append(accentProbe);
    const expectedAccent = getComputedStyle(accentProbe).color;
    accentProbe.remove();
    expect(getComputedStyle(autoRevealIcon!).color).toBe(expectedAccent);
    await expect(
      canvas.getByTestId("lapis-editor-registered-views"),
    ).toHaveTextContent(/Markdown:.*\.md/);
    await expect(
      canvas.getByTestId("lapis-editor-registered-views"),
    ).toHaveTextContent(/Text:.*\.txt/);
    await expect(
      canvas.getByTestId("lapis-editor-registered-views"),
    ).toHaveTextContent(/JSON:.*\.json/);
    await expect(
      canvas.getByTestId("lapis-editor-registered-views"),
    ).toHaveTextContent(/YAML:.*\.yaml/);

    await userEvent.click(canvas.getByRole("button", { name: "Go to file" }));
    const palette = canvas.getByRole("dialog", { name: "Command Palette" });
    await expect(palette).toBeVisible();
    await expect(
      within(palette).getByRole("tab", { name: "Files" }),
    ).toHaveAttribute("aria-selected", "true");
    const search = within(palette).getByRole("combobox", {
      name: "Search commands",
    });
    await userEvent.type(search, "settings.json");
    await waitFor(() =>
      expect(
        within(palette).getByRole("option", { name: /settings\.json/i }),
      ).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await expect(
      canvas.getByRole("heading", { name: "No file is open" }),
    ).toBeVisible();

    const ideasFile = canvas.getByText("Ideas.markdown", { exact: true });
    if (!ideasFile.getClientRects().length) {
      await userEvent.click(
        canvas.getByRole("button", { name: "Notes", exact: true }),
      );
    }
    const runtimeApp = activeStoryApp(canvasElement);
    const rootLeavesBefore = countRootLeaves(runtimeApp);

    await userEvent.click(ideasFile);
    await waitFor(() => {
      expect(countRootLeaves(runtimeApp)).toBe(rootLeavesBefore);
      expect(runtimeApp.workspace.activeEditor?.file?.path).toBe(
        "Notes/Ideas.markdown",
      );
    });
    const singleOpenedLeaf = runtimeApp.workspace.activeLeaf;
    expect(singleOpenedLeaf).not.toBeNull();

    const welcomeFile = runtimeApp.vault.getFileByPath("Notes/Welcome.md");
    expect(welcomeFile).not.toBeNull();
    const alternateLeaf = runtimeApp.workspace.getLeaf("tab");
    runtimeApp.workspace.activeLeaf = alternateLeaf;
    await alternateLeaf.openFile(welcomeFile!);
    const wordCount = await waitFor(() => {
      const item = canvasElement.querySelector(
        '[data-status-bar-item-id="wordcount:status"]',
      );
      expect(item).not.toBeNull();
      expect(item?.textContent).toMatch(/\d+ words/);
      expect(item?.textContent).toMatch(/\d+ characters/);
      return item as HTMLElement;
    });
    await userEvent.click(wordCount);
    await waitFor(() => {
      expect(
        within(canvasElement.ownerDocument.body).getByRole("menuitem", {
          name: /\d+ min read/,
        }),
      ).toBeVisible();
    });
    await userEvent.keyboard("{Escape}");
    expect(
      canvas.queryByText(/\d+ words/, {
        selector: ".status-bar-item-segment",
      }),
    ).toBeNull();
    await runtimeApp.workspace.revealLeaf(alternateLeaf);
    const leavesWithAlternate = countRootLeaves(runtimeApp);

    await userEvent.click(ideasFile);
    await waitFor(() => {
      expect(runtimeApp.workspace.activeLeaf).toBe(singleOpenedLeaf);
      expect(countRootLeaves(runtimeApp)).toBe(leavesWithAlternate);
      expect(leafFilePath(alternateLeaf)).toBe("Notes/Welcome.md");
      expectRenderedWorkspaceTabActive(
        canvasElement,
        runtimeApp,
        singleOpenedLeaf!.id,
      );
    });

    singleOpenedLeaf!.detach();
    runtimeApp.workspace.activeLeaf = alternateLeaf;
    await runtimeApp.workspace.revealLeaf(alternateLeaf);
    const leavesBeforeDoubleClick = countRootLeaves(runtimeApp);

    await fireEvent.dblClick(ideasFile);
    await waitFor(() => {
      expect(countRootLeaves(runtimeApp)).toBe(leavesBeforeDoubleClick + 1);
      expect(runtimeApp.workspace.activeEditor?.file?.path).toBe(
        "Notes/Ideas.markdown",
      );
      expect(leafFilePath(alternateLeaf)).toBe("Notes/Welcome.md");
    });
    const doubleOpenedLeaf = runtimeApp.workspace.activeLeaf;
    expect(doubleOpenedLeaf).not.toBeNull();

    await waitFor(() => {
      expect(
        findWorkspaceTab(
          getWorkspaceHostBinding(runtimeApp.workspace).controller.renderer
            .layout,
          doubleOpenedLeaf!.id,
        )?.tab.title,
      ).toBe("Ideas.markdown");
    });

    runtimeApp.workspace.activeLeaf = alternateLeaf;
    await runtimeApp.workspace.revealLeaf(alternateLeaf);
    const leavesBeforeDoubleReuse = countRootLeaves(runtimeApp);
    await fireEvent.dblClick(ideasFile);
    await waitFor(() => {
      expect(runtimeApp.workspace.activeLeaf).toBe(doubleOpenedLeaf);
      expect(countRootLeaves(runtimeApp)).toBe(leavesBeforeDoubleReuse);
      expectRenderedWorkspaceTabActive(
        canvasElement,
        runtimeApp,
        doubleOpenedLeaf!.id,
      );
    });

    runtimeApp.workspace.activeLeaf = alternateLeaf;
    await runtimeApp.workspace.revealLeaf(alternateLeaf);
    const leavesBeforeCommandClick = countRootLeaves(runtimeApp);
    await fireEvent.click(ideasFile, { metaKey: true });
    await waitFor(() => {
      expect(countRootLeaves(runtimeApp)).toBe(leavesBeforeCommandClick + 1);
      expect(runtimeApp.workspace.activeEditor?.file?.path).toBe(
        "Notes/Ideas.markdown",
      );
      expect(runtimeApp.workspace.activeLeaf).not.toBe(doubleOpenedLeaf);
    });
    const commandOpenedLeaf = runtimeApp.workspace.activeLeaf;
    expect(commandOpenedLeaf).not.toBeNull();

    commandOpenedLeaf!.detach();
    doubleOpenedLeaf!.detach();
    alternateLeaf.detach();
    await waitFor(() =>
      expect(
        canvas.getByRole("heading", { name: "No file is open" }),
      ).toBeVisible(),
    );

    await userEvent.click(ideasFile);

    const editorBody = await waitFor(() => {
      const body =
        canvasElement.querySelector<HTMLElement>(".cm-editor-content");
      expect(body).not.toBeNull();
      expect(body!.getClientRects().length).toBeGreaterThan(0);
      return body!;
    });
    const editorHost = editorBody.closest<HTMLElement>(
      '[data-ui-component="editor"]',
    );
    const outerSizer = editorBody.parentElement;
    expect(editorHost).not.toBeNull();
    expect(outerSizer).toHaveClass("cm-sizer");
    await expect(
      canvas.getByRole("button", { name: "Open right sidebar" }),
    ).toBeVisible();

    const paneWidthBefore = editorHost!.getBoundingClientRect().width;
    const bodyWidthBefore = editorBody.getBoundingClientRect().width;

    try {
      await userEvent.click(
        canvas.getByRole("button", { name: "Close left sidebar" }),
      );

      await waitFor(() => {
        expect(editorHost!.getBoundingClientRect().width).toBeGreaterThan(
          paneWidthBefore + 100,
        );
        expect(editorBody.getBoundingClientRect().width).toBeGreaterThanOrEqual(
          bodyWidthBefore,
        );
      });

      expect(getComputedStyle(outerSizer!).maxWidth).toBe("none");
      expect(getComputedStyle(outerSizer!).marginInlineStart).toBe("0px");
      expect(
        Math.abs(editorBody.getBoundingClientRect().width - 700),
      ).toBeLessThan(2);
    } finally {
      const openLeftSidebar = canvas.queryByRole("button", {
        name: "Open left sidebar",
      });
      if (openLeftSidebar) await userEvent.click(openLeftSidebar);

      const closeIdeas = canvas.queryByRole("button", {
        name: "Close Ideas.markdown",
      });
      if (closeIdeas) await userEvent.click(closeIdeas);
    }

    await expect(
      canvas.getByRole("heading", { name: "No file is open" }),
    ).toBeVisible();
  },
};

export const YamlSource: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-yaml-source",
    "The production Source Editor opens YAML files with the shared YAML CodeMirror language association used by desktop and web.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/yaml-source-chromium.png",
  ),
  tags: ["visual-pending"],
  args: { scenario: "ready" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Go to file" }));
    const palette = canvas.getByRole("dialog", { name: "Command Palette" });
    const search = within(palette).getByRole("combobox", {
      name: "Search commands",
    });
    await userEvent.type(search, "config.yaml");
    const yamlOption = await waitFor(() => {
      const option = within(palette).getByRole("option", {
        name: /config\.yaml/i,
      });
      expect(option).toBeVisible();
      return option;
    });
    await userEvent.click(yamlOption);

    await waitFor(() =>
      expect(canvas.getByTestId("lapis-editor-active-view")).toHaveTextContent(
        "yaml",
      ),
    );
    const yamlEditor = await waitFor(() => {
      const editor = canvasElement.querySelector<HTMLElement>(
        '.cm-editor.cm-editor-source[data-language="yaml"]',
      );
      expect(editor).not.toBeNull();
      return editor!;
    });
    await expect(yamlEditor).toHaveTextContent("sourceEditor: true");
    await expect(
      activeStoryApp(canvasElement).workspace.activeEditor?.file?.path,
    ).toBe("Projects/config.yaml");
  },
};

export const MarkdownProblems: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-markdown-problems",
    "An invalid open Markdown note shares one Markdownlint result between the editor gutter and the movable Problems panel, including tree/table presentation, navigation, and quick fixes.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/markdown-problems-chromium.png",
  ),
  tags: ["visual-pending"],
  args: { scenario: "markdown-problems" },
  play: async ({ canvasElement }) => {
    delete canvasElement.dataset.markdownProblemsAcceptanceReady;
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    const runtimeApp = activeStoryApp(canvasElement);
    const storyDocument = canvasElement.ownerDocument;
    const editor = activeStoryEditor(canvasElement);
    const invalidFixture = editor.getValue();

    const blockToolbarPortal = await waitFor(() => {
      const portals = [
        ...storyDocument.querySelectorAll<HTMLElement>(
          ".mira-block-toolbar-portal",
        ),
      ];
      expect(portals.length).toBeGreaterThan(0);
      return portals.at(-1)!;
    });
    expect(getComputedStyle(blockToolbarPortal).position).toBe("fixed");
    expect(blockToolbarPortal.getBoundingClientRect().height).toBe(0);

    await refreshLanguageServiceDiagnostics(editor.view, {
      languageId: "markdown",
    });
    await waitFor(
      () => {
        expect(
          runtimeApp.workspace.diagnostics
            .snapshot()
            .entries.filter(
              (entry) => entry.diagnostic.source === "markdownlint",
            )
            .map((entry) => diagnosticCodeValue(entry.diagnostic))
            .sort(),
        ).toEqual(["MD018", "MD025"]);
        expect(
          canvasElement.querySelectorAll(".cm-lint-marker-warning"),
        ).toHaveLength(2);
        expect(
          editorLineContaining(
            canvasElement,
            "missing heading space",
          )?.querySelector(".cm-lintRange-warning"),
        ).not.toBeNull();
        expect(runtimeApp.workspace.diagnostics.snapshot().entries).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              diagnostic: expect.objectContaining({
                source: "markdownlint",
                code: {
                  value: "MD018",
                  target:
                    "https://github.com/DavidAnson/markdownlint/blob/main/doc/md018.md",
                },
              }),
            }),
          ]),
        );
      },
      { timeout: 8_000 },
    );

    const gutterElement = await waitFor(() => {
      const gutter = Array.from(
        canvasElement.querySelectorAll<HTMLElement>(
          ".cm-gutter-lint .cm-gutterElement",
        ),
      ).find(
        (element) =>
          element.matches(".cm-lint-marker-warning") ||
          element.querySelector(".cm-lint-marker-warning"),
      );
      expect(gutter).not.toBeNull();
      return gutter!;
    });
    const lintMarker = gutterElement.matches(".cm-lint-marker-warning")
      ? gutterElement
      : gutterElement.querySelector<HTMLElement>(".cm-lint-marker-warning");
    expect(lintMarker).not.toBeNull();
    const markerStyle = getComputedStyle(lintMarker!);
    expect(markerStyle.maskImage || markerStyle.webkitMaskImage).not.toBe(
      "none",
    );
    expect(getComputedStyle(gutterElement).display).toContain("flex");
    expect(getComputedStyle(gutterElement).justifyContent).toBe("center");

    await getWorkspaceHostBinding(
      runtimeApp.workspace,
    ).controller.commands.execute("app-shell:show-problems");
    const problems = await waitFor(() => {
      const panel = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="workspace-problems"]',
      );
      expect(panel).not.toBeNull();
      return panel!;
    });
    const problemsCanvas = within(problems);
    const problemsLeafLabel = await waitFor(() => {
      const label = canvas.getByLabelText("Problems, 2 problems");
      expect(label.closest('[role="tab"]')).not.toBeNull();
      return label;
    });
    const problemsLeafBadge = problemsLeafLabel.querySelector<HTMLElement>(
      "[data-workspace-view-badge]",
    );
    expect(problemsLeafBadge).not.toBeNull();
    expect(problemsLeafBadge).toHaveTextContent("2");
    expect(getComputedStyle(problemsLeafBadge!).backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
    expect(
      problems.querySelector(".ui-workspace-problems__title-count"),
    ).not.toBeInTheDocument();
    expect(
      problemsCanvas.queryByRole("heading", { name: "Problems" }),
    ).not.toBeInTheDocument();
    const problemsToolbar = problems.querySelector<HTMLElement>(
      '[data-ui-part="toolbar"]',
    );
    expect(problemsToolbar).not.toBeNull();
    expect(getComputedStyle(problemsToolbar!).justifyContent).toBe("flex-end");
    const workspaceController = getWorkspaceHostBinding(
      runtimeApp.workspace,
    ).controller;
    const problemsTabId = problemsLeafLabel.dataset.workspaceViewLabel;
    expect(problemsTabId).toBeTruthy();
    expect(
      findWorkspaceTab(workspaceController.renderer.layout, problemsTabId!)?.tab
        .title,
    ).toBe("Problems");
    await userEvent.click(
      problemsCanvas.getByRole("button", { name: "View as Table" }),
    );
    const table = problemsCanvas.getByRole("table", {
      name: "Problems table",
    });
    const tableCanvas = within(table);
    await expect(
      tableCanvas.getByRole("columnheader", { name: "Code" }),
    ).toBeVisible();
    await expect(
      tableCanvas.getByRole("columnheader", { name: "Message" }),
    ).toBeVisible();
    await expect(
      tableCanvas.getByRole("columnheader", { name: "File" }),
    ).toBeVisible();
    await expect(
      tableCanvas.getByRole("columnheader", { name: "Source" }),
    ).toBeVisible();
    await expect(tableCanvas.getAllByText("MD018").length).toBeGreaterThan(0);
    await expect(
      problems.querySelector(
        '[data-ui-component="scroll-area"][data-ui-part="scroll-area"][data-view-mode="table"]',
      ),
    ).not.toBeNull();
    await userEvent.click(
      problemsCanvas.getByRole("button", { name: "View as Tree" }),
    );
    let problem = problemsCanvas.getByRole("button", {
      name: /No space after hash on atx style heading/i,
    });
    await expect(problem).toHaveTextContent("markdownlint(MD018)");
    await expect(problem).toHaveTextContent(
      "MD018/no-missing-space-atx-except-tags: No space after hash on atx style heading, except lowercase Lapis tag lines",
    );

    const severityFilter = problemsCanvas.getByRole("button", {
      name: "Filter problem severities",
    });
    expect(severityFilter.querySelector(".lucide-list-filter")).toBeVisible();
    const filterInput = problemsCanvas.getByRole("textbox", {
      name: "Filter problems",
    });
    expect(
      filterInput.getBoundingClientRect().height -
        severityFilter.getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(6);
    await userEvent.click(severityFilter);
    const overlayCanvas = within(canvasElement.ownerDocument.body);
    let warningsFilter = await overlayCanvas.findByRole("menuitemcheckbox", {
      name: /^Warnings: [1-9]\d*$/,
    });
    expect(
      overlayCanvas.getByRole("menuitemcheckbox", {
        name: /^Infos: \d+$/,
      }),
    ).toBeVisible();
    const severityItems = [
      overlayCanvas.getByRole("menuitemcheckbox", { name: /^Errors: \d+$/ }),
      warningsFilter,
      overlayCanvas.getByRole("menuitemcheckbox", { name: /^Infos: \d+$/ }),
      overlayCanvas.getByRole("menuitemcheckbox", { name: /^Hints: \d+$/ }),
    ];
    const severityMenu = warningsFilter.closest<HTMLElement>('[role="menu"]');
    expect(severityMenu).not.toBeNull();
    const severityMenuWidth = severityMenu!.getBoundingClientRect().width;
    expect(severityMenuWidth).toBeGreaterThanOrEqual(224);
    expect(severityMenuWidth).toBeLessThan(288);
    const severityIconColors = new Set<string>();
    const countRightEdges = new Set<number>();
    for (const item of severityItems) {
      const iconHost = item.querySelector<HTMLElement>(
        '[data-ui-component="workspace-icon"]',
      );
      const iconGraphic =
        iconHost?.tagName.toLowerCase() === "svg"
          ? iconHost
          : iconHost?.querySelector<SVGElement>("svg");
      expect(iconGraphic).not.toBeNull();
      severityIconColors.add(getComputedStyle(iconGraphic!).color);
      const count = item.querySelector<HTMLElement>(
        ".ui-workspace-problems__filter-menu-count",
      );
      expect(count).not.toBeNull();
      countRightEdges.add(Math.round(count!.getBoundingClientRect().right));
    }
    expect(severityIconColors.size).toBe(4);
    expect(countRightEdges.size).toBe(1);
    expect(warningsFilter).toHaveAttribute("data-state", "checked");
    await userEvent.click(warningsFilter);
    await waitFor(() => {
      expect(
        problemsCanvas.queryByRole("button", {
          name: /No space after hash on atx style heading/i,
        }),
      ).not.toBeInTheDocument();
    });
    await waitFor(() =>
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      ),
    );
    await userEvent.click(severityFilter);
    warningsFilter = await overlayCanvas.findByRole("menuitemcheckbox", {
      name: /^Warnings: [1-9]\d*$/,
    });
    expect(warningsFilter).toHaveAttribute("data-state", "unchecked");
    await userEvent.click(warningsFilter);
    await waitFor(() =>
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      ),
    );
    problem = await problemsCanvas.findByRole("button", {
      name: /No space after hash on atx style heading/i,
    });

    await userEvent.click(problem);
    await expect(
      activeStoryEditor(canvasElement).getCursor("from"),
    ).toMatchObject({
      line: 10,
    });

    const navigatedProblem = await waitFor(
      () =>
        problemsCanvas.getByRole("button", {
          name: /No space after hash on atx style heading/i,
        }),
      { timeout: 5_000 },
    );
    await userEvent.pointer({ keys: "[MouseRight]", target: navigatedProblem });
    const documentCanvas = within(canvasElement.ownerDocument.body);
    await documentCanvas.findByRole("menuitem", { name: "Copy Message" });
    const fix = await documentCanvas.findByRole("menuitem", {
      name: /Fix this violation of `MD018/,
    });
    await userEvent.click(fix);

    await waitFor(
      () => {
        expect(
          runtimeApp.workspace.diagnostics
            .snapshot()
            .entries.some(
              (entry) => diagnosticCodeValue(entry.diagnostic) === "MD018",
            ),
        ).toBe(false);
        expect(
          runtimeApp.workspace.diagnostics
            .snapshot()
            .entries.some(
              (entry) => diagnosticCodeValue(entry.diagnostic) === "MD025",
            ),
        ).toBe(true);
        expect(
          problemsCanvas.queryByRole("button", {
            name: /No space after hash on atx style heading/i,
          }),
        ).not.toBeInTheDocument();
        expect(
          problemsCanvas.getByRole("button", {
            name: /Multiple top-level headings in the same document/i,
          }),
        ).toBeVisible();
      },
      { timeout: 5_000 },
    );
    await waitFor(() => {
      expect(editor.getValue()).toContain("## missing heading space");
    });
    await expect(
      runtimeApp.vault.adapter.read("Notes/Welcome.md"),
    ).resolves.toContain("## missing heading space");

    editor.view.dispatch({
      changes: {
        from: 0,
        to: editor.view.state.doc.length,
        insert: invalidFixture,
      },
      userEvent: "input.story-restore",
    });
    const activeFile = runtimeApp.workspace.getActiveFile();
    if (!activeFile) throw new Error("The Problems story has no active file");
    await runtimeApp.vault.modify(activeFile, invalidFixture);
    await waitFor(
      () => {
        expect(
          runtimeApp.workspace.diagnostics
            .snapshot()
            .entries.filter(
              (entry) => entry.diagnostic.source === "markdownlint",
            )
            .map((entry) => diagnosticCodeValue(entry.diagnostic))
            .sort(),
        ).toEqual(["MD018", "MD025"]);
        expect(
          canvasElement.querySelectorAll(".cm-lint-marker-warning"),
        ).not.toHaveLength(0);
        expect(
          editorLineContaining(
            canvasElement,
            "missing heading space",
          )?.querySelector(".cm-lintRange-warning"),
        ).not.toBeNull();
        expect(
          within(
            canvasElement.querySelector<HTMLElement>(
              '[data-ui-component="workspace-problems"]',
            )!,
          ).getByRole("button", {
            name: /No space after hash on atx style heading/i,
          }),
        ).toBeVisible();
        expect(
          canvas.getByLabelText(/^Problems, (?:[2-9]|\d{2,}) problems$/),
        ).toBeVisible();
      },
      { timeout: 8_000 },
    );
    await waitFor(
      async () => {
        await expect(
          runtimeApp.vault.adapter.read("Notes/Welcome.md"),
        ).resolves.toContain("##missing heading space");
      },
      { timeout: 3_000 },
    );
    canvasElement.dataset.markdownProblemsAcceptanceReady = "true";
  },
};

export const MarkdownSpellcheck: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-markdown-spellcheck",
    "A misspelled open note shares Harper diagnostics between the editor gutter and Problems, including the severity-slot Quick fix, a bare suggestion, and Add/Ignore word actions.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/markdown-spellcheck-chromium.png",
  ),
  tags: ["visual-pending", "test"],
  args: { scenario: "markdown-spellcheck" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    const runtimeApp = activeStoryApp(canvasElement);
    const editor = activeStoryEditor(canvasElement);

    expect(editor.getValue()).toContain("This sentense has a mispelled word.");
    await waitFor(
      async () => {
        await refreshLanguageServiceDiagnostics(editor.view, {
          languageId: "markdown",
        });
        const diagnosticSnapshot = runtimeApp.workspace.diagnostics.snapshot();
        const entries = diagnosticSnapshot.entries.filter(
          (entry) => entry.diagnostic.source === "harper",
        );
        expect(
          entries.length,
          diagnosticSnapshot.entries
            .map(
              (entry) =>
                `${entry.diagnostic.source ?? "unknown"}: ${entry.diagnostic.message}`,
            )
            .join("\n"),
        ).toBeGreaterThan(0);
        expect(
          canvasElement.querySelectorAll(
            ".cm-lint-marker-error, .cm-lint-marker-warning, .cm-lint-marker-hint",
          ).length,
        ).toBeGreaterThan(0);
      },
      { timeout: 20_000 },
    );

    await getWorkspaceHostBinding(
      runtimeApp.workspace,
    ).controller.commands.execute("app-shell:show-problems");
    const problems = await waitFor(() => {
      const panel = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="workspace-problems"]',
      );
      expect(panel).not.toBeNull();
      return panel!;
    });
    const problemsCanvas = within(problems);
    const quickFix = await waitFor(() => {
      const [button] = problemsCanvas.getAllByRole("button", {
        name: "Quick fix",
      });
      expect(button).toBeDefined();
      expect(button).toBeVisible();
      return button!;
    });
    await userEvent.click(quickFix);
    const menu = within(canvasElement.ownerDocument.body);
    await waitFor(() => {
      expect(
        menu.getByRole("menuitem", { name: /Add: ".*?" to dictionary/u }),
      ).toBeVisible();
      expect(menu.getByRole("menuitem", { name: /Ignore: "/u })).toBeVisible();
    });
    const replace = await waitFor(() => {
      const items = menu.getAllByRole("menuitem");
      const suggestion = items.find(
        (item) =>
          item.textContent &&
          !item.textContent.startsWith("Add:") &&
          !item.textContent.startsWith("Ignore"),
      );
      expect(suggestion).toBeDefined();
      expect(suggestion).toBeVisible();
      return suggestion!;
    });
    await userEvent.click(replace);
    await waitFor(() => {
      expect(editor.getValue()).not.toContain("sentense");
      expect(editor.getValue()).toContain("mispelled");
    });
  },
};

export const MarkdownLintLoftBoarding: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-markdown-lint-loft-boarding",
    "A long-form loft-boarding note produces the same Markdownlint rule set as vscode-markdownlint, including repeated list-style messages, without MD013 line-length warnings or the same code and range twice.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/markdown-lint-loft-boarding-chromium.png",
  ),
  tags: ["visual-pending", "test"],
  args: { scenario: "markdown-lint-loft-boarding" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    const runtimeApp = activeStoryApp(canvasElement);
    const editor = activeStoryEditor(canvasElement);

    expect(editor.getValue()).toContain("plastic raised joist extensions");
    await refreshLanguageServiceDiagnostics(editor.view, {
      languageId: "markdown",
    });

    const entries = await waitFor(
      () => {
        const snapshot = runtimeApp.workspace.diagnostics.snapshot().entries;
        expect(snapshot.length).toBeGreaterThan(1);
        return snapshot;
      },
      { timeout: 8_000 },
    );
    const identities = entries.map(
      (entry) =>
        `${diagnosticCodeValue(entry.diagnostic) ?? ""}\u0000${JSON.stringify(entry.diagnostic.range ?? null)}\u0000${entry.diagnostic.message}`,
    );
    expect(new Set(identities).size).toBe(identities.length);
    expect(
      entries
        .map((entry) => diagnosticCodeValue(entry.diagnostic) ?? "")
        .sort(),
    ).toEqual([
      "MD004",
      "MD004",
      "MD004",
      "MD004",
      "MD004",
      "MD004",
      "MD007",
      "MD007",
      "MD007",
      "MD007",
      "MD009",
      "MD009",
      "MD009",
      "MD010",
      "MD010",
      "MD012",
      "MD041",
    ]);

    await getWorkspaceHostBinding(
      runtimeApp.workspace,
    ).controller.commands.execute("app-shell:show-problems");
    const problems = await waitFor(() => {
      const panel = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="workspace-problems"]',
      );
      expect(panel).not.toBeNull();
      return panel!;
    });
    const count = entries.length;
    await expect(
      canvas.getByLabelText(
        `Problems, ${count} problem${count === 1 ? "" : "s"}`,
      ),
    ).toBeVisible();
    expect(
      problems.querySelectorAll(".ui-workspace-problems__row"),
    ).toHaveLength(count);
  },
};

export const SameFileSplitSync: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-same-file-split-sync",
    "Two CodeMirror panes share one Markdown document immediately and debounce one vault persistence write.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/same-file-split-sync-chromium.png",
  ),
  args: { scenario: "same-file-split" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    const runtimeApp = activeStoryApp(canvasElement);
    const runtimeAdapter = runtimeApp.vault.adapter as MemoryVaultAdapter;
    const componentOnWrite = runtimeAdapter.onWrite;
    let targetWriteCount = 0;
    let targetContents = "";
    runtimeAdapter.onWrite = (path, data, writeCount) => {
      componentOnWrite?.(path, data, writeCount);
      if (path !== "Notes/Welcome.md") return;
      targetWriteCount += 1;
      targetContents = data;
    };
    const editors = visibleEditorContents(canvasElement);
    await expect(editors).toHaveLength(2);
    await expect(editors[0]!.querySelector(".cm-heading")).not.toBeNull();
    const markdownHosts = [
      ...canvasElement.querySelectorAll<HTMLElement>(
        '.cm-editor.cm-editor-source[data-language="markdown"]',
      ),
    ].filter((element) => element.getClientRects().length > 0);
    await expect(markdownHosts.length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(markdownHosts[0]!.querySelector(".cm-foldGutter")).not.toBeNull(),
    );

    const storyConfiguration = runtimeApp.configuration.getConfiguration();
    await expect(
      storyConfiguration.get("appearence.interface.showInlineTitle"),
    ).toBe(true);
    await expect(activeStoryEditor(canvasElement).file?.name).toBe(
      "Welcome.md",
    );

    const inlineTitle = canvasElement.querySelector(
      ".cm-editor-inline-title",
    ) as HTMLElement | null;
    await expect(inlineTitle).not.toBeNull();
    await expect(inlineTitle).toHaveTextContent("Welcome.md");
    await expect(inlineTitle).toBeVisible();

    const header = canvasElement.querySelector(
      '[data-ui-component="workspace-view-header"]',
    );
    await expect(header).not.toBeNull();
    const breadcrumbs = header!.querySelector(
      '[data-ui-part="breadcrumbs"]',
    ) as HTMLElement | null;
    await expect(breadcrumbs).not.toBeNull();
    await expect(
      within(breadcrumbs!).getByRole("button", { name: "Notes" }),
    ).toBeVisible();

    const explorer = within(canvas.getByTestId("lapis-editor-explorer"));
    await userEvent.click(
      within(breadcrumbs!).getByRole("button", { name: "Notes" }),
    );
    await waitFor(() =>
      expect(explorer.getByRole("button", { name: "Notes" })).toHaveAttribute(
        "data-active",
        "true",
      ),
    );

    editors[0]!.focus();
    await expect(editors[0]).toHaveFocus();
    // Treat the synchronization probe as one editor transaction. Storybook's
    // per-character instrumentation can otherwise outlive the app's intended
    // debounce window and turn this into a persistence/remount timing test.
    await userEvent.paste("Synced from the left pane.");
    await expect(editors[0]).toHaveTextContent("Synced from the left pane.");
    await waitFor(() =>
      expect(editors[1]).toHaveTextContent("Synced from the left pane."),
    );
    const splitEditors = new Set<Editor>();
    runtimeApp.workspace.iterateAllLeaves((leaf) => {
      const editor = (leaf.view as { editor?: Editor }).editor;
      if (editor) splitEditors.add(editor);
    });
    await Promise.all([...splitEditors].map((editor) => editor.flushChanges()));
    await waitFor(
      async () => {
        expect(await runtimeAdapter.read("Notes/Welcome.md")).toContain(
          "Synced from the left pane.",
        );
        expect(targetContents).toContain("Synced from the left pane.");
        expect(targetWriteCount).toBe(1);
      },
      { timeout: 5_000 },
    );
    runtimeAdapter.onWrite = componentOnWrite;

    await userEvent.click(explorer.getByRole("button", { name: "Projects" }));
    await userEvent.click(
      explorer.getByRole("button", { name: "settings.json" }),
    );
    await waitFor(() =>
      expect(canvas.getByTestId("lapis-editor-active-view")).toHaveTextContent(
        "json",
      ),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector(
          '.cm-editor.cm-editor-source[data-language="json"]',
        ),
      ).not.toBeNull(),
    );
    const independentEditors = visibleEditorContents(canvasElement);
    const jsonEditor = independentEditors.find((editor) =>
      editor.textContent?.includes('"theme": "lapis"'),
    );
    const markdownEditor = independentEditors.find((editor) =>
      editor.textContent?.includes("Welcome to Lapis Notes"),
    );
    await expect(jsonEditor).toBeDefined();
    await expect(markdownEditor).toBeDefined();
    await userEvent.click(jsonEditor!);
    await userEvent.type(jsonEditor!, "Independent JSON pane");
    await expect(jsonEditor!).toHaveTextContent("Independent JSON pane");
    await expect(markdownEditor!).not.toHaveTextContent(
      "Independent JSON pane",
    );
  },
};

export const MarkdownFrontmatter: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-markdown-frontmatter",
    "Mira owns Markdown frontmatter disclosure, inline folding, source typography, and embedded-preview geometry inside the Lapis editor shell.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/markdown-frontmatter-chromium.png",
  ),
  tags: ["visual-pending"],
  args: { scenario: "markdown-frontmatter" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);

    const markdownEditor = await waitFor(
      () => {
        const editor = canvasElement.querySelector<HTMLElement>(
          '.cm-editor[data-language="markdown"]',
        );
        expect(editor).not.toBeNull();
        return editor!;
      },
      { timeout: 5_000 },
    );
    expect(markdownEditor).toHaveClass("mira-live-preview-mode");
    const editorScrollRoot = markdownEditor.closest<HTMLElement>(
      ".cm-editor-scroll-area",
    );
    expect(editorScrollRoot).not.toBeNull();
    const editorViewport = editorScrollRoot!.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    );
    expect(editorViewport).not.toBeNull();
    expect(editorViewport!.scrollHeight).toBeGreaterThan(
      editorViewport!.clientHeight,
    );
    editorViewport!.scrollTop = 20;
    await fireEvent.scroll(editorViewport!);
    await fireEvent.pointerEnter(editorScrollRoot!);
    const editorScrollbar = await waitFor(
      () => {
        const element = editorScrollRoot!.querySelector<HTMLElement>(
          '[data-ui-part="scroll-area-scrollbar"][data-orientation="vertical"]',
        );
        expect(element).not.toBeNull();
        return element!;
      },
      { timeout: 5_000 },
    );
    expect(
      Number.parseInt(getComputedStyle(editorScrollbar!).zIndex, 10),
    ).toBeGreaterThan(3);
    await fireEvent.pointerLeave(editorScrollRoot!);

    const heading = await waitFor(
      () => {
        const element = canvasElement.querySelector<HTMLElement>(".cm-heading");
        expect(element).not.toBeNull();
        return element!;
      },
      { timeout: 5_000 },
    );
    await userEvent.click(heading);

    let frontmatterWidget = await waitFor(
      () => {
        const widget = canvasElement.querySelector<HTMLElement>(
          ".mira-rich-widget--frontmatter",
        );
        expect(widget).not.toBeNull();
        return widget!;
      },
      { timeout: 5_000 },
    );
    const expandProperties = within(frontmatterWidget).getByRole("button", {
      name: "Expand properties",
    });
    const nestedSizer = frontmatterWidget.querySelector<HTMLElement>(
      ".mira-markdown-preview > .cm-sizer",
    );
    const editorLine = [
      ...canvasElement.querySelectorAll<HTMLElement>(".cm-line"),
    ].find((line) => line.getClientRects().length > 0);
    await expect(expandProperties).toHaveAttribute("aria-expanded", "false");
    expect(
      frontmatterWidget.querySelector(".md-frontmatter__content"),
    ).toBeNull();
    expect(nestedSizer).not.toBeNull();
    expect(editorLine).not.toBeNull();
    expect(getComputedStyle(nestedSizer!).paddingInlineStart).toBe("0px");
    expect(
      Math.abs(
        frontmatterWidget.getBoundingClientRect().left -
          editorLine!.getBoundingClientRect().left,
      ),
    ).toBeLessThan(1);

    await fireEvent.click(expandProperties);
    const collapseProperties = await waitFor(() =>
      within(frontmatterWidget).getByRole("button", {
        name: "Collapse properties",
      }),
    );
    await expect(collapseProperties).toHaveAttribute("aria-expanded", "true");
    await fireEvent.click(collapseProperties);
    const expandAgain = await waitFor(() =>
      within(frontmatterWidget).getByRole("button", {
        name: "Expand properties",
      }),
    );
    await expect(expandAgain).toHaveAttribute("aria-expanded", "false");

    await fireEvent.click(expandAgain);
    await waitFor(() =>
      expect(
        within(frontmatterWidget).getByRole("button", {
          name: "Collapse properties",
        }),
      ).toHaveAttribute("aria-expanded", "true"),
    );

    // Expanding frontmatter changes the height of a CodeMirror block widget.
    // Let its measurement pass finish, then reacquire the widget before
    // interacting with controls that are mounted inside it.
    await waitForBrowserFrame(canvasElement);
    await waitForBrowserFrame(canvasElement);
    frontmatterWidget = await waitFor(() => {
      const widget = canvasElement.querySelector<HTMLElement>(
        ".mira-rich-widget--frontmatter",
      );
      expect(widget).not.toBeNull();
      return widget!;
    });

    const titleRow = frontmatterWidget.querySelector<HTMLElement>(
      '[data-property="title"]',
    );
    expect(titleRow).not.toBeNull();
    const titleTypeButton = within(titleRow!).getByRole("button", {
      name: "Property options for title",
    });
    await fireEvent.click(titleTypeButton);
    const page = within(canvasElement.ownerDocument.body);
    const optionsMenu = await page.findByRole(
      "menu",
      {
        name: "Property options for title",
      },
      { timeout: 5_000 },
    );
    const propertyType = within(optionsMenu).getByRole("menuitem", {
      name: "Property type",
    });
    await expect(optionsMenu).toBeVisible();
    expect(
      within(optionsMenu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["Property type", "Cut", "Copy", "Paste", "Remove"]);
    expect(
      within(optionsMenu).queryByRole("menuitemcheckbox", { name: "Number" }),
    ).not.toBeInTheDocument();

    propertyType.focus();
    propertyType.dispatchEvent(
      new canvasElement.ownerDocument.defaultView!.KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      }),
    );
    const typeMenu = await page.findByRole("menu", {
      name: "Property type for title",
    });
    const numberType = within(typeMenu).getByRole("menuitemcheckbox", {
      name: "Number",
    });
    await expect(typeMenu).toBeVisible();
    await expect(numberType).toBeVisible();
    expect(titleRow!.contains(typeMenu)).toBe(false);
    await waitFor(
      () => {
        expect(typeMenu.getBoundingClientRect().bottom).toBeGreaterThan(
          titleRow!.getBoundingClientRect().bottom,
        );
        const numberTypeBounds = numberType.getBoundingClientRect();
        const hit = canvasElement.ownerDocument.elementFromPoint(
          numberTypeBounds.left + numberTypeBounds.width / 2,
          numberTypeBounds.top + numberTypeBounds.height / 2,
        );
        expect(hit === numberType || numberType.contains(hit)).toBe(true);
      },
      { timeout: 5_000 },
    );
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        page.queryByRole("menu", {
          name: "Property options for title",
        }),
      ).toBeNull();
      expect(
        page.queryByRole("menu", {
          name: "Property type for title",
        }),
      ).toBeNull();
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none");
    });
    await waitForBrowserFrame(canvasElement);
    await waitForBrowserFrame(canvasElement);

    expect(
      await activeStoryApp(canvasElement).metadataTypeManager.getValuesAsync(
        "tags",
      ),
    ).toEqual(expect.arrayContaining(["ideas"]));
    const tagsRow = await waitFor(
      () => {
        frontmatterWidget = canvasElement.querySelector<HTMLElement>(
          ".mira-rich-widget--frontmatter",
        )!;
        expect(frontmatterWidget).not.toBeNull();
        const row = frontmatterWidget.querySelector<HTMLElement>(
          '[data-property="tags"]',
        );
        expect(row).not.toBeNull();
        return row!;
      },
      { timeout: 5_000 },
    );
    const demoRemove = within(tagsRow).getByRole("button", {
      name: "Remove demo",
    });
    const removeIcon = demoRemove.querySelector<SVGElement>("svg");
    expect(removeIcon?.querySelector('path[d="M18 6 6 18"]')).not.toBeNull();
    expect(removeIcon?.querySelector('path[d="m6 6 12 12"]')).not.toBeNull();
    expect(
      removeIcon?.getBoundingClientRect().width ?? 0,
    ).toBeGreaterThanOrEqual(9);

    const tagsInput = within(tagsRow).getByRole("combobox", {
      name: "tags value",
    });
    tagsInput.focus();
    await expect(tagsInput).toHaveFocus();
    await fireEvent.input(tagsInput, { target: { value: "ide" } });
    await expect(tagsInput).toHaveValue("ide");
    const ideasOption = await page.findByRole(
      "option",
      { name: "ideas" },
      { timeout: 5_000 },
    );
    const suggestions = ideasOption.closest<HTMLElement>(
      ".mira-property-value-suggestions",
    );
    expect(suggestions).not.toBeNull();
    expect(tagsRow.contains(suggestions)).toBe(false);
    await waitFor(
      () => {
        const ideasBounds = ideasOption.getBoundingClientRect();
        const ideasHit = canvasElement.ownerDocument.elementFromPoint(
          ideasBounds.left + ideasBounds.width / 2,
          ideasBounds.top + ideasBounds.height / 2,
        );
        expect(ideasHit === ideasOption || ideasOption.contains(ideasHit)).toBe(
          true,
        );
      },
      { timeout: 5_000 },
    );
    await userEvent.keyboard("{Escape}");

    const foldGutter =
      markdownEditor?.querySelector<HTMLElement>(".cm-foldGutter");
    expect(markdownEditor).not.toBeNull();
    expect(foldGutter).not.toBeNull();
    expect(getComputedStyle(foldGutter!).display).toBe("none");

    await userEvent.click(
      within(frontmatterWidget).getByRole("button", { name: "Edit source" }),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".mira-rich-widget--frontmatter"),
      ).toBeNull(),
    );

    const sourceLines = [
      ...canvasElement.querySelectorAll<HTMLElement>(
        ".cm-line.cm-hmd-frontmatter",
      ),
    ];
    expect(sourceLines).toHaveLength(7);
    expect(getComputedStyle(sourceLines[0]!).fontFamily).toContain(
      "Source Code Pro",
    );

    const sourceFold = within(markdownEditor!).getAllByRole("button", {
      name: "Collapse section",
    })[0]!;
    await userEvent.click(sourceFold);
    const sourceExpand = within(markdownEditor!).getByRole("button", {
      name: "Expand section",
    });
    await expect(sourceExpand).toHaveAttribute("data-folded", "true");
    await userEvent.click(sourceExpand);
    const editor = activeStoryEditor(canvasElement);
    const headingOffset = editor.getValue().indexOf("# Welcome to Lapis Notes");
    expect(headingOffset).toBeGreaterThanOrEqual(0);
    editor.setCursor(editor.offsetToPos(headingOffset));
    editor.focus();
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".mira-rich-widget--frontmatter"),
      ).not.toBeNull(),
    );

    const readAction = canvas.getByRole("button", {
      name: /^Current view: editing\nClick to read/,
    });
    await userEvent.click(readAction);
    const readingSurface = await waitFor(() => {
      const surface = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="markdown-mira-preview"]',
      );
      expect(surface).not.toBeNull();
      return surface!;
    });
    const readingExpand = within(readingSurface).getByRole("button", {
      name: "Expand properties",
    });
    await expect(readingExpand).toHaveAttribute("aria-expanded", "false");

    const outline = within(readingSurface).getByRole("group", {
      name: "Document outline",
    });
    const portableHeading = readingSurface.querySelector<HTMLElement>(
      "#portable-authoring",
    );
    expect(portableHeading).not.toBeNull();
    await userEvent.click(
      within(outline).getByRole("button", {
        name: "Open outline and scroll to Portable authoring",
      }),
    );
    await waitFor(() => expect(portableHeading).toHaveFocus());

    const app = activeStoryApp(canvasElement);
    await app.configuration.updateConfigurationOption(
      "markdown.mira.features.outline-navigation",
      false,
    );
    await waitFor(() =>
      expect(
        within(readingSurface).queryByRole("group", {
          name: "Document outline",
        }),
      ).toBeNull(),
    );
    expect(app.commands.getCommand("markdown:open-outline")).toMatchObject({
      name: "Markdown: Open Outline",
    });
    await app.configuration.updateConfigurationOption(
      "markdown.mira.features.outline-navigation",
      true,
    );
    await waitFor(() =>
      expect(
        within(readingSurface).getByRole("group", {
          name: "Document outline",
        }),
      ).toBeVisible(),
    );

    await userEvent.click(
      canvas.getByRole("button", {
        name: /^Current view: preview\nClick to edit/,
      }),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector('.cm-editor[data-language="markdown"]'),
      ).not.toBeNull(),
    );
    await app.configuration.updateConfigurationOption(
      "markdown.mira.frontmatter.defaultOpen",
      true,
    );
    await userEvent.click(
      canvas.getByRole("button", {
        name: /^Current view: editing\nClick to read/,
      }),
    );
    const optedInReadingSurface = await waitFor(() => {
      const surface = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="markdown-mira-preview"]',
      );
      expect(surface).not.toBeNull();
      return surface!;
    });
    const optedInCollapse = within(optedInReadingSurface).getByRole("button", {
      name: "Collapse properties",
    });
    await expect(optedInCollapse).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(optedInCollapse);
    await expect(
      within(optedInReadingSurface).getByRole("button", {
        name: "Expand properties",
      }),
    ).toHaveAttribute("aria-expanded", "false");
  },
};

export const MarkdownAuthoring: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-markdown-authoring",
    "The real Lapis Markdown view composes Mira's complete portable authoring stack without duplicating the API editor's base CodeMirror layer.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/markdown-authoring-chromium.png",
  ),
  tags: ["visual-pending"],
  args: { scenario: "markdown-authoring" },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);

    const markdownEditor = await waitFor(
      () => {
        const editor = canvasElement.querySelector<HTMLElement>(
          '.cm-editor[data-language="markdown"]',
        );
        expect(editor).not.toBeNull();
        return editor!;
      },
      { timeout: 5_000 },
    );
    const editorContent = markdownEditor.querySelector<HTMLElement>(
      ":scope > .cm-scroller > .cm-content",
    );
    expect(editorContent).not.toBeNull();

    await step("compose complete portable authoring defaults", async () => {
      const editingSurface = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="markdown-editing-surface"]',
      );
      expect(editingSurface).not.toBeNull();
      expect(getComputedStyle(editingSurface!).borderTopWidth).toBe("0px");
      expect(getComputedStyle(editingSurface!).borderRadius).toBe("0px");
      await waitFor(() =>
        expect(
          canvasElement.querySelectorAll(".mira-block-handle").length,
        ).toBeGreaterThan(2),
      );
      expect(
        canvasElement.querySelector(".mira-block-toolbar-trigger"),
      ).toBeNull();
      expect(canvasElement.querySelector(".mira-editor__toolbar")).toBeNull();
      expect(canvasElement.querySelector(".cm-table-widget")).not.toBeNull();
      const foldGutter =
        markdownEditor.querySelector<HTMLElement>(".cm-foldGutter");
      expect(foldGutter).not.toBeNull();
      expect(getComputedStyle(foldGutter!).display).toBe("none");
      expect(
        within(markdownEditor).getAllByRole("button", {
          name: "Collapse section",
        }).length,
      ).toBeGreaterThan(0);
    });

    await step("complete a vault note", async () => {
      const editor = activeStoryEditor(canvasElement);
      expect(
        activeStoryApp(canvasElement).vault.getFileByPath(
          "Notes/Ideas.markdown",
        ),
      ).not.toBeNull();
      const wikiLink = editor.getValue().indexOf("[[Ideas]]");
      expect(wikiLink).toBeGreaterThanOrEqual(0);
      editor.setCursor(editor.offsetToPos(wikiLink + "[[Ide".length));
      editor.focus();
      editor.view.requestMeasure();
      await waitForBrowserFrame(canvasElement);
      await waitForBrowserFrame(canvasElement);
      expect(startCompletion(editor.view)).toBe(true);
      await waitFor(
        () => {
          if (completionStatus(editor.view.state) === null) {
            editor.focus();
            expect(startCompletion(editor.view)).toBe(true);
          }
          expect(
            currentCompletions(editor.view.state).map(
              (completion) => completion.label,
            ),
          ).toContain("Ideas.markdown");
        },
        { timeout: 15_000 },
      );
      const ideasCompletion = await waitFor(
        () =>
          within(canvasElement.ownerDocument.body).getByRole("option", {
            name: /Ideas\.markdown/,
          }),
        { timeout: 15_000 },
      );
      await fireEvent.mouseDown(ideasCompletion);
      await expect(editorContent!).toHaveTextContent("Ideas");
    });

    await step("open a Mira table cell editor", async () => {
      const editCell = within(markdownEditor).getAllByRole("button", {
        name: "Edit table cell",
      })[0]!;
      const cellWrapper = editCell.closest<HTMLElement>(".table-cell-wrapper");
      expect(cellWrapper).not.toBeNull();
      editCell.focus();
      const inlineCell = await waitFor(() => {
        const cell = markdownEditor.querySelector<HTMLElement>(
          ".cm-editor.mod-inline .cm-content[contenteditable='true']",
        );
        expect(cell).not.toBeNull();
        return cell!;
      });
      await waitFor(() => expect(inlineCell).toHaveFocus());
      activeStoryEditor(canvasElement).focus();
    });

    await step("insert a default slash command", async () => {
      moveStoryCursorToEnd(canvasElement);
      await userEvent.keyboard("{Enter}/");
      const slashMenu = await waitFor(() => {
        const menu =
          canvasElement.querySelector<HTMLElement>(".mira-slash-menu");
        expect(menu).not.toBeNull();
        return menu!;
      });
      await userEvent.click(
        within(slashMenu).getByRole("option", { name: /Heading 2/ }),
      );
      await waitFor(() => {
        expect(
          canvasElement.querySelector<HTMLElement>(".mira-slash-menu"),
        ).toBeNull();
        expect(
          getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
        ).not.toBe("none");
      });
      activeStoryEditor(canvasElement).replaceSelection(
        "Inserted by slash",
        "input",
      );
      await expect(editorContent!).toHaveTextContent("Inserted by slash");
    });

    await step("accept a pasted image attachment", async () => {
      moveStoryCursorToEnd(canvasElement);
      const editor = activeStoryEditor(canvasElement);
      editor.replaceSelection("\n", "input");
      await insertImageFiles(
        editor.view as unknown as Parameters<typeof insertImageFiles>[0],
        [
          new File([new Uint8Array([137, 80, 78, 71])], "pixel.png", {
            type: "image/png",
          }),
        ],
        {
          imageSyntax: "inline",
          imageUpload: async (file) => `attachments/${file.name}`,
        },
      );
      expect(editor.getValue()).toContain("![pixel](attachments/pixel.png)");
    });

    await step("format a real selection and smart-paste a URL", async () => {
      selectStoryText(canvasElement, "Select this authoring text");
      const selectionToolbar = await waitFor(() =>
        canvas.getByRole("toolbar", { name: "Text formatting" }),
      );
      await userEvent.click(
        within(selectionToolbar).getByRole("button", { name: "Bold" }),
      );
      expect(activeStoryEditor(canvasElement).getValue()).toContain(
        "**Select this authoring text**",
      );

      selectStoryText(canvasElement, "Inserted by slash");
      const transfer = new DataTransfer();
      transfer.setData("text/plain", "https://lapis.md/authoring");
      const paste = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: transfer,
      });
      activeStoryEditor(canvasElement).view.contentDOM.dispatchEvent(paste);
      expect(paste.defaultPrevented).toBe(true);
      expect(activeStoryEditor(canvasElement).getValue()).toContain(
        "[Inserted by slash](https://lapis.md/authoring)",
      );
    });

    await step("switch modes from the title bar and View menu", async () => {
      const readAction = await waitFor(() =>
        canvas.getByRole("button", {
          name: /^Current view: editing\nClick to read/,
        }),
      );
      await expect(readAction).toHaveAttribute(
        "title",
        "Current view: editing\nClick to read\n⌘+Click to open to the right",
      );
      expect(readAction.querySelector(".lucide-book-open")).not.toBeNull();
      const viewHeader = readAction.closest<HTMLElement>(
        '[data-ui-component="workspace-view-header"]',
      );
      expect(viewHeader).not.toBeNull();

      await userEvent.click(
        within(viewHeader!).getByRole("button", { name: "More options" }),
      );
      const page = within(canvasElement.ownerDocument.body);
      const paneMenu = page.getByRole("menu");
      const paneMenuItems = within(paneMenu).getAllByRole("menuitem");
      expect(
        paneMenuItems.slice(0, 4).map((item) => item.textContent?.trim()),
      ).toEqual([
        "Reading view",
        "Source mode",
        "Show editor toolbar",
        "Split right",
      ]);
      await expect(
        page.getByRole("menuitem", { name: "Reading view" }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Source mode" }),
      ).toBeVisible();
      await userEvent.click(
        page.getByRole("menuitem", { name: "Show editor toolbar" }),
      );
      await waitFor(() =>
        expect(
          activeStoryApp(canvasElement)
            .configuration.getConfiguration()
            .get("markdown.mira.editor.toolbar.enabled"),
        ).toBe(true),
      );
      const editorToolbar = await waitFor(() =>
        canvas.getByRole("toolbar", { name: "Markdown editor toolbar" }),
      );
      expect(
        (await persistedStoryConfiguration(canvasElement))[
          "markdown.mira.editor.toolbar.enabled"
        ],
      ).toBe(true);

      const viewOptions = within(editorToolbar).getByRole("button", {
        name: "View options",
      });
      await waitFor(() =>
        expect(getComputedStyle(viewOptions).pointerEvents).not.toBe("none"),
      );
      await userEvent.click(viewOptions);
      await userEvent.click(
        page.getByRole("menuitem", { name: "Indentation guides" }),
      );
      await waitFor(() =>
        expect(
          activeStoryApp(canvasElement)
            .configuration.getConfiguration()
            .get("editor.display.showIndentationGuides"),
        ).toBe(false),
      );
      await waitFor(() =>
        expect(getComputedStyle(viewOptions).pointerEvents).not.toBe("none"),
      );
      await userEvent.click(viewOptions);
      await userEvent.click(
        page.getByRole("menuitem", { name: "Use tabs for indentation" }),
      );
      await waitFor(() =>
        expect(
          activeStoryApp(canvasElement)
            .configuration.getConfiguration()
            .get("editor.behaviour.indentUsingTabs"),
        ).toBe(false),
      );
      await waitFor(() =>
        expect(getComputedStyle(viewOptions).pointerEvents).not.toBe("none"),
      );
      await userEvent.click(viewOptions);
      await userEvent.click(page.getByRole("menuitem", { name: "8 spaces" }));
      await waitFor(() =>
        expect(
          activeStoryApp(canvasElement)
            .configuration.getConfiguration()
            .get("editor.behaviour.indentVisualWidth"),
        ).toBe(8),
      );
      expect(await persistedStoryConfiguration(canvasElement)).toMatchObject({
        "markdown.mira.editor.toolbar.enabled": true,
        "editor.display.showIndentationGuides": false,
        "editor.behaviour.indentUsingTabs": false,
        "editor.behaviour.indentVisualWidth": 8,
      });
      await waitFor(() =>
        expect(getComputedStyle(readAction).pointerEvents).not.toBe("none"),
      );

      await userEvent.click(readAction);
      const editAction = await waitFor(() =>
        canvas.getByRole("button", {
          name: /^Current view: preview\nClick to edit/,
        }),
      );
      await expect(editAction).toHaveAttribute(
        "title",
        "Current view: preview\nClick to edit\n⌘+Click to open to the right",
      );
      expect(editAction.querySelector(".lucide-pencil")).not.toBeNull();
      const readingEditor = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="markdown-mira-preview"] .mira-editor',
      );
      expect(readingEditor).not.toBeNull();
      expect(getComputedStyle(readingEditor!).borderTopWidth).toBe("0px");
      expect(getComputedStyle(readingEditor!).borderRadius).toBe("0px");
      const readingSurface = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="markdown-mira-preview"]',
      );
      const readingScrollArea = readingSurface?.querySelector<HTMLElement>(
        ':scope > [data-ui-component="scroll-area"]',
      );
      const readingViewport = readingScrollArea?.querySelector<HTMLElement>(
        '[data-ui-part="scroll-area-viewport"]',
      );
      const readingPreview = readingSurface?.querySelector<HTMLElement>(
        ".mira-markdown-preview",
      );
      expect(readingScrollArea).not.toBeNull();
      expect(readingScrollArea).toHaveAttribute(
        "data-scroll-visibility",
        "scroll",
      );
      expect(readingViewport).not.toBeNull();
      expect(readingPreview).not.toBeNull();
      expect(getComputedStyle(readingPreview!).overflowY).toBe("visible");
      expect(readingViewport!.scrollHeight).toBeGreaterThan(
        readingViewport!.clientHeight,
      );
      readingViewport!.scrollTop = 48;
      await fireEvent.scroll(readingViewport!);
      expect(readingViewport!.scrollTop).toBeGreaterThan(0);

      await userEvent.click(
        within(viewHeader!).getByRole("button", { name: "More options" }),
      );
      await expect(
        page.getByRole("menuitem", { name: "Reading view" }),
      ).toBeVisible();
      expect(page.queryByRole("menuitem", { name: "Source mode" })).toBeNull();
      expect(
        page.queryByRole("menuitem", { name: "Show editor toolbar" }),
      ).toBeNull();
      await userEvent.keyboard("{Escape}");
      await waitFor(() =>
        expect(getComputedStyle(editAction).pointerEvents).not.toBe("none"),
      );

      await userEvent.click(editAction);
      await waitFor(() =>
        expect(
          canvasElement.querySelector('.cm-editor[data-language="markdown"]'),
        ).not.toBeNull(),
      );
    });
  },
};

export const MarkdownReadingOutline: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-markdown-reading-outline",
    "Reading mode keeps Mira's floating document outline centered in the visible pane and clear of the rendered Markdown body while the shared Scroll Area moves.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/markdown-reading-outline-chromium.png",
  ),
  tags: ["visual-pending"],
  args: { scenario: "markdown-authoring" },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);

    await userEvent.click(
      canvas.getByRole("button", {
        name: /^Current view: editing\nClick to read/,
      }),
    );
    const readingSurface = await waitFor(() => {
      const surface = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="markdown-mira-preview"]',
      );
      expect(surface).not.toBeNull();
      return surface!;
    });
    const readingViewport = readingSurface.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    );
    const readingPreview = readingSurface.querySelector<HTMLElement>(
      ".mira-markdown-preview",
    );
    const readingOutline = readingSurface.querySelector<HTMLElement>(
      ".mira-markdown-outline--floating",
    );
    const readingOutlineRail = readingOutline?.querySelector<HTMLElement>(
      ".mira-markdown-outline__rail",
    );
    const readingDocument = readingPreview?.querySelector<HTMLElement>(
      ".markdown-view__document",
    );
    expect(readingViewport).not.toBeNull();
    expect(readingPreview).not.toBeNull();
    expect(readingOutline).not.toBeNull();
    expect(readingOutlineRail).not.toBeNull();
    expect(readingDocument).not.toBeNull();

    await step("center the outline and clear the document body", async () => {
      expect(getComputedStyle(readingOutline!).position).toBe("fixed");
      const viewportRect = readingViewport!.getBoundingClientRect();
      const outlineRect = readingOutline!.getBoundingClientRect();
      const railRect = readingOutlineRail!.getBoundingClientRect();
      expect(
        Math.abs(
          outlineRect.top +
            outlineRect.height / 2 -
            (viewportRect.top + viewportRect.height / 2),
        ),
      ).toBeLessThan(1);
      expect(
        Number.parseFloat(
          getComputedStyle(readingViewport!).scrollPaddingBlockStart,
        ),
      ).toBeGreaterThanOrEqual(32);
      expect(
        Number.parseFloat(getComputedStyle(readingPreview!).paddingInlineEnd),
      ).toBeGreaterThanOrEqual(viewportRect.right - railRect.left);
      expect(readingDocument!.getBoundingClientRect().right).toBeLessThan(
        railRect.left - 12,
      );
    });

    await step(
      "keep the outline fixed and track the current Reading section",
      async () => {
        expect(readingViewport!.scrollHeight).toBeGreaterThan(
          readingViewport!.clientHeight,
        );
        const outlineTop = readingOutline!.getBoundingClientRect().top;
        readingViewport!.scrollTop =
          readingViewport!.scrollHeight - readingViewport!.clientHeight;
        await fireEvent.scroll(readingViewport!);
        expect(readingViewport!.scrollTop).toBeGreaterThan(0);
        expect(
          Math.abs(readingOutline!.getBoundingClientRect().top - outlineTop),
        ).toBeLessThan(1);

        const viewportTop = readingViewport!.getBoundingClientRect().top;
        const currentSection = [
          { id: "welcome-to-lapis-notes", label: "Welcome to Lapis Notes" },
          { id: "portable-authoring", label: "Portable authoring" },
          {
            id: "nested-authoring-details",
            label: "Nested authoring details",
          },
        ]
          .filter(({ id }) => {
            const heading = readingSurface.querySelector<HTMLElement>(`#${id}`);
            return Boolean(
              heading &&
                heading.getBoundingClientRect().top - viewportTop <= 96,
            );
          })
          .at(-1);
        expect(currentSection).toBeDefined();
        expect(currentSection?.id).not.toBe("welcome-to-lapis-notes");

        const activeMarker = within(readingOutline!).getByRole("button", {
          name: `Open outline and scroll to ${currentSection!.label}`,
        });
        await waitFor(() =>
          expect(activeMarker).toHaveAttribute("aria-current", "true"),
        );
        const activeStroke = activeMarker.querySelector<HTMLElement>(
          ".mira-markdown-outline__rail-line",
        );
        const inactiveStroke = within(readingOutline!)
          .getByRole("button", {
            name: "Open outline and scroll to Welcome to Lapis Notes",
          })
          .querySelector<HTMLElement>(".mira-markdown-outline__rail-line");
        expect(activeStroke).toHaveClass("is-active");
        expect(inactiveStroke).not.toHaveClass("is-active");
        expect(getComputedStyle(activeStroke!).backgroundColor).not.toBe(
          getComputedStyle(inactiveStroke!).backgroundColor,
        );

        await userEvent.hover(readingOutline!);
        const outlinePanel = within(readingOutline!).getByRole("navigation", {
          name: "Table of contents",
        });
        const activePanelItem = within(outlinePanel).getByRole("button", {
          name: currentSection!.label,
        });
        await expect(activePanelItem).toHaveAttribute("aria-current", "true");
        await expect(activePanelItem).toHaveClass("is-active");
        await userEvent.unhover(readingOutline!);
      },
    );

    await step(
      "navigate headings below the view header clearance",
      async () => {
        const target = readingSurface.querySelector<HTMLElement>(
          "#portable-authoring",
        );
        expect(target).not.toBeNull();
        await userEvent.click(
          within(readingOutline!).getByRole("button", {
            name: "Open outline and scroll to Portable authoring",
          }),
        );
        await waitFor(() => expect(target).toHaveFocus());
        await waitFor(
          () =>
            expect(
              target!.getBoundingClientRect().top -
                readingViewport!.getBoundingClientRect().top,
            ).toBeGreaterThanOrEqual(31),
          { timeout: 2_000 },
        );
      },
    );
  },
};

export const ExplorerMutations: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-explorer-mutations",
    "The design-core Explorer creates, fully renames, moves, and locally trashes files through the API vault.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/explorer-mutations-chromium.png",
  ),
  args: { scenario: "explorer-mutations" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    const explorer = within(canvas.getByTestId("lapis-editor-explorer"));

    await userEvent.click(canvas.getByRole("button", { name: "Create File" }));
    const untitled = await explorer.findByRole("button", {
      name: "Untitled.md",
    });
    await fireEvent.keyDown(untitled, { key: "Enter", code: "Enter" });
    const rename = explorer.getByRole("textbox", { name: "Rename..." });
    await fireEvent.input(rename, { target: { value: "Draft.md" } });
    await fireEvent.blur(rename);
    await waitFor(() =>
      expect(canvas.getByTestId("lapis-editor-vault-paths")).toHaveTextContent(
        "Draft.md",
      ),
    );
    const draft = await explorer.findByRole("button", { name: "Draft.md" });

    const projects = explorer.getByRole("button", { name: "Projects" });
    const transfer = new DataTransfer();
    await fireEvent.dragStart(draft, { dataTransfer: transfer });
    await fireEvent.dragOver(projects, { dataTransfer: transfer });
    await fireEvent.drop(projects, { dataTransfer: transfer });
    await waitFor(() =>
      expect(canvas.getByTestId("lapis-editor-vault-paths")).toHaveTextContent(
        "Projects/Draft.md",
      ),
    );
    const moved = explorer.getByRole("button", { name: "Draft.md" });

    await fireEvent.contextMenu(moved);
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("menuitem", {
        name: "Delete",
      }),
    );
    await waitFor(() =>
      expect(explorer.queryByRole("button", { name: "Draft.md" })).toBeNull(),
    );
    await userEvent.click(
      explorer.getByRole("button", { name: "README.text" }),
    );
    await waitFor(() =>
      expect(canvas.getByTestId("lapis-editor-active-view")).toHaveTextContent(
        "text",
      ),
    );
    await waitFor(() =>
      expect(activeStoryEditor(canvasElement).getValue()).toContain(
        "Files, editors, and settings all run inside Storybook.",
      ),
    );
  },
};

export const EditorSettings: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-editor-settings",
    "Live source-editor settings persist through API configuration, Markdown Lint seeds MD013 and file globs, and Editor associations lists the registered Markdown, Text, JSON, and YAML views.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/editor-settings-chromium.png",
  ),
  tags: ["visual-pending"],
  args: { scenario: "editor-settings" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await waitFor(() =>
      expect(canvasElement.querySelector(".cm-lineNumbers")).not.toBeNull(),
    );
    await waitFor(() => {
      const title = canvasElement.querySelector(".cm-editor-inline-title");
      expect(title).not.toBeNull();
      expect(title).toHaveTextContent("Welcome.md");
    });
    const header = canvasElement.querySelector(
      '[data-ui-component="workspace-view-header"]',
    );
    await expect(header).not.toBeNull();
    await expect(
      within(header as HTMLElement).getByRole("button", { name: "Notes" }),
    ).toBeVisible();
    await fireEvent.click(
      within(header as HTMLElement).getByRole("button", {
        name: "Rename Welcome.md",
      }),
    );
    const titleEditor = await within(header as HTMLElement).findByRole(
      "textbox",
      { name: "Rename Welcome.md" },
      { timeout: 5_000 },
    );
    await expect(
      within(header as HTMLElement).getByRole("button", { name: "Notes" }),
    ).toBeVisible();
    titleEditor.textContent = "Renamed.md";
    await fireEvent.input(titleEditor);
    await fireEvent.keyDown(titleEditor, { key: "Enter", code: "Enter" });
    await waitFor(() => {
      const paths =
        canvas.getByTestId("lapis-editor-vault-paths").textContent ?? "";
      expect(paths.split("|")).toContain("Notes/Renamed.md");
      expect(paths.split("|")).not.toContain("Notes/Welcome.md");
    });
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".cm-editor-inline-title"),
      ).toHaveTextContent("Renamed.md"),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Open settings" }),
    );
    const dialog = canvas.getByRole("dialog", { name: "Settings" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Editor" }),
    );
    const lineNumbers = within(dialog).getByRole("switch", {
      name: "Show line numbers",
    });
    const focusNewTabs = within(dialog).getByRole("switch", {
      name: "Always focus new tabs",
    });
    await expect(focusNewTabs).toHaveAttribute("data-state", "unchecked");
    for (const description of [
      "Switch to newly created tabs immediately. Turn this off to create them in the background.",
      "Show line numbers in the editor gutter.",
      "Show the fold gutter for language-defined ranges such as headings and objects.",
      "Wrap long source lines to the editor width.",
      "Show vertical guides for indented source.",
      "Use the browser spellchecker in source editors.",
      "Turn this off to insert spaces when indenting.",
      "Number of columns used by a tab or space indent.",
    ]) {
      await expect(within(dialog).getByText(description)).toBeVisible();
    }
    const renderer = getWorkspaceHostBinding(
      activeStoryApp(canvasElement).workspace,
    ).controller.renderer;
    expect(renderer.activateNewTabs).toBe(false);
    await userEvent.click(focusNewTabs);
    await waitFor(() => expect(renderer.activateNewTabs).toBe(true));
    await waitFor(async () =>
      expect(
        (await persistedStoryConfiguration(canvasElement))[
          "editor.alwaysFocusNewTabs"
        ],
      ).toBe(true),
    );
    await userEvent.click(focusNewTabs);
    await waitFor(() => expect(renderer.activateNewTabs).toBe(false));
    await expect(lineNumbers).toHaveAttribute("data-state", "checked");
    await userEvent.click(lineNumbers);
    await expect(lineNumbers).toHaveAttribute("data-state", "unchecked");
    await waitFor(() =>
      expect(canvasElement.querySelector(".cm-lineNumbers")).toBeNull(),
    );
    const indentWidth = within(dialog).getByRole("slider", {
      name: "Indent width",
    });
    indentWidth.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(within(dialog).getByText("6")).toBeVisible();

    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Markdown$/ }),
    );
    await expect(
      within(dialog).getByRole("heading", { name: /^Markdown$/ }),
    ).toBeVisible();
    await expect(
      within(dialog).getByRole("heading", { name: "Features" }),
    ).toBeVisible();
    const topToolbar = within(dialog).getByRole("switch", {
      name: "Show editor toolbar",
    });
    const selectionToolbar = within(dialog).getByRole("switch", {
      name: "Show selection toolbar",
    });
    const blockToolbar = within(dialog).getByRole("switch", {
      name: "Show block type toolbar",
    });
    const doodleDividers = within(dialog).getByRole("switch", {
      name: "Doodle Dividers",
    });
    const frontmatterDefaultOpen = within(dialog).getByRole("switch", {
      name: "Expand Properties by default",
    });
    const outlineNavigation = within(dialog).getByRole("switch", {
      name: "Outline navigation",
    });
    await expect(topToolbar).toHaveAttribute("data-state", "unchecked");
    await expect(selectionToolbar).toHaveAttribute("data-state", "checked");
    await expect(blockToolbar).toHaveAttribute("data-state", "unchecked");
    await expect(doodleDividers).toHaveAttribute("data-state", "unchecked");
    await expect(frontmatterDefaultOpen).toHaveAttribute(
      "data-state",
      "unchecked",
    );
    await expect(outlineNavigation).toHaveAttribute("data-state", "checked");

    await userEvent.click(frontmatterDefaultOpen);
    await userEvent.click(outlineNavigation);
    await waitFor(async () => {
      const persisted = await persistedStoryConfiguration(canvasElement);
      expect(persisted["markdown.mira.frontmatter.defaultOpen"]).toBe(true);
      expect(persisted["markdown.mira.features.outline-navigation"]).toBe(
        false,
      );
      expect("markdown.mira.features" in persisted).toBe(false);
    });

    const slashCommands = within(dialog).getByRole("switch", {
      name: "Slash commands",
    });
    await expect(slashCommands).toHaveAttribute("data-state", "checked");
    await userEvent.click(slashCommands);
    await waitFor(async () => {
      const persisted = await persistedStoryConfiguration(canvasElement);
      expect(persisted["markdown.mira.features.slash-commands"]).toBe(false);
      expect("markdown.mira.features" in persisted).toBe(false);
    });
    await userEvent.click(slashCommands);
    await waitFor(async () =>
      expect(
        (await persistedStoryConfiguration(canvasElement))[
          "markdown.mira.features.slash-commands"
        ],
      ).toBe(true),
    );

    await userEvent.click(topToolbar);
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".mira-editor__toolbar"),
      ).not.toBeNull(),
    );
    await userEvent.click(doodleDividers);
    const editor = activeStoryEditor(canvasElement);
    const dividerEnd = editor
      .getValue()
      .indexOf("---", editor.getValue().indexOf("<!-- mira-divider:"));
    expect(dividerEnd).toBeGreaterThan(0);
    editor.setCursor(editor.offsetToPos(dividerEnd + 4));
    editor.focus();
    await waitFor(() =>
      expect(
        canvasElement.querySelector("svg.mira-doodle-divider"),
      ).not.toBeNull(),
    );

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Markdown Lint" }),
    );
    await expect(
      within(dialog).getByRole("heading", { name: "Markdown Lint" }),
    ).toBeVisible();
    const disabledRules = within(dialog).getByRole("combobox", {
      name: "Disabled rules",
    });
    await expect(disabledRules).toHaveTextContent("MD013");
    await expect(
      disabledRules.closest(
        "[data-ui-component='workspace-setting-multiselect']",
      ),
    ).not.toBeNull();
    await expect(
      within(dialog).getByRole("textbox", { name: "Include globs item 1" }),
    ).toHaveValue("**/*.{md,markdown,mdown,mkd,mdwn,mdtxt,mdtext}");
    await expect(
      within(dialog).getByRole("textbox", { name: "Exclude globs item 1" }),
    ).toHaveValue("**/node_modules/**");
    await userEvent.click(disabledRules);
    const rulesPopover = await waitFor(() => {
      const content = canvasElement.ownerDocument.querySelector<HTMLElement>(
        '[data-ui-component="workspace-setting-multiselect"][data-ui-part="content"]',
      );
      expect(content).not.toBeNull();
      expect(
        content!.querySelector(
          '[data-ui-component="command-view"][data-ui-part="root"]',
        ),
      ).not.toBeNull();
      return content!;
    });
    await userEvent.type(
      within(rulesPopover).getByPlaceholderText("Search options..."),
      "MD041",
    );
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("option", {
        name: /MD041/,
      }),
    );
    await waitFor(async () =>
      expect(
        (await persistedStoryConfiguration(canvasElement))[
          "markdown-lint.disabledRules"
        ],
      ).toEqual(expect.arrayContaining(["MD013", "MD041"])),
    );
    await userEvent.keyboard("{Escape}");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Explorer" }),
    );
    await expect(
      within(dialog).getByRole("heading", { name: "Explorer" }),
    ).toBeVisible();
    await expect(
      within(dialog).getByRole("textbox", {
        name: "File palette extensions item 7",
      }),
    ).toHaveValue("yaml");
    await expect(
      within(dialog).getByRole("textbox", {
        name: "File palette extensions item 8",
      }),
    ).toHaveValue("yml");

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Workspace" }),
    );
    await expect(within(dialog).getByText("Editor associations")).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Add association" }),
    );
    const association = within(dialog).getByRole("combobox", {
      name: "Associated editor view",
    });
    await expect(association).toBeVisible();
    await userEvent.click(association);
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.getByRole("option", { name: "Markdown" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Text" })).toBeVisible();
    await expect(page.getByRole("option", { name: "JSON" })).toBeVisible();
    await expect(page.getByRole("option", { name: "YAML" })).toBeVisible();
  },
};

export const LoadingPlugins: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-loading-plugins",
    "The real startup sequence pauses on required core-plugin loading for deterministic checklist coverage.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/loading-plugins-chromium.png",
  ),
  args: { scenario: "loading-plugins" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("lapis-editor-status")).toHaveTextContent(
        "loading-plugins",
      ),
    );
    await expect(
      canvasElement.querySelector('[data-ui-part="message"]'),
    ).toHaveTextContent("Load required core plugins");
    await expect(canvas.getByText("Step 3 of 4")).toBeVisible();
  },
};

export const StartupFailure: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-startup-failure",
    "A failed required plugin produces an accessible bounded failure state; retry disposes the partial app and boots a clean deterministic seed.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/startup-failure-chromium.png",
  ),
  args: { scenario: "startup-failure" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(canvas.getByRole("alert")).toHaveTextContent(
          "Lapis Notes could not start",
        ),
      { timeout: 5_000 },
    );
    await expect(
      canvas.getAllByText("Load required core plugins")[0],
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Retry startup" }),
    );
    await waitForReady(canvas);
    await expect(canvas.getByTestId("lapis-editor-attempt")).toHaveTextContent(
      "2",
    );
    await fireEvent.click(canvas.getByTestId("lapis-editor-replay-failure"));
    await waitFor(() =>
      expect(canvas.getByRole("alert")).toHaveTextContent(
        "Lapis Notes could not start",
      ),
    );
    await expect(canvas.getByTestId("lapis-editor-attempt")).toHaveTextContent(
      "3",
    );
  },
};

export const ExplorerOpeningVault: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-explorer-opening-vault",
    "The Explorer keeps the Lapis opening-vault presentation available while its tree adapter is loading.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/explorer-opening-vault-chromium.png",
  ),
  args: { scenario: "explorer-opening-vault" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expect(canvas.getByText("Opening vault")).toBeVisible();
  },
};
