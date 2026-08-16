import type { App } from "@lapis-notes/api";
import { BasesViewType } from "@lapis-notes/bases";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../../workspace/docs-parameters";
import { basesEditorShellExampleSource } from "./Shell.example-sources";
import BasesEditorShellDemo from "./ShellDemo.svelte";
import {
  expectBasesColumnsAligned,
  expectBasesQueryEditorChrome,
  expectBasesTableFillsSurface,
} from "../bases-story-assertions";

const meta = {
  title: "Plugins/Bases/Shell",
  component: BasesEditorShellDemo,
  tags: ["visual-pending", "test"],
  parameters: {
    ...workspaceCatalogParameters("plugins-bases-shell-desktop"),
    layout: "fullscreen",
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      description: {
        component:
          "A real Lapis App restores File Explorer, collapsed indexed Search, and a Bases file into the desktop editor shell over the canonical project seed.",
      },
      source: {
        code: basesEditorShellExampleSource,
        language: "svelte",
        type: "code",
      },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/bases/shell/desktop-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
} satisfies Meta<typeof BasesEditorShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="bases-editor-shell-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The Bases editor shell story has no active Lapis app");
  }
  return root.__lapisApp;
}

export const Desktop: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The canonical sample vault is shown as a real editor composition: Explorer at left, the score-sorted Projects base in the center, and indexed Search retained in a right sidebar that starts and finishes collapsed.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => {
        expect(
          canvas.getByTestId("bases-editor-shell-status"),
        ).toHaveTextContent("ready");
        expect(
          canvas
            .getByTestId("bases-editor-shell-demo")
            .querySelector('[data-app-shell-ready="true"]'),
        ).toBeTruthy();
      },
      { timeout: 20_000 },
    );

    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("bases")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-file-explorer")).toBe(true);
    expect(app.plugins.isPluginEnabled("search")).toBe(true);

    const demo = canvas.getByTestId("bases-editor-shell-demo");
    const shell = demo.querySelector<HTMLElement>(
      '[data-ui-component="lapis-workspace-shell"]',
    );
    expect(shell).not.toBeNull();
    expect(shell!.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      demo.getBoundingClientRect().height - 2,
    );

    const basesLeaf = app.workspace.getLeavesOfType(BasesViewType)[0];
    expect(basesLeaf).toBeDefined();
    expect(basesLeaf?.view.getViewType()).toBe(BasesViewType);
    expect(basesLeaf?.view.getState()).toMatchObject({
      file: "Bases/Projects.base",
      mode: "preview",
    });
    expect(app.workspace.activeLeaf).toBe(basesLeaf);
    expect(app.workspace.rightSplit.collapsed).toBe(true);
    expect(canvas.queryByLabelText("Right sidebar")).toBeNull();
    const openRightSidebar = canvas.getByRole("button", {
      name: "Open right sidebar",
    });
    expect(openRightSidebar).toBeVisible();

    const explorer = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="workspace-explorer"]',
    );
    expect(explorer).toBeVisible();
    expect(
      within(explorer!).getByRole("list", { name: "Files" }),
    ).toBeVisible();

    await waitFor(
      () => {
        expect(
          canvasElement.querySelectorAll(
            '[data-ui-component="bases-table-view"] [data-ui-part="row"]',
          ),
        ).toHaveLength(3);
      },
      { timeout: 20_000 },
    );

    await userEvent.click(openRightSidebar);
    const searchPanel = await waitFor(() => {
      expect(app.workspace.rightSplit.collapsed).toBe(false);
      const panel = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="search-panel"]',
      );
      expect(panel).toBeVisible();
      return panel!;
    });
    expect(
      within(searchPanel).getByRole("searchbox", { name: "Search vault" }),
    ).toHaveTextContent("Aurora");

    await waitFor(
      () => {
        expect(
          canvasElement.querySelector('[data-ui-component="bases-table-view"]'),
        ).toBeVisible();
        expect(
          within(searchPanel).getByRole("tree", { name: "Search results" }),
        ).toBeVisible();
        expect(
          within(searchPanel).getByRole("treeitem", {
            name: /Projects\/Aurora\.md, .* matches/,
          }),
        ).toBeVisible();
      },
      { timeout: 20_000 },
    );

    const table = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="bases-table-view"]',
    );
    expect(table).toBeVisible();
    expectBasesTableFillsSurface(table!);
    expectBasesColumnsAligned(table!);

    await userEvent.click(canvas.getByRole("button", { name: "Filter" }));
    const advancedToggle = await waitFor(() => {
      const toggle = [
        ...canvasElement.ownerDocument.body.querySelectorAll<HTMLButtonElement>(
          '.filter-row button[data-tooltip="Simple filter"]',
        ),
      ].find((button) => button.getBoundingClientRect().height > 0);
      expect(toggle).toBeVisible();
      return toggle!;
    });
    await userEvent.click(advancedToggle);
    const queryEditor = await waitFor(() => {
      const editor = [
        ...canvasElement.ownerDocument.body.querySelectorAll<HTMLElement>(
          '[data-ui-component="bases-query-editor"]',
        ),
      ].find((element) => element.getBoundingClientRect().height > 0);
      expect(editor).toBeVisible();
      return editor!;
    });
    const queryContent = queryEditor.querySelector<HTMLElement>(".cm-content");
    expect(queryContent).toHaveTextContent('file.hasLink("")');
    await userEvent.click(queryContent!);
    await fireEvent.keyDown(queryContent!, {
      key: " ",
      code: "Space",
      ctrlKey: true,
    });
    const completionTooltip = await waitFor(() => {
      const tooltip =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          ".cm-tooltip.cm-tooltip-autocomplete",
        );
      expect(tooltip).toBeVisible();
      return tooltip!;
    });
    expectBasesQueryEditorChrome(queryEditor, completionTooltip);
    await fireEvent.keyDown(queryContent!, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(completionTooltip).not.toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Filter" }));

    await userEvent.click(
      canvas.getByRole("button", { name: "Close right sidebar" }),
    );
    await waitFor(() => {
      expect(app.workspace.rightSplit.collapsed).toBe(true);
      expect(canvas.queryByLabelText("Right sidebar")).toBeNull();
      expect(
        canvas.getByRole("button", { name: "Open right sidebar" }),
      ).toBeVisible();
    });
  },
};

export const Mobile: Story = {
  args: { displayMode: "mobile" },
  parameters: {
    ...workspaceCatalogParameters("plugins-bases-shell-mobile"),
    docs: {
      description: {
        story:
          "The persisted Explorer, Bases document, and collapsed Search layout rendered through the mobile workspace shell.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/bases/shell/mobile-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("bases-editor-shell-status")).toHaveTextContent(
        "ready",
      ),
    );
    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("bases")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-file-explorer")).toBe(true);
    expect(app.plugins.isPluginEnabled("search")).toBe(true);
    expect(app.workspace.rightSplit.collapsed).toBe(true);
    await expect(
      canvas.getByRole("button", { name: /Open tabs/u }),
    ).toBeVisible();
  },
};
