import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { startCompletion } from "@codemirror/autocomplete";
import { insertImageFiles } from "@lapismd/mira/core";
import type { Editor } from "@lapis-notes/api";
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

function activeStoryEditor(): Editor {
  const runtimeApp = (globalThis as typeof globalThis & { app?: unknown })
    .app as
    | { workspace?: { activeLeaf?: { view?: { editor?: Editor } } } }
    | undefined;
  const editor = runtimeApp?.workspace?.activeLeaf?.view?.editor;
  if (!editor) throw new Error("The active story leaf has no Lapis editor");
  return editor;
}

function moveStoryCursorToEnd(): void {
  const editor = activeStoryEditor();
  const line = editor.lastLine();
  editor.setCursor({ line, ch: editor.getLine(line).length });
  editor.focus();
}

function selectStoryText(text: string): void {
  const editor = activeStoryEditor();
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
      const foldGutter = markdownEditor.querySelector<HTMLElement>(
        ".cm-foldGutter",
      );
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
      moveStoryCursorToEnd();
      const editor = activeStoryEditor();
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
      moveStoryCursorToEnd();
      await userEvent.keyboard("{Enter}/");
      const slashMenu = await waitFor(() => {
        const menu = canvasElement.querySelector<HTMLElement>(
          ".mira-slash-menu",
        );
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
      moveStoryCursorToEnd();
      const editor = activeStoryEditor();
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
      selectStoryText("Select this authoring text");
      const selectionToolbar = await waitFor(() =>
        canvas.getByRole("toolbar", { name: "Text formatting" }),
      );
      await userEvent.click(
        within(selectionToolbar).getByRole("button", { name: "Bold" }),
      );
      expect(activeStoryEditor().getValue()).toContain(
        "**Select this authoring text**",
      );

      selectStoryText("Inserted by slash");
      const transfer = new DataTransfer();
      transfer.setData("text/plain", "https://lapis.md/authoring");
      const paste = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: transfer,
      });
      activeStoryEditor().view.contentDOM.dispatchEvent(paste);
      expect(paste.defaultPrevented).toBe(true);
      expect(activeStoryEditor().getValue()).toContain(
        "[Inserted by slash](https://lapis.md/authoring)",
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

    await userEvent.click(topToolbar);
    await waitFor(() =>
      expect(canvasElement.querySelector(".mira-editor__toolbar")).not.toBeNull(),
    );
    await userEvent.click(doodleDividers);
    const editor = activeStoryEditor();
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
