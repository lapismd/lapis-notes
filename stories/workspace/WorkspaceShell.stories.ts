import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
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

function expectBundledPlugins(canvas: ReturnType<typeof within>) {
  expect(
    JSON.parse(
      canvas.getByTestId("workspace-bundled-plugins").textContent ?? "[]",
    ),
  ).toEqual([
    { id: "markdown", enabled: true },
    { id: "lapis-markdown-lint", enabled: true },
    { id: "lapis-file-explorer", enabled: true },
    { id: "search", enabled: true },
    { id: "history", enabled: true },
    { id: "wordcount", enabled: true },
    { id: "bases", enabled: true },
    { id: "ai", enabled: true },
  ]);
}

function expectAppShellPlugins(canvas: ReturnType<typeof within>) {
  expect(
    JSON.parse(
      canvas.getByTestId("workspace-app-shell-plugins").textContent ?? "[]",
    ),
  ).toEqual(
    expect.arrayContaining([
      { id: "fmode", enabled: false },
      { id: "notifications", enabled: true },
      { id: "app-shell:problems", enabled: true },
    ]),
  );
}

async function expectWordCountForWelcome(
  canvasElement: HTMLElement,
  canvas: ReturnType<typeof within>,
) {
  const runtimeApp = (
    canvasElement.querySelector(
      '[data-testid="workspace-shell-frame"]',
    ) as HTMLElement & { __lapisApp?: import("@lapis-notes/api").App }
  )?.__lapisApp;
  expect(runtimeApp).toBeDefined();
  const welcome = runtimeApp!.vault.getFileByPath("Notes/Welcome.md");
  expect(welcome).not.toBeNull();
  const plugin = runtimeApp!.plugins.plugins.get("wordcount") as
    | {
        status: { show(text: string): void };
        syncActiveLeaf(leaf: unknown): void;
      }
    | undefined;
  expect(plugin).toBeDefined();
  const leaf =
    runtimeApp!.workspace.activeLeaf ?? runtimeApp!.workspace.getLeaf();
  await leaf.setViewState({
    type: "markdown",
    state: { file: welcome!.path },
  });
  runtimeApp!.workspace.activeLeaf = leaf;
  await runtimeApp!.workspace.revealLeaf(leaf);
  plugin!.syncActiveLeaf(leaf);
  plugin!.status.show(await runtimeApp!.vault.read(welcome!));
  expect(runtimeApp!.statusBar.items["wordcount:status"]).toMatchObject({
    segments: ["5 words", "44 characters"],
  });
  expect(
    canvas.queryByText("5 words", { selector: ".status-bar-item-segment" }),
  ).toBeNull();
  if (canvas.queryByRole("button", { name: "Create new tab" })) {
    return;
  }
  await waitFor(
    () => {
      const item = canvasElement.querySelector(
        '[data-status-bar-item-id="wordcount:status"]',
      );
      expect(item).not.toBeNull();
      expect(item).toHaveTextContent("5 words");
      expect(item).toHaveTextContent("44 characters");
    },
    { timeout: 3_000 },
  );
}

async function expectStatusActionHover(button: HTMLButtonElement) {
  const statusBar = button.closest<HTMLElement>(
    '[data-ui-component="workspace-status-bar"]',
  );
  await expect(statusBar).not.toBeNull();
  await userEvent.hover(button);
  await waitFor(() => {
    expect(getComputedStyle(button).backgroundColor).not.toBe(
      getComputedStyle(statusBar!).backgroundColor,
    );
  });
  await userEvent.unhover(button);
}

