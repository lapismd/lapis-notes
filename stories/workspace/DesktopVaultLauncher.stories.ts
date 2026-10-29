import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { VaultProfile } from "@lapis-notes/api";
import {
  DesktopVaultLauncher,
  type DesktopVaultLauncherHost,
} from "@lapis-notes/workspace";

const profiles: VaultProfile[] = Array.from({ length: 6 }, (_, index) => ({
  id: `vault-${index}`,
  name: index === 5 ? "Research café" : `Notes ${index + 1}`,
  kind: "desktop-folder",
  handle: { rootPath: `/notes/${index + 1}` },
  createdAt: 1,
  updatedAt: 1,
}));
function host(recents: VaultProfile[] = []): DesktopVaultLauncherHost {
  return {
    listProfiles: async () => recents,
    getAppearance: async () => "system",
    saveAppearance: fn(async () => {}),
  };
}
const source = `<script lang="ts">
  import { DesktopVaultLauncher, type DesktopVaultLauncherHost } from "@lapis-notes/workspace";
  import type { VaultProfile } from "@lapis-notes/api";
  // The native host supplies its own picker, session lifecycle and profile store.
  let { host, onCreate, onOpen, onOpenRecent }: {
    host: DesktopVaultLauncherHost;
    onCreate(): Promise<void>;
    onOpen(): Promise<void>;
    onOpenRecent(profile: VaultProfile): Promise<void>;
  } = $props();
</script>
<DesktopVaultLauncher status="landing" {host} {onCreate} {onOpen} {onOpenRecent} />`;
const meta = {
  title: "Workspace/Desktop Vault Launcher",
  component: DesktopVaultLauncher,
  tags: ["test", "visual-pending"],
  args: {
    status: "landing",
    host: host(),
    onCreate: fn(async () => {}),
    onOpen: fn(async () => {}),
    onOpenRecent: fn(async () => {}),
  },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: { source: { code: source, language: "svelte", type: "code" } },
  },
} satisfies Meta<typeof DesktopVaultLauncher>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NewVault: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Deno's empty chooser opens and creates folders through the host's native actions.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Create a vault" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: /Create New Vault/ }),
    );
    await expect(args.onCreate).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: /Open Vault/ }));
    await expect(args.onOpen).toHaveBeenCalledOnce();
  },
};
export const RecentProjects: Story = {
  args: { host: host(profiles) },
  parameters: {
    docs: {
      description: {
        story:
          "The first four projects and searchable View all dialog share the original Deno presentation.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Open a vault" }),
    ).toBeVisible();
    expect(
      canvasElement.querySelectorAll('[data-ui-part="recent-open"]'),
    ).toHaveLength(4);
    await userEvent.click(canvas.getByRole("button", { name: "View all" }));
    const body = within(canvasElement.ownerDocument.body);
    const input = await body.findByRole("combobox", {
      name: "Search recent vaults",
    });
    await userEvent.type(input, "Research");
    const entry = await body.findByRole("option", { name: /Research café/ });
    await userEvent.click(entry);
    await expect(args.onOpenRecent).toHaveBeenCalledWith(profiles[5]);
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      ),
    );
  },
};
export const Appearance: Story = {
  args: { host: host() },
  parameters: {
    docs: {
      description: {
        story:
          "Desktop Settings persists appearance through the injected host and applies the Lapis palette.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Settings" }));
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(
      await body.findByRole("dialog", { name: "Desktop Settings" }),
    );
    await userEvent.click(dialog.getByRole("button", { name: /^Dark/ }));
    await expect(args.host.saveAppearance).toHaveBeenCalledWith("dark");
    expect(
      canvasElement.ownerDocument.documentElement.classList.contains("dark"),
    ).toBe(true);
    await userEvent.click(
      dialog.getByRole("button", { name: /^Match System/ }),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      ),
    );
  },
};
export const HostFailure: Story = {
  args: {
    status: "error",
    errorMessage: "The vault folder is unavailable. Choose another folder.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "A recoverable native picker failure stays on the shared chooser with usable actions.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "The vault folder is unavailable",
    );
    await expect(
      canvas.getByRole("button", { name: /Open Vault/ }),
    ).toBeEnabled();
  },
};
export const ProfileActions: Story = {
  args: {
    host: {
      ...host(profiles),
      copyId: fn(async () => {}),
      rename: fn(async () => {}),
      remove: fn(async () => {}),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Hosts explicitly opt into profile actions; unavailable native actions remain absent.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Open actions for Notes 1" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Copy vault ID" }),
    );
    await expect(args.host.copyId).toHaveBeenCalledWith(profiles[0]);
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent("Vault ID copied"),
    );
    await waitFor(() =>
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      ),
    );
  },
};
