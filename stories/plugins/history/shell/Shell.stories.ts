import type { App } from "@lapis-notes/api";
import { HistoryCompareViewType, HistoryViewType } from "@lapis-notes/history";
import {
  HISTORY_SHELL_PATH,
  HISTORY_SHELL_SECTIONS,
} from "./create-shell-demo";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../../workspace/docs-parameters";
import { historyShellExampleSource } from "./Shell.example-sources";
import HistoryShellDemo from "./ShellDemo.svelte";

const meta = {
  title: "Plugins/History/Shell",
  component: HistoryShellDemo,
  tags: ["visual-pending", "test"],
  parameters: {
    ...workspaceCatalogParameters("plugins-history-shell-desktop"),
    layout: "fullscreen",
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      description: {
        component:
          "A real Lapis App restores Explorer on the left, a multi-section Welcome compare in the main area, History in the right sidebar, and retained Search on that collapsed right dock.",
      },
      source: {
        code: historyShellExampleSource,
        language: "svelte",
        type: "code",
      },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/history/shell/desktop-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
} satisfies Meta<typeof HistoryShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="history-shell-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The History shell story has no active Lapis app");
  }
  return root.__lapisApp;
}

export const Desktop: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Explorer stays visible on the left, the first-to-latest Welcome compare shows section-level diffs, and History plus indexed Search start and finish collapsed on the right.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      () => {
        expect(canvas.getByTestId("history-shell-status")).toHaveTextContent(
          "ready",
        );
        expect(
          canvas
            .getByTestId("history-shell-demo")
            .querySelector('[data-app-shell-ready="true"]'),
        ).toBeTruthy();
      },
      { timeout: 20_000 },
    );

    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("history")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-file-explorer")).toBe(true);
    expect(app.plugins.isPluginEnabled("search")).toBe(true);

    const demo = canvas.getByTestId("history-shell-demo");
    const shell = demo.querySelector<HTMLElement>(
      '[data-ui-component="lapis-workspace-shell"]',
    );
    expect(shell).not.toBeNull();
    expect(shell!.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      demo.getBoundingClientRect().height - 2,
    );

    const welcome = app.workspace.getLeavesOfType("markdown")[0];
    expect(welcome?.view.getState()).toMatchObject({
      file: HISTORY_SHELL_PATH,
    });
    const compareLeaf = app.workspace.getLeavesOfType(HistoryCompareViewType)[0];
    expect(compareLeaf).toBeDefined();
    expect(app.workspace.activeLeaf).toBe(compareLeaf);
    const compare = await waitFor(() => {
      const panel = canvasElement.querySelector<HTMLElement>(
        '[data-testid="history-compare-panel"]',
      );
      expect(panel).toHaveAttribute("data-compare-mode", "selected");
      expect(
        panel?.querySelector('[data-ui-component="file-diff"]'),
      ).not.toBeNull();
      return panel!;
    });
    const diffText = compare.textContent ?? "";
    for (const section of HISTORY_SHELL_SECTIONS) {
      expect(diffText).toContain(`## ${section}`);
    }
    expect(app.workspace.getLeavesOfType(HistoryViewType)).toHaveLength(1);
    expect(app.workspace.getLeavesOfType("search")).toHaveLength(1);
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

    await userEvent.click(openRightSidebar);
    const historyPanel = await waitFor(() => {
      expect(app.workspace.rightSplit.collapsed).toBe(false);
      const panel = canvasElement.querySelector<HTMLElement>(
        '[data-testid="history-panel"]',
      );
      expect(panel).toBeVisible();
      return panel!;
    });
    expect(
      within(historyPanel).getByRole("list", { name: "File history" }),
    ).toBeVisible();
    expect(
      within(historyPanel).getAllByRole("button").length,
    ).toBeGreaterThanOrEqual(HISTORY_SHELL_SECTIONS.length);

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
    ...workspaceCatalogParameters("plugins-history-shell-mobile"),
    docs: {
      description: {
        story:
          "The persisted Explorer, multi-section Welcome compare, History, and collapsed Search layout rendered through the mobile workspace shell.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/history/shell/mobile-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("history-shell-status")).toHaveTextContent(
        "ready",
      ),
    );
    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("history")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-file-explorer")).toBe(true);
    expect(app.plugins.isPluginEnabled("search")).toBe(true);
    expect(app.workspace.rightSplit.collapsed).toBe(true);
    await expect(
      canvas.getByRole("button", { name: /Open tabs/u }),
    ).toBeVisible();
  },
};
