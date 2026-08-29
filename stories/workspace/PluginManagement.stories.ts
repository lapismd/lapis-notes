import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import PluginManagementSurface from "./PluginManagementSurface.svelte";
import "./PluginManagement.docs.css";

const meta = {
  title: "Workspace/Plugin Management",
  component: PluginManagementSurface,
  tags: ["test", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      canvas: { className: "plugin-management-docs-canvas" },
      description: {
        component:
          "The application-owned plugin settings family ported from legacy Lapis Notes. Visual parity remains review-only and does not gate deployment.",
      },
    },
  },
} satisfies Meta<typeof PluginManagementSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

async function waitForReady(canvas: ReturnType<typeof within>) {
  await waitFor(() => {
    expect(canvas.getByTestId("plugin-management-story")).toHaveAttribute(
      "data-ready",
      "true",
    );
  });
  await waitFor(() => {
    expect(
      canvas.queryByRole("button", { name: "Refreshing plugin registry" }),
    ).not.toBeInTheDocument();
  });
}

async function selectRegistryTab(
  canvas: ReturnType<typeof within>,
  name: "Installed" | "Browse" | "Updates" | "Sources",
) {
  await userEvent.click(canvas.getByRole("tab", { name }));
}

async function expectPopulatedRegistryRows(
  canvas: ReturnType<typeof within>,
  name: "Installed" | "Browse" | "Updates",
) {
  await selectRegistryTab(canvas, name);
  const tab = canvas.getByRole("tab", { name });
  const panel = canvas.getByRole("tabpanel", { name });
  await expect(tab).toHaveAttribute("data-state", "active");
  await waitFor(() => {
    expect(
      panel.querySelectorAll('[data-ui-component="plugin-registry-row"]')
        .length,
    ).toBeGreaterThan(0);
  });
}

