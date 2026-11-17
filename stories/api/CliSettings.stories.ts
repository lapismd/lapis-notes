import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { WorkspaceSettingsSurface } from "@lapismd/design-core/workspace/settings";
import type { CliDownload, CliSettingsHost } from "@lapis-notes/ui/cli";
import CliSettingsDemo from "./CliSettingsDemo.svelte";

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

function appStory(host: CliSettingsHost) {
  return () => ({ Component: CliSettingsDemo, props: { host } });
}

async function expectAppSettings(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(
    await canvas.findByRole("button", { name: "General", exact: true }),
  ).toHaveAttribute("data-active", "true");
  await expect(
    canvas.getByRole("heading", { name: "Advanced", exact: true }),
  ).toBeVisible();
  const refresh = canvas.getByRole("button", { name: "Refresh status" });
  await expect(refresh).toHaveAttribute("data-variant", "default");
  await expect(refresh.querySelector("svg")).not.toBeNull();
  return canvas;
}

async function expectAlignedSecondaryAction(
  canvas: ReturnType<typeof within>,
  name: string,
) {
  const action = await canvas.findByRole("button", { name });
  const refresh = canvas.getByRole("button", { name: "Refresh status" });
  await expect(action).toHaveAttribute("data-variant", "secondary");
  const card = action.closest(".ui-workspace-settings__schema-body");
  await expect(getComputedStyle(action).backgroundColor).not.toBe(
    card ? getComputedStyle(card).backgroundColor : "",
  );
  await expect(
    Math.abs(
      action.getBoundingClientRect().width -
        refresh.getBoundingClientRect().width,
    ),
  ).toBeLessThan(1);
  return action;
}

async function expectStatusPresentation(
  canvasElement: HTMLElement,
  label: string,
  variant: string,
) {
  const canvas = within(canvasElement);
  const badgeText = await canvas.findByText(label);
  const badge = badgeText.closest('[data-ui-component="badge"]');
  await expect(badge).toHaveAttribute("data-variant", variant);
  await expect(badge?.querySelector("svg")).not.toBeNull();
  await expect(badge).toHaveTextContent("v0.1.0");
  const path = canvas
    .getByText("/home/example/.local/bin/lapis")
    .closest(".status-path");
  const control = path?.closest(".ui-workspace-setting-item__control");
  await expect(path).not.toBeNull();
  await expect(
    Math.abs(
      (path?.getBoundingClientRect().width ?? 0) -
        (control?.getBoundingClientRect().width ?? 0),
    ),
  ).toBeLessThan(1);
}

const meta = {
  title: "API/CLI Settings",
  component: WorkspaceSettingsSurface,
  tags: ["autodocs", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: '<script>\n  import { onDestroy } from "svelte";\n  import { WorkspaceSettingsSurface } from "@lapismd/design-core/workspace/settings";\n  import { registerCliSettings } from "@lapis-notes/ui/cli";\n  export let controller;\n  export let host;\n  const dispose = registerCliSettings(controller, host);\n  onDestroy(dispose);\n</script>\n<WorkspaceSettingsSurface {controller} />',
      },
    },
  },
} satisfies Meta<typeof WorkspaceSettingsSurface>;
export default meta;
type Story = StoryObj;

