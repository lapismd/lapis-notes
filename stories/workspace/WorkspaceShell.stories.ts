import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import WorkspaceShellDemo from "./WorkspaceShellDemo.svelte";
import { workspaceStoryMeta } from "./_shared";

const meta = {
  title: "Workspace/Shell",
  component: WorkspaceShellDemo,
} satisfies Meta<typeof WorkspaceShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function persistedLayout(canvas: ReturnType<typeof within>) {
  return JSON.parse(
    canvas.getByTestId("workspace-persisted-layout").textContent ?? "{}",
  ) as Record<string, any>;
}

async function waitForShell(canvas: ReturnType<typeof within>) {
  await waitFor(
    () => {
      expect(canvas.getByTestId("workspace-shell-status")).toHaveTextContent(
        "ready",
      );
      expect(
        canvas.getByTestId("workspace-shell-frame").querySelector(
          '[data-app-shell-ready="true"]',
        ),
      ).toBeInTheDocument();
    },
    { timeout: 3_000 },
  );
}

export const PersistedDesktop: Story = {
  ...workspaceStoryMeta(
    "workspace-shell-persisted-desktop",
    "A real API App restores the Lapis workspace file before mounting the design-core desktop shell.",
    "/visual-baselines/stories/workspace/persisted-desktop-chromium.png",
  ),
  args: {
    displayMode: "desktop",
    workspaceLabel: "Lapis Notes",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);

    const newTabButton = canvas.getByRole("button", { name: "New tab" });
    const tabHeader = canvasElement.querySelector<HTMLElement>(
      ".ui-workspace-tabs__header",
    );
    await expect(tabHeader).not.toBeNull();
    await userEvent.hover(newTabButton);
    await waitFor(() => {
      expect(getComputedStyle(newTabButton).backgroundColor).not.toBe(
        getComputedStyle(tabHeader!).backgroundColor,
      );
    });
    await userEvent.unhover(newTabButton);

    await userEvent.click(newTabButton);
    await expect(
      canvas.getByRole("tablist", { name: "Workspace tabs" }),
    ).toBeInTheDocument();
    const tabs = canvas.getAllByRole("tab", { name: /^New Tab/ });
    await expect(tabs).toHaveLength(2);

    const startTab = canvasElement.querySelector<HTMLElement>(
      '[data-workspace-tab-id="start"] [role="tab"]',
    );
    const addedTabClose = canvasElement.querySelector<HTMLElement>(
      '[data-workspace-tab-id]:not([data-workspace-tab-id="start"]) [data-ui-part="tab-close"]',
    );
    await expect(startTab).not.toBeNull();
    await expect(addedTabClose).not.toBeNull();
    await userEvent.click(startTab!);
    await userEvent.click(addedTabClose!);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open left sidebar" }),
    );
    await expect(canvas.getByLabelText("Left sidebar")).toBeInTheDocument();

    await waitFor(
      () => {
        const layout = persistedLayout(canvas);
        const leaves = layout.main.children[0].children;
        expect(leaves).toHaveLength(1);
        expect(leaves[0].id).toBe("start");
        expect(layout.active).toBe("start");
        expect(layout.left.width).not.toBe("0px");
        expect(
          Number(canvas.getByTestId("workspace-write-count").textContent),
        ).toBeGreaterThan(0);
      },
      { timeout: 3_000 },
    );
  },
};

export const Mobile: Story = {
  ...workspaceStoryMeta(
    "workspace-shell-mobile",
    "The same restored API workspace drives design-core mobile navigation and tab management.",
    "/visual-baselines/stories/workspace/mobile-chromium.png",
  ),
  args: {
    displayMode: "mobile",
    workspaceLabel: "Lapis Notes",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);

    await userEvent.click(
      canvas.getByRole("button", { name: "Create new tab" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Open tabs (2)" }),
    );
    await expect(
      canvas.getByRole("region", { name: "Open workspace tabs" }),
    ).toBeInTheDocument();
    const openStart = canvasElement.querySelector<HTMLElement>(
      '[data-mobile-tab-open="start"]',
    );
    await expect(openStart).not.toBeNull();
    await userEvent.click(openStart!);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open tabs (2)" }),
    );
    const closeAdded = canvasElement.querySelector<HTMLElement>(
      '[data-mobile-tab-close]:not([data-mobile-tab-close="start"])',
    );
    await expect(closeAdded).not.toBeNull();
    await userEvent.click(closeAdded!);

    await waitFor(
      () => {
        const layout = persistedLayout(canvas);
        const leaves = layout.main.children[0].children;
        expect(leaves).toHaveLength(1);
        expect(leaves[0].id).toBe("start");
        expect(layout.active).toBe("start");
        expect(
          Number(canvas.getByTestId("workspace-write-count").textContent),
        ).toBeGreaterThan(0);
      },
      { timeout: 3_000 },
    );
  },
};
