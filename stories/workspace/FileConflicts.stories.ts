import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { workspaceCatalogParameters } from "../catalog/catalog.mjs";
import FileConflictsDemo from "./file-conflicts/FileConflictsDemo.svelte";

const meta = {
  title: "Workspace/File conflicts",
  component: WorkspaceShell,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof meta>;

async function open(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  let app!: App;
  await waitFor(() => {
    const frame = canvasElement.querySelector<HTMLElement>(
      '[data-file-conflicts-ready="true"]',
    );
    app = (frame as HTMLElement & { __lapisApp: App })?.__lapisApp;
    expect(app?.fileEditingSessions.textConflicts.entries).toHaveLength(1);
  });
  const problem = await canvas.findByText(
    "File changed on disk. Review your draft before saving.",
  );
  await expect(problem).toBeVisible();
  await userEvent.click(problem);
  const review = await canvas.findByRole("region", {
    name: "File conflict: Note.md",
  });
  await expect(review).toBeVisible();
  const editor = await within(review).findByRole("textbox", { name: "Edit Merged version", exact: true }) as HTMLTextAreaElement;
  return { app, canvas, problem, review, editor };
}

export const EditAndSave: Story = {
  render: () => ({ Component: FileConflictsDemo }),
  parameters: {
    ...workspaceCatalogParameters("workspace-file-conflicts-edit-and-save"),
    visualDelta: {
      images: ["stories/workspace/file-conflicts/edit-and-save-chromium.png"],
    },
    docs: {
      description: {
        story:
          "A real stale writer reveals Problems. Its retained shared three-way review saves the edited centre through the captured guarded writer, then clears its diagnostic.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const { app, canvas, review, editor } = await open(canvasElement);
    expect(editor).not.toBeNull();
    await userEvent.click(editor!);
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await userEvent.type(
      editor!,
      "---\nstatus: reviewed\nowner: outside\n---\n# Reviewed note\n",
    );
    expect(
      editor instanceof HTMLTextAreaElement ? editor.value : editor.textContent,
    ).toContain("status: reviewed");
    await userEvent.click(
      within(review).getByRole("button", {
        name: "Save merged version",
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0),
    );
    expect(await app.vault.adapter.read("Note.md")).toContain(
      "status: reviewed",
    );
    expect(await app.vault.adapter.read("Note.md")).toContain("owner: outside");
    await waitFor(() =>
      expect(
        canvas.queryByText(
          "File changed on disk. Review your draft before saving.",
        ),
      ).not.toBeInTheDocument(),
    );
  },
};

export const CloseAndReopen: Story = {
  render: () => ({ Component: FileConflictsDemo }),
  parameters: {
    ...workspaceCatalogParameters("workspace-file-conflicts-close-and-reopen"),
    visualDelta: {
      images: [
        "stories/workspace/file-conflicts/close-and-reopen-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "Closing the layout-only review retains staged text and the unresolved writer. Reopening the same problem restores that result; only an explicit guarded save resolves it.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const { app, canvas, problem, review } = await open(canvasElement);
    await userEvent.click(
      within(review).getByRole("button", {
        name: "Accept All Incoming Changes from Left",
        exact: true,
      }),
    );
    const leaf = app.workspace.getLeavesOfType("desktop:file-conflict")[0];
    expect(leaf).toBeDefined();
    await getWorkspaceHostBinding(app.workspace).controller.workspace.closeLeaf(
      leaf.id,
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("region", { name: "File conflict: Note.md" }),
      ).not.toBeInTheDocument(),
    );
    expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(1);
    expect(await app.vault.adapter.read("Note.md")).toContain(
      "status: external",
    );
    await userEvent.click(problem);
    const reopened = await canvas.findByRole("region", {
      name: "File conflict: Note.md",
    });
    const staged = await within(reopened).findByRole("textbox", { name: "Edit Merged version", exact: true }) as HTMLTextAreaElement;
    await waitFor(() => expect(staged.value).toContain("status: local"));
    await userEvent.click(
      within(reopened).getByRole("button", {
        name: "Save merged version",
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0),
    );
    expect(await app.vault.adapter.read("Note.md")).toContain("status: local");
  },
};
