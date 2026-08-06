import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import ModalDemo from "./ModalDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Modal",
  component: ModalDemo,
} satisfies Meta<typeof ModalDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Modal: Story = {
  ...apiStoryMeta("api-modal", "Modal dialog used by api prompt surfaces.", { baselineImage: "/visual-baselines/stories/api/modal-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open modal" }));
    await waitFor(async () => {
      await expect(body.getByText("Workspace settings")).toBeVisible();
      await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("open");
    });
  },
};
