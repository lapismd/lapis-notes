import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import WorkspacePopoutDemo from "./WorkspacePopoutDemo.svelte";

const meta = {
  title: "Workspace/Popout acceptance",
  component: WorkspacePopoutDemo,
  tags: ["!autodocs", "visual-pending"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkspacePopoutDemo>;
export default meta;
export const SessionWindows: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-popup-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 45_000 },
    );
  },
};
