import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../workspace/docs-parameters";
import { aiWorkspaceExampleSource } from "./AiWorkspace.example-sources";
import AiWorkspaceDemo from "./AiWorkspaceDemo.svelte";

const meta = {
  title: "Plugins/AI/Workspace",
  component: AiWorkspaceDemo,
  tags: ["visual-pending", "test"],
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-workspace"),
    layout: "fullscreen",
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      description: {
        component:
          "A real Lapis App restores the AI chat view in the right sidebar and exposes the AI settings tab through the public settings dialog.",
      },
      source: {
        code: aiWorkspaceExampleSource,
        language: "svelte",
        type: "code",
      },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/workspace-right-sidebar-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
} satisfies Meta<typeof AiWorkspaceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="ai-workspace-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The AI workspace story has no active Lapis app");
  }
  return root.__lapisApp;
}

function assertStackedComposer(panel: HTMLElement): void {
  const layout = panel.querySelector(
    '[data-ui-component="ai-chat-layout"]',
  ) as HTMLElement | null;
  const dock = panel.querySelector(
    '[data-ui-part="composer-dock"]',
  ) as HTMLElement | null;
  const shell = panel.querySelector(
    '[data-ui-part="scroll-shell"]',
  ) as HTMLElement | null;
  const composerBody = panel.querySelector(
    '[data-ui-component="ai-chat-composer"] [data-ui-part="body"]',
  ) as HTMLElement | null;
  const empty = panel.querySelector(
    '[data-ui-part="empty-state"]',
  ) as HTMLElement | null;
  expect(layout).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(shell).not.toBeNull();
  expect(composerBody).not.toBeNull();
  expect(empty).not.toBeNull();
  expect(getComputedStyle(dock!).position).toBe("relative");
  expect(parseFloat(getComputedStyle(panel).paddingBottom)).toBe(0);
  const panelBox = panel.getBoundingClientRect();
  const layoutBox = layout!.getBoundingClientRect();
  const dockBox = dock!.getBoundingClientRect();
  const shellBox = shell!.getBoundingClientRect();
  const emptyBox = empty!.getBoundingClientRect();
  expect(layoutBox.height).toBeGreaterThan(panelBox.height * 0.8);
  expect(shellBox.height).toBeGreaterThanOrEqual(
    layoutBox.height - dockBox.height - 2,
  );
  expect(emptyBox.height).toBeGreaterThan(shellBox.height * 0.7);
  expect(shellBox.bottom).toBeLessThanOrEqual(dockBox.top + 2);
  expect(
    dockBox.bottom - composerBody!.getBoundingClientRect().bottom,
  ).toBeGreaterThanOrEqual(20);
  expect(dockBox.bottom).toBeLessThanOrEqual(panelBox.bottom + 2);
  expect(dockBox.top).toBeGreaterThan(panelBox.top + panelBox.height * 0.4);
}

function assertNoMessageOverlap(panel: HTMLElement): void {
  const dock = panel.querySelector(
    '[data-ui-part="composer-dock"]',
  ) as HTMLElement | null;
  const viewport = panel.querySelector(
    '[data-ui-part="scroll-area-viewport"]',
  ) as HTMLElement | null;
  const messages = panel.querySelectorAll(
    '[data-ui-component="ai-chat-message"]',
  );
  const last = messages[messages.length - 1] as HTMLElement | undefined;
  expect(dock).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(last).toBeDefined();
  expect(viewport!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    dock!.getBoundingClientRect().top + 2,
  );
  expect(getComputedStyle(viewport!).overflowY).toMatch(/auto|scroll/);
}

