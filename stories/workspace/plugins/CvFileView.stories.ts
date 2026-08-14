import type { App } from "@lapis-notes/api";
import { parseCvYaml } from "@lapis-notes/roles";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceStoryMeta } from "../_shared";
import CvFileViewDemo from "./CvFileViewDemo.svelte";
import { CvFileViewExample } from "./CvFileView.example-sources";

const meta = {
  title: "Workspace/Plugins/CV",
  component: CvFileViewDemo,
} satisfies Meta<typeof CvFileViewDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const fileViewMeta = workspaceStoryMeta(
  "workspace-plugins-cv-file-view",
  "A real App registers the CV plugin, restores a persisted sample.cv.yml leaf, and mounts the CV FileView with generated preview.",
  "/visual-baselines/stories/workspace/plugins/cv-file-view-chromium.png",
);

function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="cv-file-view-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The CV FileView story has no active Lapis app");
  }
  return root.__lapisApp;
}

export const FileView: Story = {
  ...fileViewMeta,
  parameters: {
    ...fileViewMeta.parameters,
    docs: {
      ...fileViewMeta.parameters.docs,
      source: {
        code: CvFileViewExample,
        language: "svelte",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("cv-file-view-status")).toHaveTextContent(
          "ready",
        );
      },
      { timeout: 8_000 },
    );

    await waitFor(() => {
      expect(
        demoApp(canvasElement).workspace.activeLeaf?.view.getViewType(),
      ).toBe("cv");
      expect(canvas.getByTestId("cv-workspace")).toBeTruthy();
      expect(canvas.getByTestId("cv-preview")).toBeTruthy();
    });

    const name = within(canvas.getByTestId("structured-cv")).getAllByRole(
      "textbox",
      { name: "Name" },
    )[0];
    await userEvent.clear(name);
    await userEvent.type(name, "Updated Person");
    const app = demoApp(canvasElement);
    const file = app.vault.getFileByPath("sample.cv.yml");
    expect(file).toBeTruthy();
    await waitFor(
      async () => {
        const saved = await app.vault.read(file!);
        const parsed = parseCvYaml(saved);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) return;
        expect(parsed.source.cv.name).toBe("Updated Person");
        expect(parsed.source.evidence?.technologies).toEqual(["Svelte"]);
        expect(parsed.source.evidence?.answer_method_defaults).toEqual({
          style: "concise",
        });
      },
      { timeout: 4_000 },
    );
  },
};