async function expectFloatingActionHover(button: HTMLButtonElement) {
  const header = button.closest<HTMLElement>(
    '[data-ui-component="workspace-floating-window"] [data-ui-part="header"]',
  );
  await expect(header).not.toBeNull();
  await userEvent.hover(button);
  await waitFor(() => {
    expect(getComputedStyle(button).backgroundColor).not.toBe(
      getComputedStyle(header!).backgroundColor,
    );
  });
  await userEvent.unhover(button);
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
    loadBundledPlugins: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);
    expectBundledPlugins(canvas);
    expectAppShellPlugins(canvas);
    await expectWordCountForWelcome(canvasElement, canvas);

    const newTabButton = canvas.getByRole("button", { name: "New tab" });
    const tabHeader = canvasElement.querySelector<HTMLElement>(
      ".ui-workspace-tabs__header",
    );
    const shellRoot = canvasElement.querySelector<HTMLElement>(
      "[data-app-shell-root]",
    );
    await expect(tabHeader).not.toBeNull();
    await expect(shellRoot).not.toBeNull();

    const maximize = canvas.getByRole("button", {
      name: "Maximize tab group",
    });
    const tabOptions = canvas.getByRole("button", {
      name: "Tab overflow menu",
    });
    for (const action of [newTabButton, maximize, tabOptions]) {
      await expect(action.getBoundingClientRect().width).toBe(32);
    }
    await expect(
      newTabButton.getBoundingClientRect().right,
    ).toBeLessThanOrEqual(maximize.getBoundingClientRect().left);
    await expect(maximize.getBoundingClientRect().right).toBeLessThanOrEqual(
      tabOptions.getBoundingClientRect().left,
    );
    const restingBackground = getComputedStyle(maximize).backgroundColor;
    await expect(maximize).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(maximize);
    await expect(shellRoot).toHaveAttribute(
      "data-workspace-focus-mode",
      "true",
    );
    const restore = canvas.getByRole("button", {
      name: "Restore tab group",
    });
    await expect(restore).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(getComputedStyle(restore).backgroundColor).not.toBe(
        restingBackground,
      );
    });
    await expect(
      canvas.queryByRole("button", { name: "Exit focus mode" }),
    ).toBeNull();
    await userEvent.click(restore);
    await expect(shellRoot).not.toHaveAttribute("data-workspace-focus-mode");

    await userEvent.hover(newTabButton);
    await waitFor(() => {
      expect(getComputedStyle(newTabButton).backgroundColor).not.toBe(
        getComputedStyle(tabHeader!).backgroundColor,
      );
    });
    await userEvent.unhover(newTabButton);

    await userEvent.click(newTabButton);
    await expect(
      canvas.getByRole("toolbar", { name: "Workspace tabs" }),
    ).toBeInTheDocument();
    const tabs = canvas.getAllByRole("button", { name: "New Tab" });
    await expect(tabs).toHaveLength(2);

    const addedTabMenu = canvasElement.querySelector<HTMLButtonElement>(
      '[data-workspace-tab-id]:not([data-workspace-tab-id="start"]) [data-ui-part="tab-menu-trigger"]',
    );
    await expect(addedTabMenu).not.toBeNull();
    await userEvent.click(addedTabMenu!);
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("menuitem", {
        name: "Move to floating window",
      }),
    );

    const collapseFloating = canvas.getByRole("button", {
      name: "Collapse floating pane",
    });
    await expectFloatingActionHover(collapseFloating);
    await userEvent.click(
      canvas.getByRole("button", { name: "Redock floating pane" }),
    );

    const addedTabClose = canvasElement.querySelector<HTMLElement>(
      '[data-workspace-tab-id]:not([data-workspace-tab-id="start"]) [data-ui-part="tab-close"]',
    );
    await expect(addedTabClose).not.toBeNull();
    await userEvent.click(addedTabClose!);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open left sidebar" }),
    );
    const leftSidebar = canvas.getByLabelText("Left sidebar");
    await expect(leftSidebar).toBeInTheDocument();

    const workspaceTrigger = within(leftSidebar).getByRole("button", {
      name: "Current workspace: Lapis Notes",
    });
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(workspaceTrigger);
    await expect(page.getByText("Recent vaults")).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /Lapis Notes/ }),
    ).toHaveAttribute("data-disabled");
    await userEvent.click(
      page.getByRole("menuitem", { name: "Manage Vaults" }),
    );
    await expect(
      canvas.getByTestId("workspace-navigation-status"),
    ).toHaveTextContent("Manage Vaults selected");
    await waitFor(() =>
      expect(getComputedStyle(workspaceTrigger).pointerEvents).toBe("auto"),
    );

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
    await expectStatusActionHover(notifications!);
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
    await expectStatusActionHover(version!);
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
      '[data-workspace-tab-id="archive"] [data-workspace-stacked-tab-title-trigger]',
    );
    await expect(container).not.toBeNull();
    await expect(archive).not.toBeNull();
    await expect(container!.scrollWidth).toBeGreaterThan(
      container!.clientWidth,
    );

    await userEvent.click(archive!);
    await waitFor(
      () => {
        expect(container!.scrollLeft).toBeGreaterThan(0);
        expect(archive).toHaveAttribute("aria-pressed", "true");
        expect(persistedLayout(canvas).active).toBe("archive");
      },
      { timeout: 3_000 },
    );

    const shellRoot = canvasElement.querySelector<HTMLElement>(
      "[data-app-shell-root]",
    );
    await expect(shellRoot).not.toBeNull();
    const maximize = canvas.getByRole("button", {
      name: "Maximize tab group",
    });
    const restingBackground = getComputedStyle(maximize).backgroundColor;
    await userEvent.click(maximize);
    const restore = canvas.getByRole("button", {
      name: "Restore tab group",
    });
    await expect(shellRoot).toHaveAttribute(
      "data-workspace-focus-mode",
      "true",
    );
    await expect(restore).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(getComputedStyle(restore).backgroundColor).not.toBe(
        restingBackground,
      );
    });
    await userEvent.click(restore);
    await expect(shellRoot).not.toHaveAttribute("data-workspace-focus-mode");

    await userEvent.click(
      canvas.getByRole("button", { name: "Open left sidebar" }),
    );
    const leftSidebar = canvas.getByLabelText("Left sidebar");
    await userEvent.click(
      within(leftSidebar).getByRole("button", { name: "Open settings" }),
    );
    const dialog = canvas.getByRole("dialog", { name: "Settings" });
    const dialogUi = within(dialog);
    await userEvent.click(dialogUi.getByRole("button", { name: "Appearance" }));
    const inlineTitle = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="workspace-story-view"][data-ui-part="inline-title"]',
    );
    await expect(inlineTitle).not.toBeNull();
    await expect(inlineTitle!).not.toBeVisible();
    await userEvent.click(
      dialogUi.getByRole("switch", { name: "Show inline title" }),
    );
    await expect(inlineTitle!).toBeVisible();
    await userEvent.click(
      dialogUi.getByRole("switch", { name: "Show inline title" }),
    );
    await expect(inlineTitle!).not.toBeVisible();
    await userEvent.click(
      dialogUi.getByRole("button", { name: "Close settings" }),
    );
    await userEvent.click(
      within(leftSidebar).getAllByRole("button", {
        name: "Close left sidebar",
      })[0]!,
    );
  },
};

