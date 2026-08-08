import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
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
    ).toHaveTextContent(
      "JSON:.json,.data,*.json,*.data|Markdown:.md,.markdown,*.md,*.markdown|Text:.txt,.text,*.txt,*.text",
    );

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

    const explorer = within(canvas.getByTestId("lapis-editor-explorer"));
    await userEvent.click(explorer.getByRole("button", { name: "Projects" }));
    await userEvent.click(
      explorer.getByRole("button", { name: "settings.json" }),
    );
    await waitFor(() =>
      expect(canvas.getByTestId("lapis-editor-active-view")).toHaveTextContent(
        "json",
      ),
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
