import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { WorkspaceShell } from "@lapis-notes/workspace";
import type { App } from "@lapis-notes/api";
import EditingRecoveryDemo from "./editing-recovery/EditingRecoveryDemo.svelte";
import { WORKSPACE_SHELL_DOCS_STORY } from "./docs-parameters";
import { workspaceCatalogParameters } from "../catalog/catalog.mjs";
import "./Workspace.docs.css";

const meta = {
  title: "Workspace/Editing recovery",
  component: WorkspaceShell,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      story: WORKSPACE_SHELL_DOCS_STORY,
      source: {
        language: "svelte",
        type: "code",
        code: `<script module lang="ts">
  import { App, type VaultSession } from '@lapis-notes/api';
  import { MarkdownPlugin } from '@lapis-notes/markdown';

  // The host admits this existing vault and supplies its adapter, database
  // and nativeEditingIntents. The disposable catalog seeds Note.md there.
  export async function loadWorkspace(session: VaultSession) {
    const app = new App({ version: '0.0.1', session });
    app.plugins.registerCorePlugins([
      { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
    ]);
    await app.vault.load();
    await app.configuration.load();
    await app.plugins.loadPlugins({
      communityPlugins: 'disabled', optionalCorePlugins: 'configured',
    });
    await app.workspace.loadLayout();
    return app;
  }
  // Before unmounting/disposal, the host awaits
  // app.fileEditingSessions.preflightNativeRecovery();
  // A refused leave keeps this same App and its Problems actions mounted.
</script>
<script lang="ts">
  import { WorkspaceShell } from '@lapis-notes/workspace';
  let { app }: { app: App } = $props();
</script>
<WorkspaceShell {app} />`,
      },
    },
  },
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof meta>;

async function ownedApp(canvasElement: HTMLElement) {
  let app!: App;
  await waitFor(() => {
    const frame = canvasElement.querySelector<HTMLElement>(
      '[data-editing-recovery-ready="true"]',
    );
    expect(
      frame?.querySelector('[data-app-shell-ready="true"]'),
    ).toBeInTheDocument();
    app = (frame as HTMLElement & { __lapisApp: App }).__lapisApp;
    expect(app).toBeDefined();
  });
  return app;
}

export const DetachedClaim: Story = {
  render: () => ({
    Component: EditingRecoveryDemo,
    props: { scenario: "detached" },
  }),
  parameters: {
    ...workspaceCatalogParameters("workspace-editing-recovery-detached"),
    visualDelta: {
      images: [
        "stories/workspace/editing-recovery/detached-claim-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "An unresolved claim appears in the existing Problems panel. Explicit recovery retains its dirty metadata; discard retires only the claim and preserves saved bytes.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const app = await ownedApp(canvasElement);
    const canvas = within(canvasElement);
    const message = await canvas.findByText(/Unresolved editing claim\./);
    await fireEvent.contextMenu(message);
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Review saved file",
      }),
    );
    await expect(
      await canvas.findByRole("heading", { name: "Saved note" }),
    ).toBeVisible();
    await fireEvent.contextMenu(canvas.getByText(/Unresolved editing claim\./));
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Recover editing claim",
      }),
    );
    await waitFor(() =>
      expect(
        app.fileEditingSessions.nativeRecovery?.snapshot().claims[0]?.detached,
      ).toBe(false),
    );
    await fireEvent.contextMenu(canvas.getByText(/Unresolved editing claim\./));
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Discard editing claim",
      }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByText(/Unresolved editing claim\./),
      ).not.toBeInTheDocument(),
    );
    expect(await app.vault.adapter.read("Note.md")).toContain("# Saved note");
  },
};

export const AdmissionFailure: Story = {
  render: () => ({
    Component: EditingRecoveryDemo,
    props: { scenario: "admission" },
  }),
  parameters: {
    ...workspaceCatalogParameters("workspace-editing-recovery-admission"),
    visualDelta: {
      images: [
        "stories/workspace/editing-recovery/admission-failure-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "A local initial admission failure is visible even though no native claim exists. The existing Problems menu retries that captured registration without replaying an operation.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const app = await ownedApp(canvasElement);
    const canvas = within(canvasElement);
    const message = await canvas.findByText(/Editing admission failed:/);
    await fireEvent.contextMenu(message);
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Retry editing admission",
      }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByText(/Editing admission failed:/),
      ).not.toBeInTheDocument(),
    );
    expect(app.fileEditingSessions.nativeIssues.entries).toEqual([]);
    expect(await app.vault.adapter.read("Note.md")).toContain("# Saved note");
  },
};

export const HandoffFailure: Story = {
  render: () => ({
    Component: EditingRecoveryDemo,
    props: { scenario: "handoff" },
  }),
  parameters: {
    ...workspaceCatalogParameters("workspace-editing-recovery-handoff"),
    visualDelta: {
      images: [
        "stories/workspace/editing-recovery/handoff-failure-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "A refused native handoff stays in Problems and keeps editable input protected. After the producer observes the external save, explicit retry releases protection without replaying the refused mutation. Visual review remains pending.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const app = await ownedApp(canvasElement);
    const canvas = within(canvasElement);
    const frame = canvasElement.querySelector<HTMLElement>(
      '[data-editing-recovery-ready="true"]',
    ) as HTMLElement & {
      __handoffFacts: { protected: number; mutations: number };
    };
    const issue = await canvas.findByText(/Editing handoff failed:/);
    expect(app.fileEditingSessions.nativeIssues.entries[0]).toMatchObject({
      phase: "handoff",
      status: "failed",
    });
    expect(frame.__handoffFacts.protected).toBe(1);
    expect(frame.__handoffFacts.mutations).toBe(0);
    await fireEvent.contextMenu(issue);
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Retry editing admission",
      }),
    );
    await waitFor(() => {
      expect(
        canvas.queryByText(/Editing handoff failed:/),
      ).not.toBeInTheDocument();
      expect(frame.__handoffFacts.protected).toBe(0);
    });
    expect(app.fileEditingSessions.nativeIssues.entries).toEqual([]);
    expect(frame.__handoffFacts.mutations).toBe(0);
    expect(await app.vault.adapter.read("Note.md")).toBe(
      "# External saved note\n\nAn outside edit is preserved.\n",
    );
  },
};
