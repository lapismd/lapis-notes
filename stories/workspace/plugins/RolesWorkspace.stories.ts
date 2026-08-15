import type { App } from "@lapis-notes/api";
import { parseRoleDocument } from "@lapis-notes/lapis-plugin-cv-roles";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceStoryMeta } from "../_shared";
import { RolesWorkspaceExample } from "./RolesWorkspace.example-sources";
import RolesWorkspaceDemo from "./RolesWorkspaceDemo.svelte";

const meta = {
  title: "Workspace/Plugins/Roles",
  component: RolesWorkspaceDemo,
} satisfies Meta<typeof RolesWorkspaceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const applicationsMeta = workspaceStoryMeta(
  "workspace-plugins-roles-applications",
  "A real App restores the aggregate Roles view, persists an application move to role.md, uses the exact role.md association, follows a linked CV, and returns through roles:open.",
  "/visual-baselines/stories/workspace/plugins/roles-applications-chromium.png",
);

function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="roles-workspace-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The Roles workspace story has no active Lapis app");
  }
  return root.__lapisApp;
}

export const Applications: Story = {
  ...applicationsMeta,
  parameters: {
    ...applicationsMeta.parameters,
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
    docs: {
      ...applicationsMeta.parameters.docs,
      source: {
        code: RolesWorkspaceExample,
        language: "svelte",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("roles-workspace-status")).toHaveTextContent(
          "ready",
        );
      },
      { timeout: 8_000 },
    );

    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("roles")).toBe(true);
    expect(app.commands.commands["roles:open"]).toBeTruthy();
    expect(app.workspace.activeLeaf?.view.getViewType()).toBe("roles");
    expect(app.workspace.getLeavesOfType("roles")).toHaveLength(1);

    const saved = canvas.queryByRole("button", {
      name: /Expand Saved, 1 applications/,
    });
    if (saved) await userEvent.click(saved);
    const roleCard = await canvas.findByRole("button", {
      name: /Open application .*Engineering Manager, Infrastructure at Atlas AI/,
    });
    expect(roleCard).toBeTruthy();
    const roleFile = app.vault.getFileByPath("Roles/atlas-platform/role.md");
    expect(roleFile).toBeTruthy();
    expect(app.workspace.determineViewTypeForPath(roleFile!.path)).toBe("role");
    const roleLeaf = app.workspace.getLeavesOfType("role")[0];
    expect(roleLeaf).toBeTruthy();
    await userEvent.click(
      canvas.getByRole("button", { name: "role.md" }),
    );
    await waitFor(() => {
      expect(app.workspace.activeLeaf?.view.getViewType()).toBe("role");
      expect(
        canvas.getByRole("heading", {
          name: "Engineering Manager, Infrastructure",
        }),
      ).toBeTruthy();
    });

    await userEvent.click(
      canvas.getByRole("button", { name: "Application status" }),
    );
    await userEvent.click(canvas.getByRole("option", { name: "Applied" }));
    await waitFor(async () => {
      const document = parseRoleDocument(
        roleFile!.path,
        await app.vault.read(roleFile!),
      );
      expect(document.role?.status).toBe("applied");
    }, { timeout: 4_000 });

    await userEvent.click(canvas.getByRole("button", { name: "Open linked CV" }));
    await waitFor(() => {
      expect(app.workspace.activeLeaf?.view.getViewType()).toBe("cv");
      expect(canvas.getByTestId("cv-workspace")).toBeTruthy();
    });

    await app.commands.executeCommand("roles:open");
    expect(app.workspace.getLeavesOfType("roles")).toHaveLength(1);
    await userEvent.click(canvas.getByRole("button", { name: "Roles" }));
    await waitFor(() => {
      expect(app.workspace.activeLeaf?.view.getViewType()).toBe("roles");
      expect(canvas.getByRole("region", { name: "Applications board" })).toBeTruthy();
    });
  },
};
