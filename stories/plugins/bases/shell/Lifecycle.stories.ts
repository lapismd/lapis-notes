import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { BasesViewType } from "@lapis-notes/bases";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../../workspace/docs-parameters";
import { basesEditorShellExampleSource } from "./Shell.example-sources";
import BasesEditorShellDemo from "./ShellDemo.svelte";

const meta = {
  title: "Plugins/Bases/Shell/Lifecycle",
  component: BasesEditorShellDemo,
  tags: ["visual-pending", "test"],
  parameters: {
    ...workspaceCatalogParameters("plugins-bases-shell-file-view"),
    layout: "fullscreen",
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      description: {
        component:
          "Real-App Bases shell lifecycle coverage uses the same Explorer-left and collapsed-Search-right composition as the desktop and mobile shell stories.",
      },
      source: {
        code: basesEditorShellExampleSource,
        language: "svelte",
        type: "code",
      },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
  },
} satisfies Meta<typeof BasesEditorShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="bases-editor-shell-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The Bases workspace story has no active Lapis app");
  }
  return root.__lapisApp;
}

export const FileView: Story = {
  parameters: {
    ...workspaceCatalogParameters("plugins-bases-shell-file-view"),
    docs: {
      description: {
        story:
          "A .base file restores through the real editor association, switches between source and preview, persists its view state, and reopens without changing the document.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/bases/shell/file-view-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    delete canvasElement.dataset.basesFileViewAcceptanceReady;
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvas.getByTestId("bases-editor-shell-status"),
        ).toHaveTextContent("ready"),
      { timeout: 8_000 },
    );
    const app = demoApp(canvasElement);
    const leaf = app.workspace.getLeavesOfType(BasesViewType)[0]!;
    const file = app.vault.getFileByPath("Bases/Projects.base")!;
    const contentBefore = await app.vault.read(file);

    expect(leaf.getViewState()).toMatchObject({
      type: BasesViewType,
      state: { file: file.path, mode: "preview" },
    });
    await leaf.view.setState({ ...leaf.view.getState(), mode: "source" });
    await waitFor(() =>
      expect(
        canvasElement.querySelector('.cm-editor[data-language="yaml"]'),
      ).toBeVisible(),
    );
    await leaf.view.setState({ ...leaf.view.getState(), mode: "preview" });
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-ui-component="bases-table-view"]'),
      ).toBeVisible(),
    );

    await leaf.setViewState({ type: "empty", state: {} });
    await leaf.openFile(file);
    await waitFor(() => {
      expect(leaf.getViewState()).toMatchObject({
        type: BasesViewType,
        state: { file: file.path },
      });
      expect(
        canvasElement.querySelector('[data-ui-component="bases-table-view"]'),
      ).toBeVisible();
    });
    expect(await app.vault.read(file)).toBe(contentBefore);
    canvasElement.dataset.basesFileViewAcceptanceReady = "true";
  },
};

export const DisableAndRestore: Story = {
  parameters: {
    ...workspaceCatalogParameters("plugins-bases-shell-disable-restore"),
    docs: {
      description: {
        story:
          "Managed-plugin settings disable an open Bases leaf into the persisted missing-view placeholder and restore it without changing plugin data or the .base document.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/bases/shell/disable-and-restore-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () =>
        expect(
          canvas.getByTestId("bases-editor-shell-status"),
        ).toHaveTextContent("ready"),
      { timeout: 8_000 },
    );
    const app = demoApp(canvasElement);
    const leaf = app.workspace.getLeavesOfType(BasesViewType)[0]!;
    const file = app.vault.getFileByPath("Bases/Projects.base")!;
    const contentBefore = await app.vault.read(file);
    const pluginDataBefore = structuredClone(
      app.configuration.getPluginData("bases"),
    );
    const managed = getWorkspaceHostBinding(app.workspace).controller
      .managedPlugins;

    await expect(managed.disable("lapis:bases")).resolves.toBe(true);
    await waitFor(() => {
      expect(leaf.getViewState()).toMatchObject({
        type: "empty",
        state: {
          __missingViewType: BasesViewType,
          file: "Bases/Projects.base",
          mode: "preview",
        },
      });
      expect(
        managed.states.find((entry) => entry.key === "lapis:bases"),
      ).toMatchObject({ enabled: false, status: "disabled" });
    });
    expect(await app.vault.read(file)).toBe(contentBefore);
    expect(app.configuration.getPluginData("bases")).toEqual(pluginDataBefore);

    await expect(managed.enable("lapis:bases")).resolves.toBe(true);
    await waitFor(() => {
      expect(leaf.view.getViewType()).toBe(BasesViewType);
      expect(leaf.getViewState()).toMatchObject({
        type: BasesViewType,
        state: { file: "Bases/Projects.base", mode: "preview" },
      });
      expect(
        managed.states.find((entry) => entry.key === "lapis:bases"),
      ).toMatchObject({ enabled: true, status: "enabled" });
    });
    expect(await app.vault.read(file)).toBe(contentBefore);
    expect(app.configuration.getPluginData("bases")).toEqual(pluginDataBefore);
  },
};
