import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { startCompletion } from "@codemirror/autocomplete";
import { insertImageFiles } from "@lapismd/mira/core";
import type { App, Editor } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { findWorkspaceTab } from "@lapismd/design-core/workspace/core";
import LapisEditorDemo from "./LapisEditorDemo.svelte";
import { workspaceStoryMeta } from "../_shared";

const meta = {
  title: "Workspace/Lapis Editor Demo",
  component: LapisEditorDemo,
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
    { timeout: 5_000 },
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
    [...canvasElement.querySelectorAll<HTMLElement>(".cm-line")].find(
      (line) => line.textContent?.includes(text),
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

async function persistedStoryConfiguration(
  canvasElement: HTMLElement,
): Promise<
  Record<string, unknown>
> {
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

    await userEvent.click(canvas.getByRole("button", { name: "Go to file" }));
    const palette = canvas.getByRole("dialog", { name: "Command Palette" });
    await expect(palette).toBeVisible();
    const search = within(palette).getByRole("textbox", {
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
    let rootLeavesBefore = 0;
    runtimeApp.workspace.iterateRootLeaves(() => {
      rootLeavesBefore += 1;
    });
    await fireEvent.click(ideasFile, { ctrlKey: true });
    await waitFor(() => {
      let rootLeavesAfter = 0;
      runtimeApp.workspace.iterateRootLeaves(() => {
        rootLeavesAfter += 1;
      });
      expect(rootLeavesAfter).toBe(rootLeavesBefore + 1);
      expect(runtimeApp.workspace.activeEditor?.file?.path).toBe(
        "Notes/Ideas.markdown",
      );
    });
    const modifierOpenedLeaf = runtimeApp.workspace.activeLeaf;
    expect(modifierOpenedLeaf).not.toBeNull();
    await waitFor(() => {
      expect(
        findWorkspaceTab(
          getWorkspaceHostBinding(runtimeApp.workspace).controller.renderer
            .layout,
          modifierOpenedLeaf!.id,
        )?.tab.title,
      ).toBe("Ideas.markdown");
    });
    modifierOpenedLeaf!.detach();
    await waitFor(() =>
      expect(
        canvas.getByRole("heading", { name: "No file is open" }),
      ).toBeVisible(),
    );

    await userEvent.click(ideasFile);

    const editorBody = await waitFor(() => {
      const body = canvasElement.querySelector<HTMLElement>(
        ".cm-editor-content",
      );
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
      const portals = storyDocument.querySelectorAll<HTMLElement>(
        ".mira-block-toolbar-portal",
      );
      expect(portals).toHaveLength(1);
      return portals[0]!;
    });
    expect(getComputedStyle(blockToolbarPortal).position).toBe("fixed");
    expect(blockToolbarPortal.getBoundingClientRect().height).toBe(0);

    await waitFor(
      () => {
        expect(
          runtimeApp.workspace.diagnostics
            .snapshot()
            .entries.map((entry) => entry.diagnostic.code)
            .sort(),
        ).toEqual(["MD018", "MD025"]);
        expect(
          canvasElement.querySelectorAll(".cm-lint-marker-warning"),
        ).toHaveLength(2);
        expect(
          editorLineContaining(canvasElement, "missing heading space")
            ?.querySelector(".cm-lintRange-warning"),
        ).not.toBeNull();
        expect(
          runtimeApp.workspace.diagnostics.snapshot().entries,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              diagnostic: expect.objectContaining({
                source: "markdownlint",
                code: "MD018",
              }),
            }),
          ]),
        );
      },
      { timeout: 8_000 },
    );

    const lintMarker = await waitFor(() => {
      const marker = canvasElement.querySelector<HTMLElement>(
        ".cm-lint-marker-warning",
      );
      expect(marker).not.toBeNull();
      return marker!;
    });
    const markerStyle = getComputedStyle(lintMarker);
    expect(markerStyle.maskImage || markerStyle.webkitMaskImage).not.toBe(
      "none",
    );
    const gutterElement = lintMarker.closest<HTMLElement>(".cm-gutterElement");
    expect(gutterElement).not.toBeNull();
    expect(getComputedStyle(gutterElement!).display).toContain("flex");
    expect(getComputedStyle(gutterElement!).justifyContent).toBe("center");

    await getWorkspaceHostBinding(runtimeApp.workspace).controller.commands.execute(
      "app-shell:show-problems",
    );
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
      findWorkspaceTab(
        workspaceController.renderer.layout,
        problemsTabId!,
      )?.tab.title,
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
    await expect(activeStoryEditor(canvasElement).getCursor("from")).toMatchObject({
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
      name: "Fix markdownlint MD018",
    });
    await userEvent.click(fix);

    await waitFor(
      () => {
        expect(
          runtimeApp.workspace.diagnostics.snapshot().entries.some(
            (entry) => entry.diagnostic.code === "MD018",
          ),
        ).toBe(false);
        expect(canvas.getByLabelText("Problems, 1 problem")).toBeVisible();
      },
      { timeout: 5_000 },
    );
    await waitFor(() => {
      expect(editor.getValue()).toContain("## missing heading space");
      expect(
        editorLineContaining(canvasElement, "missing heading space")
          ?.querySelector(".cm-lintRange-warning"),
      ).toBeNull();
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
    await waitFor(
      () => {
        expect(
          runtimeApp.workspace.diagnostics
            .snapshot()
            .entries.map((entry) => entry.diagnostic.code)
            .sort(),
        ).toEqual(["MD018", "MD025"]);
        expect(
          canvasElement.querySelectorAll(".cm-lint-marker-warning"),
        ).toHaveLength(2);
        expect(
          editorLineContaining(canvasElement, "missing heading space")
            ?.querySelector(".cm-lintRange-warning"),
        ).not.toBeNull();
        expect(
          problemsCanvas.getByRole("button", {
            name: /No space after hash on atx style heading/i,
          }),
        ).toBeVisible();
        expect(canvas.getByLabelText("Problems, 2 problems")).toBeVisible();
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
    await userEvent.keyboard("Synced from the left pane.");
    await expect(editors[0]).toHaveTextContent("Synced from the left pane.");
    await waitFor(() =>
      expect(editors[1]).toHaveTextContent("Synced from the left pane."),
    );
    await waitFor(
      () => {
        expect(
          canvas.getByTestId("lapis-editor-target-write-count"),
        ).toHaveTextContent("1");
        expect(
          canvas.getByTestId("lapis-editor-target-contents"),
        ).toHaveTextContent("Synced from the left pane.");
      },
      { timeout: 2_000 },
    );

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
    jsonEditor!.focus();
    await userEvent.keyboard("Independent JSON pane");
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

    const heading = await waitFor(
      () => {
        const element = canvasElement.querySelector<HTMLElement>(".cm-heading");
        expect(element).not.toBeNull();
        return element!;
      },
      { timeout: 5_000 },
    );
    await userEvent.click(heading);

    const frontmatterWidget = await waitFor(
      () => {
        const widget = canvasElement.querySelector<HTMLElement>(
          ".mira-rich-widget--frontmatter",
        );
        expect(widget).not.toBeNull();
        return widget!;
      },
      { timeout: 5_000 },
    );
    const trigger = within(frontmatterWidget).getByRole("button", {
      name: "Collapse properties",
    });
    const nestedSizer = frontmatterWidget.querySelector<HTMLElement>(
      ".mira-markdown-preview > .cm-sizer",
    );
    const editorLine = [
      ...canvasElement.querySelectorAll<HTMLElement>(".cm-line"),
    ].find((line) => line.getClientRects().length > 0);
    expect(nestedSizer).not.toBeNull();
    expect(editorLine).not.toBeNull();
    expect(getComputedStyle(nestedSizer!).paddingInlineStart).toBe("0px");
    expect(
      Math.abs(
        frontmatterWidget.getBoundingClientRect().left -
          editorLine!.getBoundingClientRect().left,
      ),
    ).toBeLessThan(1);

    await userEvent.click(trigger);
    await expect(
      within(frontmatterWidget).getByRole("button", {
        name: "Expand properties",
      }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(
      frontmatterWidget.querySelector(".md-frontmatter__content"),
    ).toBeNull();

    await userEvent.click(
      within(frontmatterWidget).getByRole("button", {
        name: "Expand properties",
      }),
    );
    await expect(
      within(frontmatterWidget).getByRole("button", {
        name: "Collapse properties",
      }),
    ).toHaveAttribute("aria-expanded", "true");

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
    await userEvent.click(
      canvasElement.querySelector<HTMLElement>(".cm-heading")!,
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".mira-rich-widget--frontmatter"),
      ).not.toBeNull(),
    );
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

    await step("edit a Mira table cell", async () => {
      await userEvent.click(
        within(markdownEditor).getAllByRole("button", {
          name: "Edit table cell",
        })[0]!,
      );
      const inlineCell = await waitFor(() => {
        const cell = markdownEditor.querySelector<HTMLElement>(
          ".cm-editor.mod-inline .cm-content",
        );
        expect(cell).not.toBeNull();
        return cell!;
      });
      await userEvent.type(inlineCell, "!");
      await expect(inlineCell).toHaveTextContent("!");
    });

    await step("complete a vault note", async () => {
      moveStoryCursorToEnd(canvasElement);
      const editor = activeStoryEditor(canvasElement);
      editor.replaceSelection("\n[[Ide", "input");
      expect(startCompletion(editor.view)).toBe(true);
      const autocomplete = await waitFor(() => {
        const tooltip = markdownEditor.ownerDocument.querySelector<HTMLElement>(
          ".cm-tooltip-autocomplete",
        );
        expect(tooltip).not.toBeNull();
        return tooltip!;
      });
      await expect(autocomplete).toHaveTextContent("Ideas");
      const option = [
        ...autocomplete.querySelectorAll<HTMLElement>('[role="option"]'),
      ].find((candidate) => candidate.textContent?.includes("Ideas"));
      expect(option).not.toBeUndefined();
      await userEvent.click(option!);
      await expect(editorContent!).toHaveTextContent("Ideas");
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
      await userEvent.keyboard("Inserted by slash");
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
          activeStoryApp(canvasElement).configuration.getConfiguration().get(
            "markdown.mira.editor.toolbar.enabled",
          ),
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
          activeStoryApp(canvasElement).configuration.getConfiguration().get(
            "editor.display.showIndentationGuides",
          ),
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
          activeStoryApp(canvasElement).configuration.getConfiguration().get(
            "editor.behaviour.indentUsingTabs",
          ),
        ).toBe(false),
      );
      await waitFor(() =>
        expect(getComputedStyle(viewOptions).pointerEvents).not.toBe("none"),
      );
      await userEvent.click(viewOptions);
      await userEvent.click(page.getByRole("menuitem", { name: "8 spaces" }));
      await waitFor(() =>
        expect(
          activeStoryApp(canvasElement).configuration.getConfiguration().get(
            "editor.behaviour.indentVisualWidth",
          ),
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
    await expect(visibleEditorContents(canvasElement)[0]).toHaveTextContent(
      "Files, editors, and settings all run inside Storybook.",
    );
  },
};

export const EditorSettings: Story = {
  ...workspaceStoryMeta(
    "workspace-lapis-editor-demo-editor-settings",
    "Live source-editor settings persist through API configuration, while Editor associations lists the registered Markdown, Text, and JSON views.",
    "/visual-baselines/stories/workspace/lapis-editor-demo/editor-settings-chromium.png",
  ),
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
    await userEvent.click(
      within(header as HTMLElement).getByRole("button", {
        name: "Rename Welcome.md",
      }),
    );
    const titleEditor = within(header as HTMLElement).getByRole("textbox", {
      name: "Rename Welcome.md",
    });
    await expect(
      within(header as HTMLElement).getByRole("button", { name: "Notes" }),
    ).toBeVisible();
    await userEvent.clear(titleEditor);
    await userEvent.type(titleEditor, "Renamed.md{Enter}");
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
    await expect(lineNumbers).toHaveAttribute("data-state", "checked");
    await userEvent.click(lineNumbers);
    await expect(lineNumbers).toHaveAttribute("data-state", "unchecked");
    await waitFor(() =>
      expect(canvasElement.querySelector(".cm-lineNumbers")).toBeNull(),
    );
    await fireEvent.input(
      within(dialog).getByRole("slider", { name: "Indent width" }),
      { target: { value: "6" } },
    );
    await expect(within(dialog).getByText("6")).toBeVisible();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Markdown" }),
    );
    await expect(
      within(dialog).getByRole("heading", { name: "Markdown" }),
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
    await expect(topToolbar).toHaveAttribute("data-state", "unchecked");
    await expect(selectionToolbar).toHaveAttribute("data-state", "checked");
    await expect(blockToolbar).toHaveAttribute("data-state", "unchecked");
    await expect(doodleDividers).toHaveAttribute("data-state", "unchecked");

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
