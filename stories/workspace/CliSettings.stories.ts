import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { CliSettings, type CliSettingsHost } from "@lapis-notes/workspace";

function desktop(
  state:
    | "not-installed"
    | "installed"
    | "broken"
    | "conflict" = "not-installed",
  fail = false,
): CliSettingsHost {
  let current = state;
  return {
    installation: {
      status: async () => ({
        state: current,
        destination: "/home/example/.local/bin/lapis",
        version: "0.1.0",
      }),
      install: async () => {
        if (fail) throw Error("Installation directory is not writable");
        current = "installed";
      },
      uninstall: async () => {
        current = "not-installed";
      },
    },
  };
}
const meta = {
  title: "Workspace/CLI Settings",
  component: CliSettings,
  tags: ["autodocs", "visual-pending"],
  parameters: {
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: '<script>\n  import { CliSettings } from "@lapis-notes/workspace";\n  // Supply the host-owned installation port.\n  export let host;\n</script>\n<CliSettings {host} />',
      },
    },
  },
} satisfies Meta<typeof CliSettings>;
export default meta;
type Story = StoryObj<typeof meta>;
export const InstallAndUninstall: Story = {
  args: { host: desktop() },
  parameters: {
    docs: {
      description: {
        story: "Explicit per-user setup and removal retain application data.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Install CLI" })).toBeEnabled(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Install CLI" }));
    const page = within(canvasElement.ownerDocument.body);
    const setup = await page.findByRole("dialog");
    expect(within(setup).getByLabelText("Shell PATH setup")).toHaveValue(
      "none",
    );
    await userEvent.click(
      within(setup).getByRole("button", { name: "Register" }),
    );
    await waitFor(() =>
      expect(page.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Uninstall CLI" }),
    );
    const removal = await page.findByRole("dialog");
    expect(
      within(removal).getByLabelText("Remove unchanged Lapis PATH entries"),
    ).not.toBeChecked();
    await userEvent.click(
      within(removal).getByRole("button", { name: "Uninstall", exact: true }),
    );
    await expect(
      await canvas.findByRole("button", { name: "Install CLI" }),
    ).toBeEnabled();
  },
};
export const Installed: Story = {
  args: { host: desktop("installed") },
  parameters: {
    docs: {
      description: {
        story:
          "An installed command displays its actual destination and verification command.",
      },
    },
  },
};
export const NeedsRepair: Story = {
  args: { host: desktop("broken") },
  parameters: {
    docs: {
      description: { story: "A missing owned command can be repaired." },
    },
  },
};
export const Conflict: Story = {
  args: { host: desktop("conflict") },
  parameters: {
    docs: { description: { story: "A foreign command blocks installation." } },
  },
};
export const Failure: Story = {
  args: { host: desktop("not-installed", true) },
  parameters: {
    docs: {
      description: {
        story: "Installation failures remain visible and retryable.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Install CLI" })).toBeEnabled(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Install CLI" }));
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      within(await page.findByRole("dialog")).getByRole("button", {
        name: "Register",
      }),
    );
    await expect(await page.findByRole("alert")).toHaveTextContent(
      "not writable",
    );
    await userEvent.click(
      within(await page.findByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
  },
};
export const BrowserDownload: Story = {
  args: {
    host: {
      downloads: async () => [
        {
          label: "Lapis CLI · Linux x64",
          url: "https://example.com/lapis.tar.gz",
          sha256: "a".repeat(64),
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const platform = await canvas.findByRole("combobox", { name: "Platform" });
    await userEvent.selectOptions(platform, "https://example.com/lapis.tar.gz");
    await expect(
      await canvas.findByRole("link", { name: /Download Lapis CLI/ }),
    ).toHaveAttribute("href", "https://example.com/lapis.tar.gz");
    await expect(canvas.getByText("a".repeat(64))).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Install CLI" }),
    ).toBeNull();
  },
  parameters: {
    docs: {
      description: {
        story:
          "Browser setup supplies a download and manual installation/removal commands without claiming local status.",
      },
    },
  },
};