export const BottomPanelSettings: Story = {
  ...workspaceStoryMeta(
    "workspace-shell-bottom-panel-settings",
    "A real API App restores and persists the design-core bottom panel while the live built-in settings update shell geometry without becoming workspace state.",
    "/visual-baselines/stories/workspace/bottom-panel-settings-chromium.png",
  ),
  args: {
    displayMode: "desktop",
    workspaceLabel: "Lapis Notes",
    scenario: "bottom-settings",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);

    const desktopLayout = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="app-shell-desktop-layout"]',
    );
    const leftSidebar = canvas.getByLabelText("Left sidebar");
    const rightSidebar = canvas.getByLabelText("Right sidebar");
    const bottomPanel = canvas.getByLabelText("Bottom panel");
    await expect(desktopLayout).not.toBeNull();
    await expect(canvas.getByRole("tab", { name: "Terminal" })).toBeVisible();
    const problemsTab = canvas.getByRole("tab", {
      name: "Problems, 0 problems",
    });
    await expect(problemsTab).toBeVisible();
    const problemsBadge = problemsTab.querySelector<HTMLElement>(
      "[data-workspace-view-badge]",
    );
    await expect(problemsBadge).not.toBeNull();
    await expect(getComputedStyle(problemsBadge!).backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
    await expect(canvas.getByTestId("workspace-bottom-size")).toHaveTextContent(
      "240",
    );
    await expect(
      canvas.getByTestId("workspace-bottom-collapsed"),
    ).toHaveTextContent("false");

    const resizeRail = within(bottomPanel).getByRole("button", {
      name: "Resize bottom panel",
    });
    await fireEvent.keyDown(resizeRail, { key: "ArrowUp" });

    await waitFor(
      () => {
        expect(canvas.getByTestId("workspace-bottom-size")).toHaveTextContent(
          "250",
        );
        const controller = JSON.parse(
          canvas.getByTestId("workspace-controller-layout").textContent ?? "{}",
        );
        const compatibility = JSON.parse(
          canvas.getByTestId("workspace-compatibility-layout").textContent ??
            "{}",
        );
        const persisted = persistedLayout(canvas);
        expect(controller.bottom.height).toBe("250px");
        expect(compatibility.bottom.height).toBe("250px");
        expect(persisted.bottom.height).toBe("250px");
        expect(canvas.getByTestId("workspace-write-count")).toHaveTextContent(
          "1",
        );
      },
      { timeout: 3_000 },
    );

    await userEvent.click(
      canvas.getByRole("button", { name: "Open settings" }),
    );
    const dialog = canvas.getByRole("dialog", { name: "Settings" });
    await expect(dialog).toBeVisible();
    const dialogUi = within(dialog);
    const alignment = dialogUi.getByRole("combobox", {
      name: "Bottom panel alignment",
    });
    await userEvent.click(alignment);
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("option", {
        name: "Justify",
      }),
    );
    await waitFor(() => {
      expect(desktopLayout).toHaveAttribute(
        "data-bottom-panel-alignment",
        "justify",
      );
      const panelRect = bottomPanel.getBoundingClientRect();
      expect(
        Math.abs(panelRect.left - leftSidebar.getBoundingClientRect().left),
      ).toBeLessThan(1);
      expect(
        Math.abs(panelRect.right - rightSidebar.getBoundingClientRect().right),
      ).toBeLessThan(1);
    });

    const appearanceNavigation = dialogUi.getByRole("button", {
      name: "Appearance",
    });
    await waitFor(() => {
      expect(getComputedStyle(appearanceNavigation).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(appearanceNavigation);
    const showRibbon = dialogUi.getByRole("switch", { name: "Show ribbon" });
    await expect(showRibbon).toHaveAttribute("data-state", "checked");
    await userEvent.click(showRibbon);
    await waitFor(() => {
      expect(
        canvasElement.querySelector('[data-ui-component="workspace-ribbon"]'),
      ).toBeNull();
    });

    await new Promise((resolve) => setTimeout(resolve, 1_100));
    await expect(canvas.getByTestId("workspace-write-count")).toHaveTextContent(
      "1",
    );
    await expect(persistedLayout(canvas).bottom.height).toBe("250px");

    const workspaceNavigation = dialogUi.getByRole("button", {
      name: "Workspace",
    });
    await waitFor(() => {
      expect(getComputedStyle(workspaceNavigation).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(workspaceNavigation);
    const settingsViewport = dialog.querySelector<HTMLElement>(
      ".ui-workspace-settings__content-viewport",
    );
    await expect(settingsViewport).not.toBeNull();
    settingsViewport!.scrollTop = 0;
    const finalAlignment = dialogUi.getByRole("combobox", {
      name: "Bottom panel alignment",
    });
    await expect(finalAlignment).toHaveTextContent("Justify");
    await expect(finalAlignment).toBeVisible();
    await expect(dialog).toBeVisible();
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
    loadBundledPlugins: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForShell(canvas);
    expectBundledPlugins(canvas);
    expectAppShellPlugins(canvas);
    await expectWordCountForWelcome(canvasElement, canvas);

    await userEvent.click(
      canvas.getByRole("button", { name: "Create new tab" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Open tabs (7)" }),
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
      canvas.getByRole("button", { name: "Open tabs (7)" }),
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
