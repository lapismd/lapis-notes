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
    await expect(
      canvas.getByText("No installed registry or community plugins."),
    ).toBeVisible();

    await selectRegistryTab(canvas, "Browse");
    await expect(canvas.getByText("No registry entries loaded.")).toBeVisible();
    await selectRegistryTab(canvas, "Updates");
    await expect(canvas.getByText("No plugin updates available.")).toBeVisible();
    await selectRegistryTab(canvas, "Sources");
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

export const CommunityTrustToggleAndFailure: Story = {
  args: { scenario: "community", section: "community-plugins" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitForReady(canvas);
    await expect(canvas.getByRole("heading", { name: "Workspace Trust" })).toBeVisible();
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
    await userEvent.click(canvas.getByRole("button", { name: "Revoke trust" }));
    await waitFor(() => {
      expect(canvas.getByText(/This vault is untrusted/)).toBeVisible();
    });
  },
};
