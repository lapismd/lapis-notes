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
        canvas
          .getByTestId("workspace-shell-frame")
          .querySelector('[data-app-shell-ready="true"]'),
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
    scenario: "standard",
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

export const NotificationCenter: Story = {
  ...workspaceStoryMeta(
    "workspace-shell-notification-center",
    "The minimal design-core notification plugin presents Lapis shell history without loading runtime plugins.",
    "/visual-baselines/stories/workspace/notification-center-chromium.png",
  ),
  args: {
    displayMode: "desktop",
    workspaceLabel: "Lapis Notes",
    scenario: "standard",
    seedNotifications: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);

    const notifications = canvasElement.querySelector<HTMLButtonElement>(
      '[data-status-bar-item-id="notifications:status"]',
    );
    await expect(notifications).not.toBeNull();
    await userEvent.click(notifications!);
    await expect(
      canvas.getByRole("dialog", { name: "Notifications" }),
    ).toBeVisible();
    await expect(canvas.getByText("Workspace restored")).toBeVisible();
    await expect(
      canvas.getByText("Your persisted Lapis layout is ready."),
    ).toBeVisible();
  },
};

export const AboutLapisNotes: Story = {
  ...workspaceStoryMeta(
    "workspace-shell-about-lapis-notes",
    "The controller-owned version action opens design-core's About surface with Lapis application metadata and logo.",
    "/visual-baselines/stories/workspace/about-lapis-notes-chromium.png",
  ),
  args: {
    displayMode: "desktop",
    workspaceLabel: "Lapis Notes",
    scenario: "standard",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);

    const version = canvasElement.querySelector<HTMLButtonElement>(
      '[data-status-bar-item-id="app-shell:version"]',
    );
    await expect(version).not.toBeNull();
    await userEvent.click(version!);
    await expect(
      canvas.getByRole("dialog", { name: "Lapis Notes" }),
    ).toBeVisible();
    await expect(canvas.getByText("Version 0.0.1-story")).toBeVisible();
    await expect(
      canvas.getByRole("img", { name: "Lapis Notes" }),
    ).toHaveAttribute("src", expect.stringContaining("lapis-logo"));
  },
};

export const StackedTabs: Story = {
  ...workspaceStoryMeta(
    "workspace-shell-stacked-tabs",
    "Persisted empty views retain design-core's preferred stacked-pane width and horizontal selected-tab scrolling.",
    "/visual-baselines/stories/workspace/stacked-tabs-chromium.png",
  ),
  args: {
    displayMode: "desktop",
    workspaceLabel: "Lapis Notes",
    scenario: "stacked",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);

    const container = canvasElement.querySelector<HTMLElement>(
      '.ui-workspace-stacked-tabs__container[data-ui-part="container"]',
    );
    const archive = canvasElement.querySelector<HTMLButtonElement>(
      '[data-workspace-tab-id="archive"][data-ui-part="stacked-tab-header"]',
    );
    await expect(container).not.toBeNull();
    await expect(archive).not.toBeNull();
    await expect(container!.scrollWidth).toBeGreaterThan(
      container!.clientWidth,
    );

    await userEvent.click(archive!);
    await waitFor(() => {
      expect(container!.scrollLeft).toBeGreaterThan(0);
      expect(archive).toHaveAttribute("aria-pressed", "true");
      expect(persistedLayout(canvas).active).toBe("archive");
    });
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
    scenario: "mobile",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);

    await userEvent.click(
      canvas.getByRole("button", { name: "Create new tab" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Open tabs (6)" }),
    );
    await expect(
      canvas.getByRole("region", { name: "Open workspace tabs" }),
    ).toBeInTheDocument();
    const openStart = canvasElement.querySelector<HTMLElement>(
      '[data-mobile-tab-open="start"]',
    );
    await expect(openStart).not.toBeNull();
    await expect(
      canvas.getByRole("button", { name: "Open Files" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Open Outline" }),
    ).toBeVisible();
    await userEvent.click(openStart!);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open tabs (6)" }),
    );
    const closeAdded = [
      ...canvasElement.querySelectorAll<HTMLElement>("[data-mobile-tab-close]"),
    ].find(
      (element) =>
        !["start", "notes", "reference", "files", "outline"].includes(
          element.dataset.mobileTabClose ?? "",
        ),
    );
    await expect(closeAdded).not.toBeNull();
    await userEvent.click(closeAdded!);

    await waitFor(
      () => {
        expect(
          canvas.getByTestId("workspace-layout-operation"),
        ).toHaveTextContent("tab-close");
        expect(
          canvas.getByTestId("workspace-controller-operation"),
        ).toHaveTextContent("tab-close");
        const controller = JSON.parse(
          canvas.getByTestId("workspace-controller-layout").textContent ?? "{}",
        );
        expect(controller.main.children[0].children).toHaveLength(3);
        const compatibility = JSON.parse(
          canvas.getByTestId("workspace-compatibility-layout").textContent ??
            "{}",
        );
        expect(compatibility.main.children[0].children).toHaveLength(3);
        const layout = persistedLayout(canvas);
        const leaves = layout.main.children[0].children;
        expect(leaves).toHaveLength(3);
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
