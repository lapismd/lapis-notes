import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import WebVaultLauncher from "../../packages/web/src/WebVaultLauncher.svelte";
import { WORKSPACE_SHELL_DOCS_STORY } from "./docs-parameters";
import {
  webLauncherProfiles,
  webLauncherServices,
} from "./web-vault-launcher.fixture";

const source = `<script lang="ts">
  import WebVaultLauncher from "./WebVaultLauncher.svelte";
  import type { BrowserFileSystemDirectoryHandle, VaultProfile } from "@lapis-notes/api";
  // The existing WebVaultHost owns storage, transfers and session replacement.
  let { onCreate, onOpen, onImport, onOpenRecent, onClose } = $props<{
    onCreate(name: string): Promise<void>;
    onOpen(): Promise<void>;
    onImport(name: string, directory: BrowserFileSystemDirectoryHandle): Promise<void>;
    onOpenRecent(profile: VaultProfile): Promise<void>;
    onClose(): void;
  }>();
</script>
<WebVaultLauncher status="landing" {onCreate} {onOpen} {onImport} {onOpenRecent} {onClose} />`;

const meta = {
  title: "Workspace/Web Vault Launcher",
  component: WebVaultLauncher,
  tags: ["test", "visual-pending"],
  argTypes: { services: { control: false } },
  args: {
    status: "landing",
    services: webLauncherServices(),
    onCreate: fn(async () => {}),
    onOpen: fn(async () => {}),
    onImport: fn(async () => {}),
    onOpenRecent: fn(async () => {}),
    onClose: fn(),
  },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      story: WORKSPACE_SHELL_DOCS_STORY,
      source: { code: source, language: "svelte", type: "code" },
    },
  },
} satisfies Meta<typeof WebVaultLauncher>;
export default meta;
type Story = StoryObj<typeof meta>;

// Isolated Docs canvases mount together; keep their keyboard focus under reviewer's control.
function isDocsCanvas(element: HTMLElement): boolean {
  return (
    element.ownerDocument.defaultView?.frameElement?.id.startsWith(
      "iframe--",
    ) ?? false
  );
}

async function expectBoundedBrand(canvasElement: HTMLElement) {
  const logo = canvasElement.querySelector<HTMLImageElement>(
    ".web-vault-launcher__logo",
  );
  expect(logo).not.toBeNull();
  await waitFor(() => expect(logo!.naturalWidth).toBeGreaterThan(0));
  expect(logo!.getBoundingClientRect().width).toBeLessThanOrEqual(64);
  expect(logo!.getBoundingClientRect().height).toBeLessThanOrEqual(64);
  expect(
    canvasElement.querySelectorAll(
      '[data-ui-component="card"][data-ui-part="card"]',
    ),
  ).toHaveLength(2);
  const actionCopy = canvasElement.querySelector(
    ".web-vault-launcher__action-copy",
  );
  expect(getComputedStyle(actionCopy!).flexDirection).toBe("column");
}

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Desktop-aligned branded header and two-card layout with Web-owned OPFS creation, folder opening and import actions. Fixture services never access browser vault storage.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    if (isDocsCanvas(canvasElement)) return;
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Create a vault" }),
    ).toBeVisible();
    await expectBoundedBrand(canvasElement);
    await user.click(canvas.getByRole("button", { name: /Create New Vault/ }));
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(
      await body.findByRole("dialog", { name: "New Browser Vault" }),
    );
    await user.type(dialog.getByLabelText("Name"), "Story vault");
    await user.click(
      dialog.getByRole("button", { name: "Create vault", exact: true }),
    );
    await expect(args.onCreate).toHaveBeenCalledWith("Story vault");
    await waitFor(() => {
      expect(body.queryByRole("dialog")).not.toBeInTheDocument();
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      );
    });
    await user.click(canvas.getByRole("button", { name: /Open Folder/ }));
    await expect(args.onOpen).toHaveBeenCalledOnce();
    await user.click(canvas.getByRole("button", { name: /Import Vault/ }));
    const importDialog = within(
      await body.findByRole("dialog", { name: "Import Browser Vault" }),
    );
    await user.click(
      importDialog.getByRole("button", { name: "Import vault", exact: true }),
    );
    await expect(args.onImport).toHaveBeenCalledWith(
      "Imported Notes",
      expect.objectContaining({ kind: "directory", name: "Imported Notes" }),
    );
    await waitFor(() => {
      expect(body.queryByRole("dialog")).not.toBeInTheDocument();
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      );
    });
  },
};

export const RecentVaults: Story = {
  args: { services: webLauncherServices(webLauncherProfiles) },
  parameters: {
    docs: {
      description: {
        story:
          "Compact recent-vault rows match the desktop chooser. View all uses the production searchable Command View and the existing open callback.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    if (isDocsCanvas(canvasElement)) return;
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Open a vault" }),
    ).toBeVisible();
    await expectBoundedBrand(canvasElement);
    expect(
      canvasElement.querySelectorAll(".web-vault-launcher__recent-open"),
    ).toHaveLength(4);
    await user.click(canvas.getByRole("button", { name: "View all" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(
        body.getByRole("dialog", { name: "Recent Projects" }),
      ).toBeVisible(),
    );
    await user.type(
      await body.findByRole("combobox", { name: "Search recent vaults" }),
      "Research",
    );
    await user.click(
      await body.findByRole("option", { name: /Research café/ }),
    );
    await expect(args.onOpenRecent).toHaveBeenCalledWith(
      webLauncherProfiles[5],
    );
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      ),
    );
  },
};

export const ManageVaults: Story = {
  args: {
    services: webLauncherServices(webLauncherProfiles),
    canReturn: true,
    currentVaultId: webLauncherProfiles[0].id,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Manage Vaults retains the named return control and existing browser profile actions. The isolated rename store lets reviewers exercise the dialog without modifying real vaults.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    if (isDocsCanvas(canvasElement)) return;
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Open a vault" }),
    ).toBeVisible();
    await expectBoundedBrand(canvasElement);
    await user.click(
      canvas.getAllByRole("button", { name: /Open actions for/ })[0],
    );
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(
        body.getByRole("menuitem", { name: "Delete...", exact: true }),
      ).toBeVisible(),
    );
    await user.click(
      body.getByRole("menuitem", { name: "Rename...", exact: true }),
    );
    const dialog = within(
      await body.findByRole("dialog", { name: "Rename vault" }),
    );
    const input = dialog.getByLabelText("Name");
    await user.clear(input);
    await user.type(input, "Renamed notes");
    await user.click(dialog.getByRole("button", { name: "Save", exact: true }));
    await expect(await canvas.findByText("Renamed notes")).toBeVisible();
    await waitFor(() => {
      expect(body.queryByRole("dialog")).not.toBeInTheDocument();
      expect(canvasElement.ownerDocument.body.style.pointerEvents).not.toBe(
        "none",
      );
    });
    await user.click(
      canvas.getByRole("button", { name: "Return to previous vault" }),
    );
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};
