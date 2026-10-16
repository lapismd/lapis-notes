import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, within } from "storybook/test";
import { DesktopWorkspaceStartup } from "@lapis-notes/workspace";
const meta = {
  title: "Workspace/Desktop Startup",
  component: DesktopWorkspaceStartup,
  tags: ["test", "visual-pending"],
  args: {
    tasks: [
      { id: "vault", label: "Open the vault", status: "complete" },
      {
        id: "plugins",
        label: "Load configured core plugins",
        status: "active",
        detail: "Loading Markdown",
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: '<script lang="ts">\n  import { DesktopWorkspaceStartup } from "@lapis-notes/workspace";\n</script>\n<DesktopWorkspaceStartup tasks={[{ id: "vault", label: "Open the vault", status: "active" }]} />',
      },
    },
  },
} satisfies Meta<typeof DesktopWorkspaceStartup>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Deno and Tauri share the Lapis visual and accessible phase progress.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("region", { name: "Opening Lapis Notes" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("progressbar", { name: "Startup progress" }),
    ).toBeVisible();
    expect(canvasElement.querySelector('[data-ui-part="logo"]')).not.toBeNull();
  },
};
export const Failure: Story = {
  args: {
    failure: {
      title: "Lapis Notes could not start",
      description: "The vault is unavailable",
      actions: [{ id: "back", label: "Back to vaults", onSelect: fn() }],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "The shared startup failure retains the host-provided recovery action.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("alert")).toBeVisible();
    await expect(
      within(canvasElement).getByRole("button", { name: "Back to vaults" }),
    ).toBeEnabled();
  },
};