export const InstallAndUninstall: Story = {
  render: appStory(desktop()),
  parameters: {
    docs: {
      description: {
        story:
          "The real General → Advanced settings composition provides explicit per-user setup and removal while retaining application data.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await expectAppSettings(canvasElement);
    const install = await expectAlignedSecondaryAction(canvas, "Install CLI");
    const restBackground = getComputedStyle(install).backgroundColor;
    await userEvent.hover(install);
    await waitFor(() =>
      expect(getComputedStyle(install).backgroundColor).not.toBe(
        restBackground,
      ),
    );
    await userEvent.unhover(install);
    await expect(install.querySelector("svg")).not.toBeNull();
    await userEvent.click(install);
    const page = within(canvasElement.ownerDocument.body);
    const setup = await page.findByRole("dialog");
    await expect(
      within(setup).getByRole("combobox", { name: "Shell PATH setup" }),
    ).toHaveTextContent("Leave shell configuration unchanged");
    await userEvent.click(
      within(setup).getByRole("button", { name: "Install CLI" }),
    );
    await waitFor(() =>
      expect(page.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const uninstall = await canvas.findByRole("button", {
      name: "Uninstall CLI",
    });
    await expectAlignedSecondaryAction(canvas, "Uninstall CLI");
    await expect(uninstall.querySelector("svg")).not.toBeNull();
    await userEvent.click(uninstall);
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
  render: appStory(desktop("installed")),
  parameters: {
    docs: {
      description: {
        story:
          "An installed command displays its actual destination and verification command in the app settings surface.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await expectAppSettings(canvasElement);
    await expectStatusPresentation(canvasElement, "Installed", "default");
    await expect(
      canvasElement.querySelector(
        '[data-ui-component="badge"][data-tone="success"]',
      ),
    ).not.toBeNull();
    await expectAlignedSecondaryAction(canvas, "Uninstall CLI");
  },
};

export const NeedsRepair: Story = {
  render: appStory(desktop("broken")),
  parameters: {
    docs: {
      description: { story: "A missing owned command can be repaired." },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await expectAppSettings(canvasElement);
    await expectStatusPresentation(canvasElement, "Needs repair", "default");
    await expect(
      canvasElement.querySelector(
        '[data-ui-component="badge"][data-tone="warning"]',
      ),
    ).not.toBeNull();
    const repair = await expectAlignedSecondaryAction(canvas, "Repair CLI");
    await expect(repair.querySelector("svg")).not.toBeNull();
    await expect(repair).toHaveAttribute("data-tone", "warning");
  },
};

export const Conflict: Story = {
  render: appStory(desktop("conflict")),
  parameters: {
    docs: { description: { story: "A foreign command blocks installation." } },
  },
  play: async ({ canvasElement }) => {
    const canvas = await expectAppSettings(canvasElement);
    const install = await expectAlignedSecondaryAction(canvas, "Install CLI");
    await expect(install).toBeDisabled();
  },
};

export const Failure: Story = {
  render: appStory(desktop("not-installed", true)),
  parameters: {
    docs: {
      description: {
        story: "Installation failures remain visible and retryable.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await expectAppSettings(canvasElement);
    await expectAlignedSecondaryAction(canvas, "Install CLI");
    await userEvent.click(
      await canvas.findByRole("button", { name: "Install CLI" }),
    );
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      within(await page.findByRole("dialog")).getByRole("button", {
        name: "Install CLI",
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
    const failure = await canvas.findByRole("alert");
    const setting = failure.closest('[data-setting-id="cli.installation"]');
    const description = setting?.querySelector(
      ".ui-workspace-setting-item__info p",
    );
    const alertDescription = failure.querySelector(
      '[data-ui-part="alert-description"]',
    );
    await expect(failure).toHaveAttribute("data-variant", "destructive");
    await expect(failure.querySelector("svg")).not.toBeNull();
    await expect(
      Math.abs(
        failure.getBoundingClientRect().width -
          (setting?.getBoundingClientRect().width ?? 0),
      ),
    ).toBeLessThan(1);
    await expect(getComputedStyle(alertDescription!).fontFamily).toBe(
      getComputedStyle(description!).fontFamily,
    );
    await expect(
      Number.parseFloat(getComputedStyle(alertDescription!).fontSize),
    ).toBeLessThanOrEqual(
      Number.parseFloat(getComputedStyle(description!).fontSize),
    );
  },
};

const browserDownloads: CliDownload[] = [
  {
    target: "aarch64-apple-darwin",
    file: "lapis-v0.1.0-macos-arm64.tar.gz",
    url: "https://example.com/lapis-macos-arm64.tar.gz",
    sha256: "a".repeat(64),
  },
  {
    target: "aarch64-unknown-linux-gnu",
    file: "lapis-v0.1.0-linux-arm64.tar.gz",
    url: "https://example.com/lapis-linux-arm64.tar.gz",
    sha256: "b".repeat(64),
  },
  {
    target: "x86_64-unknown-linux-gnu",
    file: "lapis-v0.1.0-linux-x64.tar.gz",
    url: "https://example.com/lapis-linux-x64.tar.gz",
    sha256: "c".repeat(64),
  },
];

export const BrowserDownload: Story = {
  render: appStory({ downloads: async () => browserDownloads }),
  play: async ({ canvasElement }) => {
    const canvas = await expectAppSettings(canvasElement);
    const platform = await canvas.findByRole("combobox", { name: "Platform" });
    await expect(
      canvas.getByRole("heading", {
        name: "Browser installation",
        exact: true,
      }),
    ).toBeVisible();
    await expect(platform).not.toHaveTextContent(
      "Choose your operating system and architecture",
    );
    const selectedPlatform = platform.textContent?.trim() ?? "";
    await expect(selectedPlatform).not.toBe("");
    await expect(
      await canvas.findByRole("button", {
        name: `Download ${selectedPlatform} archive`,
      }),
    ).toBeVisible();
    await expect(platform).not.toHaveTextContent("Lapis CLI");
    await expect(platform.querySelectorAll("svg")).toHaveLength(2);
    await expect(
      canvasElement.querySelector('[data-setting-id="cli.download"]'),
    ).toBeNull();
    await expect(
      canvas.getByRole("button", { name: /Copy full SHA-256 checksum/ }),
    ).toBeVisible();
    const codeBlock = canvasElement.querySelector(
      '[data-ui-component="code-block"][data-language="bash"]',
    );
    await expect(codeBlock).not.toBeNull();
    const commandsControl = codeBlock?.closest(
      ".ui-workspace-setting-item__control",
    );
    await expect(
      Math.abs(
        (codeBlock?.getBoundingClientRect().width ?? 0) -
          (commandsControl?.getBoundingClientRect().width ?? 0),
      ),
    ).toBeLessThan(1);
    await expect(
      codeBlock?.querySelector(".ui-code-token-string"),
    ).not.toBeNull();
    await expect(
      codeBlock?.querySelector(".ui-code-token-comment"),
    ).not.toBeNull();
    await expect(
      canvas.queryByRole("button", { name: "Install CLI" }),
    ).toBeNull();
  },
  parameters: {
    docs: {
      description: {
        story:
          "Browser setup preselects a matching release when the browser platform is unambiguous, while retaining an explicit Design Core platform picker, Bash instructions and checksum copy action.",
      },
    },
  },
};