export const RightSidebarAndSettings: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The AI chat view is the only right-sidebar panel. The left sidebar starts collapsed. An empty transcript still pins the composer to the panel bottom. Opening Settings shows the AI tab with runtime, ACP agent, default model, and thinking controls.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
          "ready",
        );
      },
      { timeout: 12_000 },
    );

    const app = demoApp(canvasElement);
    expect(app.workspace.leftSplit.collapsed).toBe(true);
    expect(app.workspace.bottomPanel.collapsed).toBe(true);
    await expect(
      canvas.getByRole("button", { name: "Open left sidebar" }),
    ).toBeVisible();

    const panel = await canvas.findByTestId("ai-chat-panel");
    const demo = canvas.getByTestId("ai-workspace-demo");
    const workspaceShell = demo.querySelector(
      '[data-ui-component="lapis-workspace-shell"]',
    ) as HTMLElement | null;
    expect(workspaceShell).not.toBeNull();
    expect(
      workspaceShell!.getBoundingClientRect().bottom,
    ).toBeGreaterThanOrEqual(demo.getBoundingClientRect().bottom - 2);
    const sidebar = panel.closest(
      '[data-ui-component="workspace-sidebar"]',
    ) as HTMLElement | null;
    expect(sidebar).not.toBeNull();
    expect(sidebar).toHaveAttribute("data-workspace-sidebar-side", "right");
    const surface = panel.closest("[data-workspace-surface]");
    expect(surface).toHaveAttribute("data-workspace-surface", "right-sidebar");
    const panelStyles = getComputedStyle(panel);
    const viewPaint = panelStyles
      .getPropertyValue("--ui-workspace-view-background")
      .trim();
    const bodyPaint = panelStyles.getPropertyValue("--background").trim();
    expect(viewPaint === "var(--background)" || viewPaint === bodyPaint).toBe(
      true,
    );
    const dock = panel.querySelector(
      '[data-ui-part="composer-dock"]',
    ) as HTMLElement | null;
    const composerBody = panel.querySelector(
      '[data-ui-component="ai-chat-composer"] [data-ui-part="body"]',
    ) as HTMLElement | null;
    const status = canvas.getByLabelText("Workspace status");
    expect(dock).not.toBeNull();
    expect(composerBody).not.toBeNull();
    expect(dock!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      status.getBoundingClientRect().top + 8,
    );
    expect(composerBody!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      status.getBoundingClientRect().top - 8,
    );
    expect(getComputedStyle(panel).fontFamily).toMatch(/DM Sans/i);
    assertStackedComposer(panel);
    expect(panel.querySelector('[data-ui-part="empty-state"]')).not.toBeNull();
    expect(
      within(panel).getByRole("combobox", { name: "Message" }),
    ).toBeVisible();
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      within(panel).getByRole("button", { name: "Effort and model" }),
    );
    const modelMenu = body.getByTestId("ai-chat-model");
    await expect(modelMenu).toBeVisible();
    await userEvent.hover(modelMenu);
    await expect(
      await body.findByRole("menuitemradio", { name: "gpt-5.6-sol" }),
    ).toHaveAttribute("data-state", "checked");
    await userEvent.hover(body.getByTestId("ai-chat-thinking"));
    await expect(
      await body.findByRole("menuitemradio", { name: "Medium" }),
    ).toHaveAttribute("data-state", "checked");
    await userEvent.keyboard("{Escape}");

    const input = within(panel).getByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Summarize this note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        panel.querySelector('[data-ui-component="ai-chat-reasoning"]'),
      ).not.toBeNull();
      expect(within(panel).getByText("vault.read")).toBeVisible();
      expect(
        within(panel).getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("Summary");
    });
    assertNoMessageOverlap(panel);
    const bubble = panel.querySelector(
      '[data-ui-component="ai-chat-message-bubble"]',
    ) as HTMLElement | null;
    expect(bubble).not.toBeNull();
    const bubbleStyles = getComputedStyle(bubble!);
    expect(bubbleStyles.fontFamily).toMatch(/DM Sans/i);
    expect(bubbleStyles.fontSize).toBe("14px");
    expect(bubbleStyles.lineHeight).toBe("22px");
    const heading = bubble!.querySelector("h2");
    if (heading) {
      expect(getComputedStyle(heading).fontSize).toBe(bubbleStyles.fontSize);
      expect(getComputedStyle(heading).fontFamily).toBe(
        bubbleStyles.fontFamily,
      );
    }

    await userEvent.click(
      canvas.getByRole("button", { name: "Open left sidebar" }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Open settings" }),
    );
    const dialog = canvas.getByRole("dialog", { name: "Settings" });
    await userEvent.click(
      await within(dialog).findByRole("button", { name: "AI" }),
    );
    const runtimeLabel = within(dialog).getByText("Default runtime");
    await expect(runtimeLabel).toBeVisible();
    await expect(within(dialog).getByText("ACP agent")).toBeVisible();
    await expect(within(dialog).getByText("Default model")).toBeVisible();
    await expect(within(dialog).getByText("Thinking")).toBeVisible();
    expect(getComputedStyle(runtimeLabel).fontFamily).toMatch(/DM Sans/i);
    expect(getComputedStyle(runtimeLabel).fontFamily).toBe(
      getComputedStyle(dialog).fontFamily,
    );

    const modelField = within(dialog).getByRole("combobox", {
      name: "Default model",
    });
    await expect(modelField).toBeVisible();
    expect(
      within(dialog).queryByRole("textbox", { name: "Default model" }),
    ).toBeNull();

    const agentField = within(dialog).getByRole("combobox", {
      name: "ACP agent",
    });
    await userEvent.click(agentField);
    await userEvent.click(await body.findByRole("option", { name: "Cursor" }));
    await waitFor(async () => {
      const raw =
        await demoApp(canvasElement).vault.adapter.read(".obsidian/ai.json");
      expect(JSON.parse(raw).settings.acpAgent).toBe("cursor");
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close settings" }),
    );

    const cursorPanel = await canvas.findByTestId("ai-chat-panel");
    const cursorInput = within(cursorPanel).getByRole("combobox", {
      name: "Message",
    });
    await userEvent.type(cursorInput, "Continue with Cursor");
    await userEvent.keyboard("{Enter}");
    await waitFor(async () => {
      const raw =
        await demoApp(canvasElement).vault.adapter.read(".obsidian/ai.json");
      const sessions = JSON.parse(raw).sessions as Array<{ agent?: string }>;
      expect(sessions.some((session) => session.agent === "cursor")).toBe(true);
    });
  },
};