export const EmptyTabsAndSources: Story = {
  args: { scenario: "empty", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    const installedTab = canvas.getByRole("tab", { name: "Installed" });
    await expect(installedTab).toHaveAttribute("data-state", "active");
    const tabWidths = canvas
      .getAllByRole("tab")
      .map((tab) => tab.getBoundingClientRect().width);
    expect(Math.max(...tabWidths) - Math.min(...tabWidths)).toBeLessThan(1);
    expect(
      canvasElement.ownerDocument.defaultView!.getComputedStyle(installedTab)
        .borderBottomColor,
    ).not.toBe("rgba(0, 0, 0, 0)");
    await expect(
      canvas.getByRole("heading", { name: "No plugins installed" }),
    ).toBeVisible();
    await expect(
      canvas.getByText("No installed registry or community plugins."),
    ).toBeVisible();
    await expect(
      canvasElement.querySelector(
        '[data-ui-part="registry-installed-empty-state"] [data-empty-icon="package"]',
      ),
    ).not.toBeNull();

    await userEvent.click(
      canvas.getByRole("button", { name: "Browse plugins" }),
    );
    await expect(canvas.getByRole("tab", { name: "Browse" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(
      canvas.getByRole("heading", { name: "No registry entries" }),
    ).toBeVisible();
    await selectRegistryTab(canvas, "Updates");
    await expect(canvas.getByRole("tab", { name: "Updates" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(
      canvas.getByRole("heading", { name: "You’re up to date" }),
    ).toBeVisible();
    await expect(
      canvas.getByText("No plugin updates available."),
    ).toBeVisible();
    await expect(
      canvasElement.querySelector(
        '[data-ui-part="registry-updates-empty-state"] [data-empty-icon="circle-check"]',
      ),
    ).not.toBeNull();
    await expect(
      canvas.getByRole("button", { name: "Check for updates" }),
    ).toBeVisible();
    await selectRegistryTab(canvas, "Sources");
    await expect(canvas.getByRole("tab", { name: "Sources" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(canvas.getByText("Lapis Official Plugins")).toBeVisible();
    await expect(
      canvas.getByText("Official", { selector: "span" }),
    ).toBeVisible();
    await expect(
      canvas.getByText("Locked", { selector: "span" }),
    ).toBeVisible();
  },
};

export const BrowseDetailsAndReadme: Story = {
  args: { scenario: "catalog", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");

    const sourceEditorCard = canvas
      .getByRole("button", { name: "View details for Source Editor" })
      .closest("article");
    expect(sourceEditorCard).not.toBeNull();
    await expect(
      within(sourceEditorCard!).getByRole("button", { name: "Bundled" }),
    ).toBeDisabled();

    const graphCard = canvas
      .getByRole("button", { name: "View details for Graph" })
      .closest("article");
    expect(graphCard).not.toBeNull();
    const graphHeading = graphCard!.querySelector(
      ".lapis-plugin-registry-row__heading",
    );
    expect(graphHeading).not.toBeNull();
    const graphIdentity = graphHeading!.querySelector<HTMLElement>(
      ".lapis-plugin-registry-row__identity",
    );
    const graphTitle = graphIdentity!.querySelector("strong");
    const firstGraphChip = graphIdentity!.querySelector(
      ".lapis-plugin-registry-badge",
    );
    expect(graphIdentity).not.toBeNull();
    expect(graphTitle).not.toBeNull();
    expect(firstGraphChip).not.toBeNull();
    expect(firstGraphChip!.parentElement).toBe(graphIdentity);
    expect(getComputedStyle(graphIdentity!).flexWrap).toBe("wrap");
    expect(getComputedStyle(graphIdentity!).alignItems).toBe("center");
    expect(
      Math.abs(
        graphTitle!.getBoundingClientRect().y -
          firstGraphChip!.getBoundingClientRect().y,
      ),
    ).toBeLessThan(3);
    await expect(within(graphHeading!).getByText("Web")).toBeVisible();
    await expect(within(graphHeading!).getByText("Desktop")).toBeVisible();
    await expect(within(graphHeading!).getByText("0.2.0")).toBeVisible();
    await expect(
      within(graphCard!).getByText("~2.4K downloads (30d)"),
    ).toBeVisible();
    expect(
      within(graphHeading!).getByText("Web").querySelector("svg"),
    ).not.toBeNull();
    expect(
      within(graphHeading!).getByText("Desktop").querySelector("svg"),
    ).not.toBeNull();
    await userEvent.click(
      within(graphCard!).getByRole("button", {
        name: "View details for Graph",
      }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => {
      expect(body.getByRole("dialog")).toBeVisible();
      expect(
        body.getAllByRole("heading", { name: "Highlights" })[0],
      ).toBeVisible();
    });
    await expect(body.queryByText("Browse results")).toBeNull();
    await expect(body.getByText(/Open graph navigation/)).toBeVisible();
    await expect(body.getByRole("link", { name: "Homepage" })).toBeVisible();
    await expect(body.getByText("Downloads (30d)")).toBeVisible();
    await expect(body.getByText("Lifetime downloads")).toBeVisible();
    await expect(body.getByText("~48K")).toBeVisible();
    await expect(
      body.getByText(
        "Tracked downloads since Aug 1, 2026. Approximate redirect requests.",
      ),
    ).toBeVisible();
    await expect(
      body.getAllByText("Web", { selector: "span" }).length,
    ).toBeGreaterThan(1);
    await expect(
      body.getAllByText("Desktop", { selector: "span" }).length,
    ).toBeGreaterThan(1);
    await expect(
      body.getAllByRole("button", { name: "Install" })[0],
    ).toBeEnabled();
    const selectedResult = body
      .getByRole("dialog")
      .querySelector<HTMLButtonElement>('button[aria-current="true"]');
    expect(selectedResult).not.toBeNull();
    const selectedStyle =
      canvasElement.ownerDocument.defaultView!.getComputedStyle(
        selectedResult!,
      );
    expect(selectedStyle.borderTopWidth).toBe("0px");
    expect(selectedStyle.boxShadow).not.toBe("none");
    const resizer = body
      .getByRole("dialog")
      .querySelector('[data-ui-part="resizable-handle"]');
    expect(resizer).toHaveAttribute("aria-label", "Resize plugin result rail");
    expect(
      resizer!.querySelector('[data-ui-part="resizable-handle-anon-0"]'),
    ).toBeNull();
    await userEvent.click(body.getByRole("tab", { name: "Changelog" }));
    await expect(
      body.getByRole("heading", { name: "What changed" }),
    ).toBeVisible();
    const expandChangelog = body.getByRole("button", {
      name: "View full changelog",
    });
    await expect(expandChangelog).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(expandChangelog);
    await expect(
      body.getByRole("button", { name: "Show less" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      body.getByRole("heading", { name: "0.1.0 — First public package" }),
    ).toBeVisible();
    await userEvent.click(body.getByRole("tab", { name: "Versions" }));
    await expect(body.getAllByRole("link", { name: "Bundle" })).toHaveLength(2);
    await userEvent.click(body.getByRole("tab", { name: "Overview" }));
    await expect(
      body.getAllByRole("heading", { name: "Highlights" })[0],
    ).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

export const BrowseSearchAndExpandableFilters: Story = {
  args: { scenario: "catalog", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");
    const search = canvas.getByRole("searchbox", { name: "Search browse" });
    await userEvent.type(search, "Graph");
    await expect(canvas.getByText("1 result")).toBeVisible();
    await expect(canvas.queryByText("Source Editor")).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show browse filters" }),
    );
    await expect(
      canvas.getByRole("button", { name: "Filter by platform" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Hide browse filters" }),
    ).toBeVisible();
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "Filter by channel" }),
    );
    await userEvent.click(
      await body.findByRole("option", { name: /Community/ }),
    );
    await expect(canvas.getByText("2 active filters")).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "No plugins match" }),
    ).toBeVisible();
    // Vitest can retain a just-dismissed Bits UI portal layer in the shared
    // body; fireEvent keeps this reset assertion scoped to application state.
    fireEvent.click(
      canvas.getByRole("button", { name: "Reset search and filters" }),
    );
    await waitFor(() => expect(canvas.getByText("3 results")).toBeVisible());
    await expect(canvas.getByText("Source Editor")).toBeVisible();
  },
};

export const BrowseRecentlyUpdatedSort: Story = {
  args: { scenario: "catalog", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");
    await userEvent.click(
      canvas.getByRole("button", { name: "Show browse filters" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Sort Browse plugins" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("option", { name: "Recently updated" }),
    );
    await expect(canvas.getByText("1 active filter")).toBeVisible();
  },
};

export const BrowseMostDownloadedSort: Story = {
  args: { scenario: "catalog", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");
    await userEvent.click(
      canvas.getByRole("button", { name: "Show browse filters" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Sort Browse plugins" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("option", { name: /Most downloaded/ }),
    );
    const browse = canvas.getByRole("tabpanel", { name: "Browse" });
    await waitFor(() => {
      const rows = browse.querySelectorAll<HTMLElement>(
        '[data-ui-component="plugin-registry-row"]',
      );
      expect(rows[0]).toHaveAttribute("data-plugin-id", "lapis-graph");
      expect(rows[1]).toHaveAttribute("data-plugin-id", "lapis-source-editor");
      expect(rows[2]).toHaveAttribute("data-plugin-id", "revoked-plugin");
    });
    await expect(canvas.getByText("1 active filter")).toBeVisible();
  },
};

export const StructuredMarkdownFailureKeepsMetadata: Story = {
  args: {
    scenario: "catalog",
    section: "plugin-registry",
    markdownMode: "invalid",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");
    await userEvent.click(
      canvas.getByRole("button", { name: "View details for Graph" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => {
      expect(
        body.getByRole("heading", { name: "Overview unavailable" }),
      ).toBeVisible();
    });
    await expect(body.getByText("MIT")).toBeVisible();
    await expect(body.getByRole("button", { name: "Retry" })).toBeVisible();
    await userEvent.click(body.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

export const NarrowDetailDrillIn: Story = {
  args: { scenario: "catalog", section: "plugin-registry" },
  globals: { viewport: "mobile2" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");
    await userEvent.click(
      canvas.getByRole("button", { name: "View details for Graph" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const dialog = body.getByRole("dialog");
    await expect(
      dialog.querySelector(".lapis-plugin-detail-dialog__back"),
    ).not.toBeNull();
    await expect(
      dialog.querySelector("[data-narrow-view='detail']"),
    ).not.toBeNull();
    await userEvent.click(body.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

export const DarkBrowseRows: Story = {
  args: { scenario: "catalog", section: "plugin-registry" },
  globals: { colorMode: "dark" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");
    await expect(
      canvasElement.querySelector('[data-registry-badge-tone="official"]'),
    ).not.toBeNull();
    await expect(
      canvasElement.querySelector('[data-registry-badge-tone="community"]'),
    ).not.toBeNull();
  },
};

export const PopulatedInstalledBrowseAndUpdates: Story = {
  args: { scenario: "installed", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);

    const installed = canvas.getByRole("tabpanel", { name: "Installed" });
    await waitFor(() => {
      expect(
        installed.querySelectorAll('[data-ui-component="plugin-registry-row"]')
          .length,
      ).toBeGreaterThan(0);
    });

    await selectRegistryTab(canvas, "Browse");
    const browse = canvas.getByRole("tabpanel", { name: "Browse" });
    await expect(
      within(browse).getByRole("button", { name: "View details for Graph" }),
    ).toBeVisible();
    expect(
      browse.querySelectorAll('[data-ui-component="plugin-registry-row"]')
        .length,
    ).toBeGreaterThan(0);

    await selectRegistryTab(canvas, "Updates");
    const updates = canvas.getByRole("tabpanel", { name: "Updates" });
    await expect(within(updates).getByText(/0\.1\.0.*0\.2\.0/)).toBeVisible();
    expect(
      updates.querySelectorAll('[data-ui-component="plugin-registry-row"]')
        .length,
    ).toBeGreaterThan(0);

    await selectRegistryTab(canvas, "Installed");
    await expect(installed).toBeVisible();
  },
};

export const PopulatedInstalledRows: Story = {
  args: { scenario: "installed", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expectPopulatedRegistryRows(canvas, "Installed");
    const graphRow = canvasElement.querySelector(
      '[data-plugin-id="lapis-graph"]',
    );
    expect(graphRow).not.toBeNull();
    const graphHeading = graphRow!.querySelector(
      ".lapis-plugin-registry-row__heading",
    );
    await expect(within(graphHeading!).getByText("0.1.0")).toBeVisible();
    await expect(within(graphHeading!).getByText("Web")).toBeVisible();
    await expect(within(graphHeading!).getByText("Desktop")).toBeVisible();
    await expect(canvas.getByText("Restart required")).toBeVisible();
    await expect(
      within(graphRow!).getByText("~2.4K downloads (30d)"),
    ).toBeVisible();
    const disableSwitch = within(graphRow!).getByRole("switch", {
      name: "Disable Graph",
    });
    await expect(disableSwitch).toBeChecked();
    await expect(disableSwitch).toHaveAttribute("data-tooltip-trigger");
    await expect(disableSwitch).toHaveAttribute(
      "data-tooltip-action",
      "Disable Graph",
    );
    const revokedRow = canvasElement.querySelector(
      '[data-plugin-id="revoked-plugin"]',
    );
    expect(revokedRow).not.toBeNull();
    const enableSwitch = within(revokedRow!).getByRole("switch", {
      name: "Enable Revoked Example",
    });
    await expect(enableSwitch).not.toBeChecked();
    await expect(enableSwitch).toHaveAttribute(
      "data-tooltip-action",
      "Enable Revoked Example",
    );
    await expect(
      within(graphRow!).getByRole("button", { name: "Update Graph" }),
    ).toBeVisible();
    await expect(canvas.getAllByText("Revoked").at(0)).toBeVisible();
  },
};

export const PopulatedBrowseRows: Story = {
  args: { scenario: "installed", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expectPopulatedRegistryRows(canvas, "Browse");
    await expect(
      canvas.getByRole("button", { name: "View details for Graph" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Uninstall Graph" }),
    ).toBeEnabled();
    await expect(
      canvas.getByRole("button", { name: "Bundled" }),
    ).toBeDisabled();
    const browsePanel = canvas.getByRole("tabpanel", { name: "Browse" });
    const graphRow = browsePanel.querySelector('[data-plugin-id="lapis-graph"]');
    expect(graphRow).not.toBeNull();
    await expect(
      within(graphRow!).getByText("~2.4K downloads (30d)"),
    ).toBeVisible();
  },
};

export const PopulatedUpdatesRows: Story = {
  args: { scenario: "installed", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expectPopulatedRegistryRows(canvas, "Updates");
    await expect(canvas.getByText(/0\.1\.0.*0\.2\.0/)).toBeVisible();
    const updatesPanel = canvas.getByRole("tabpanel", { name: "Updates" });
    const graphRow = updatesPanel.querySelector(
      '[data-plugin-id="lapis-graph"]',
    );
    expect(graphRow).not.toBeNull();
    const graphHeading = graphRow!.querySelector(
      ".lapis-plugin-registry-row__heading",
    );
    await expect(within(graphHeading!).getByText("Web")).toBeVisible();
    await expect(within(graphHeading!).getByText("Desktop")).toBeVisible();
    await expect(
      within(graphRow!).getByText("~2.4K downloads (30d)"),
    ).toBeVisible();
    const updateButton = within(graphRow!).getByRole("button", {
      name: "Update Graph",
    });
    await expect(updateButton).toHaveAttribute("data-tooltip-trigger");
    await expect(
      canvas.getByText("This installed release is no longer trusted."),
    ).toBeVisible();
  },
};

export const DisableInsteadKeepsInstalledArtifact: Story = {
  args: { scenario: "installed", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");
    const browsePanel = canvas.getByRole("tabpanel", { name: "Browse" });
    await userEvent.click(
      within(browsePanel).getByRole("button", { name: "Uninstall Graph" }),
    );
    const bodyElement = canvasElement.ownerDocument.body;
    const body = within(bodyElement);
    const dialog = body.getByRole("alertdialog");
    await userEvent.click(
      within(dialog).getByRole("switch", {
        name: "Choose Disable instead for Graph",
      }),
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Disable Graph" }),
    );
    await waitFor(() => {
      expect(body.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(canvas.getByTestId("installed-disable-calls")).toHaveTextContent(
        "1",
      );
      expect(canvas.getByTestId("plugin-uninstall-calls")).toHaveTextContent(
        "0",
      );
      expect(getComputedStyle(bodyElement).pointerEvents).not.toBe("none");
    });
    await expect(
      within(browsePanel).getByRole("button", { name: "Uninstall Graph" }),
    ).toBeEnabled();
    await selectRegistryTab(canvas, "Installed");
    const graphRow = canvasElement.querySelector(
      '[data-plugin-id="lapis-graph"]',
    );
    expect(graphRow).not.toBeNull();
    await expect(
      within(graphRow!).getByRole("switch", { name: "Enable Graph" }),
    ).not.toBeChecked();
  },
};

export const InstalledUpdatesRevocationAndConfirmation: Story = {
  args: { scenario: "installed", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expect(canvas.getByText("Restart required")).toBeVisible();
    await expect(canvas.getAllByText("Revoked").at(0)).toBeVisible();
    await expect(
      canvas.getByText("This release was revoked after a security review."),
    ).toBeVisible();

    await selectRegistryTab(canvas, "Updates");
    await expect(canvas.getByText(/0\.1\.0.*0\.2\.0/)).toBeVisible();
    await expect(
      canvas.getByText("This installed release is no longer trusted."),
    ).toBeVisible();

    await selectRegistryTab(canvas, "Browse");
    await userEvent.click(
      canvas.getByRole("button", { name: "Uninstall Graph" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const dialog = body.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(
      body.getByRole("heading", { name: "Uninstall plugin?" }),
    ).toBeVisible();
    expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(448);
    const target = dialog.querySelector<HTMLElement>(
      '[data-ui-component="plugin-uninstall-target"]',
    );
    expect(target).not.toBeNull();
    await expect(within(target!).getByText("Graph")).toBeVisible();
    await expect(within(target!).getByText("0.1.0")).toBeVisible();
    await expect(within(target!).getByText("Official")).toBeVisible();
    await expect(
      within(target!).getByText(
        "Explore local and global relationships between notes.",
      ),
    ).toBeVisible();
    const cancelAction = body.getByRole("button", { name: "Cancel" });
    await expect(cancelAction).toBeVisible();
    expect(getComputedStyle(cancelAction).borderTopStyle).toBe("solid");
    const uninstallAction = within(dialog).getByRole("button", {
      name: "Uninstall Graph",
    });
    await expect(uninstallAction).toBeVisible();
    expect(getComputedStyle(uninstallAction).backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
    const uninstallBackground =
      getComputedStyle(uninstallAction).backgroundColor;
    expect(uninstallAction.querySelector("svg")).not.toBeNull();
    const disableInstead = within(dialog).getByRole("switch", {
      name: "Choose Disable instead for Graph",
    });
    await expect(disableInstead).not.toBeChecked();
    await expect(disableInstead).toHaveAttribute(
      "data-tooltip-action",
      "Choose Disable instead for Graph",
    );
    await userEvent.click(disableInstead);
    await expect(disableInstead).toBeChecked();
    await expect(
      body.getByText(
        "The plugin will stay installed in this vault and can be enabled again later.",
      ),
    ).toBeVisible();
    const disableAction = within(dialog).getByRole("button", {
      name: "Disable Graph",
    });
    await expect(disableAction).toBeVisible();
    await expect(disableAction).toHaveClass(
      "lapis-plugin-uninstall-dialog__confirm--disable",
    );
    await waitFor(() => {
      expect(getComputedStyle(disableAction).backgroundColor).not.toBe(
        uninstallBackground,
      );
    });
  },
};

export const ManualBundleValidationAndProgress: Story = {
  args: { scenario: "progress", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    const input = canvasElement.querySelector<HTMLInputElement>(
      'input[type="file"][accept=".lapis-plugin"]',
    );
    expect(input).not.toBeNull();

    await fireEvent.change(input!, {
      target: {
        files: [
          new File(["not a plugin"], "invalid.txt", { type: "text/plain" }),
        ],
      },
    });
    await expect(
      canvas.getByTestId("plugin-bundle-install-calls"),
    ).toHaveTextContent("0");

    await fireEvent.change(input!, {
      target: {
        files: [
          new File(["fixture archive"], "graph-0.1.0.lapis-plugin", {
            type: "application/zip",
          }),
        ],
      },
    });
    await waitFor(() => {
      expect(
        canvas.getByTestId("plugin-bundle-install-calls"),
      ).toHaveTextContent("1");
      expect(canvas.getByTestId("plugin-install-progress")).toHaveTextContent(
        "Verifying files (2 of 4)",
      );
      expect(
        canvas.getByRole("button", { name: "Install from .lapis-plugin" }),
      ).toBeDisabled();
    });
  },
};

export const RegistryFailure: Story = {
  args: { scenario: "failure", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");
    await waitFor(() => {
      expect(canvas.getByText("Plugin registry unavailable")).toBeVisible();
    });
    const browsePanel = canvas.getByRole("tabpanel", { name: "Browse" });
    await expect(
      within(browsePanel).getByText(
        "The registry signature could not be verified.",
      ),
    ).toBeVisible();
  },
};

export const CoreTogglesOptionsRestartAndDiagnostics: Story = {
  args: { scenario: "catalog", section: "core-plugins" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expect(
      canvas.getByRole("heading", { name: "Installed Core Plugins" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Options for Source Editor" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Restart Source Editor" }),
    ).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", { name: "Expand Source Editor details" }),
    );
    await expect(canvas.getAllByText("Runtime entry")[0]).toBeVisible();
    await userEvent.click(
      canvas.getByRole("switch", { name: "Disable Source Editor" }),
    );
    await waitFor(() => {
      expect(
        canvas.getByRole("switch", { name: "Enable Source Editor" }),
      ).toBeVisible();
    });
  },
};

export const CommunityEmptyState: Story = {
  args: { scenario: "empty", section: "community-plugins" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expect(
      canvas.getByRole("heading", { name: "No community plugins found" }),
    ).toBeVisible();
    const emptyState = canvasElement.querySelector<HTMLElement>(
      '[data-ui-part="community-empty-state"]',
    );
    expect(emptyState).not.toBeNull();
    await expect(emptyState!).toHaveTextContent(
      "Looks like you haven’t installed any community plugins yet. Browse the community plugins list to get started.",
    );
    await expect(
      canvasElement.querySelector('[data-empty-icon="puzzle"]'),
    ).not.toBeNull();
    const reload = canvas.getByRole("button", { name: "Reload plugins" });
    await expect(reload).toBeVisible();
    await expect(
      reload.querySelector('[data-reload-icon="refresh-cw"]'),
    ).not.toBeNull();
    await expect(canvasElement.querySelector("article")).toBeNull();

    await userEvent.click(
      canvas.getByRole("button", { name: "Browse plugins" }),
    );
    await waitFor(() => {
      expect(canvas.getByRole("tab", { name: "Browse" })).toHaveAttribute(
        "data-state",
        "active",
      );
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Community plugins" }),
    );
    await expect(
      canvas.getByRole("heading", { name: "No community plugins found" }),
    ).toBeVisible();
  },
};

export const CommunityTrustToggleAndFailure: Story = {
  args: { scenario: "community", section: "community-plugins" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    const trustCard = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="workspace-trust-status"]',
    );
    expect(trustCard).not.toBeNull();
    await expect(trustCard!).toHaveAttribute("data-trust-state", "trusted");
    await expect(
      trustCard!.querySelector('[data-trust-icon="shield-check"]'),
    ).not.toBeNull();
    await expect(
      canvas.getByRole("heading", { name: "Workspace trusted" }),
    ).toBeVisible();
    await expect(
      canvas.getByText("Trusted", { selector: "span" }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "Community plugins and desktop capabilities can run in this vault.",
      ),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Revoke" })).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Trust workspace" }),
    ).toBeNull();
    await expect(
      canvas.getByRole("heading", { name: "Community Example" }),
    ).toBeVisible();
    await expect(canvas.getByTestId("failed-plugin-state")).toHaveTextContent(
      "failed: The plugin runtime entry could not be loaded.",
    );
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Expand Failed Community Plugin details",
      }),
    );
    await expect(
      canvas.getAllByText(/The plugin runtime entry could not be loaded\./)[0],
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("switch", { name: "Enable Community Example" }),
    );
    await waitFor(() => {
      expect(canvas.getByTestId("community-toggle-calls")).toHaveTextContent(
        "1",
      );
    });
    await userEvent.click(canvas.getByRole("button", { name: "Revoke" }));
    await waitFor(() => {
      expect(trustCard).toHaveAttribute("data-trust-state", "untrusted");
      expect(
        canvas.getByRole("heading", { name: "Workspace not trusted" }),
      ).toBeVisible();
      expect(
        trustCard!.querySelector('[data-trust-icon="shield-alert"]'),
      ).not.toBeNull();
    });
    await expect(
      canvas.getByText("Not trusted", { selector: "span" }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "Community plugins and desktop capabilities are disabled until this vault is trusted.",
      ),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Trust workspace" }),
    ).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Revoke" })).toBeNull();
  },
};
