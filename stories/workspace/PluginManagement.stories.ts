import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import PluginManagementSurface from "./PluginManagementSurface.svelte";

const meta = {
  title: "Workspace/Plugin Management",
  component: PluginManagementSurface,
  tags: ["test", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
    docs: {
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
}

async function selectRegistryTab(
  canvas: ReturnType<typeof within>,
  name: "Installed" | "Browse" | "Updates" | "Sources",
) {
  await userEvent.click(canvas.getByRole("tab", { name }));
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
      canvasElement.ownerDocument.defaultView!
        .getComputedStyle(installedTab)
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

    await userEvent.click(canvas.getByRole("button", { name: "Browse plugins" }));
    await expect(canvas.getByRole("tab", { name: "Browse" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(canvas.getByText("No registry entries loaded.")).toBeVisible();
    await selectRegistryTab(canvas, "Updates");
    await expect(canvas.getByRole("tab", { name: "Updates" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(
      canvas.getByRole("heading", { name: "You’re up to date" }),
    ).toBeVisible();
    await expect(canvas.getByText("No plugin updates available.")).toBeVisible();
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
    await expect(canvas.getByText("Official", { selector: "span" })).toBeVisible();
    await expect(canvas.getByText("Locked", { selector: "span" })).toBeVisible();
  },
};

export const BrowseDetailsAndReadme: Story = {
  args: { scenario: "catalog", section: "plugin-registry" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await selectRegistryTab(canvas, "Browse");

    const sourceEditorCard = canvas
      .getByRole("heading", { name: "Source Editor" })
      .closest("article");
    expect(sourceEditorCard).not.toBeNull();
    await expect(
      within(sourceEditorCard!).getByRole("button", { name: "Installed" }),
    ).toBeDisabled();

    const storyWindow = canvasElement.ownerDocument.defaultView!;
    const originalFetch = storyWindow.fetch;
    storyWindow.fetch = async (input) => {
      if (String(input).includes("story.invalid/v1/readmes/")) {
        return new Response(
          "# Graph plugin\n\n**README rendering is supplied by the application.**",
          { status: 200, headers: { "content-type": "text/markdown" } },
        );
      }
      return originalFetch(input);
    };
    try {
      const graphCard = canvas
        .getByRole("heading", { name: "Graph" })
        .closest("article");
      expect(graphCard).not.toBeNull();
      await userEvent.click(
        within(graphCard!).getByRole("button", { name: "Details" }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await waitFor(() => {
        expect(body.getByRole("dialog")).toBeVisible();
        expect(body.getByRole("heading", { name: "Graph plugin" })).toBeVisible();
      });
      await expect(body.getByText("Browse results")).toBeVisible();
      await expect(body.getAllByText("Version 0.2.0")[0]).toBeVisible();
      await expect(
        body.getByText("README rendering is supplied by the application."),
      ).toBeVisible();
      await expect(
        body.getAllByRole("button", { name: "Install" })[0],
      ).toBeEnabled();
    } finally {
      storyWindow.fetch = originalFetch;
    }
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

    await selectRegistryTab(canvas, "Installed");
    await userEvent.click(
      canvas.getByRole("button", { name: "Uninstall lapis-graph" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("alertdialog")).toBeVisible();
    await expect(body.getByText(/Uninstall lapis-graph\?/)).toBeVisible();
    await expect(body.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(body.getByRole("button", { name: "Uninstall" })).toBeVisible();
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
    await expect(canvas.getByTestId("plugin-bundle-install-calls")).toHaveTextContent(
      "0",
    );

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
      expect(canvas.getByTestId("plugin-bundle-install-calls")).toHaveTextContent(
        "1",
      );
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
    await waitFor(() => {
      expect(canvas.getByText("Plugin registry unavailable")).toBeVisible();
    });
    await expect(
      canvas.getByText("The registry signature could not be verified."),
    ).toBeVisible();
  },
};

export const CoreTogglesOptionsRestartAndDiagnostics: Story = {
  args: { scenario: "catalog", section: "core-plugins" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expect(canvas.getByRole("heading", { name: "Installed Core Plugins" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Options for Source Editor" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Restart Source Editor" })).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", { name: "Expand Source Editor details" }),
    );
    await expect(canvas.getAllByText("Runtime entry")[0]).toBeVisible();
    await userEvent.click(canvas.getByRole("switch", { name: "Disable Source Editor" }));
    await waitFor(() => {
      expect(canvas.getByRole("switch", { name: "Enable Source Editor" })).toBeVisible();
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

    await userEvent.click(canvas.getByRole("button", { name: "Browse plugins" }));
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
    await expect(canvas.getByText("Trusted", { selector: "span" })).toBeVisible();
    await expect(
      canvas.getByText(
        "Community plugins and desktop capabilities can run in this vault.",
      ),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Revoke" })).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Trust workspace" }),
    ).toBeNull();
    await expect(canvas.getByRole("heading", { name: "Community Example" })).toBeVisible();
    await expect(canvas.getByTestId("failed-plugin-state")).toHaveTextContent(
      "failed: The plugin runtime entry could not be loaded.",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Expand Failed Community Plugin details" }),
    );
    await expect(
      canvas.getByText(/The plugin runtime entry could not be loaded\./),
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
