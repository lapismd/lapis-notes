import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, within, waitFor } from "storybook/test";
import ConfirmDialogDemo from "./ConfirmDialogDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Confirm Dialog",
  component: ConfirmDialogDemo,
} satisfies Meta<typeof ConfirmDialogDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmDialog: Story = {
  ...apiStoryMeta(
    "api-confirm-dialog",
    "Confirm dialog used by api destructive prompts.",
    { baselineImage: "/visual-baselines/stories/api/confirm-dialog-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "Ask to confirm" }),
    );
    const dialog = await body.findByRole("dialog", { name: "Delete note?" });
    expect(dialog).toHaveAttribute("data-ui-component", "dialog");
    expect(dialog).toHaveAttribute("data-ui-part", "dialog-content");
    expect(dialog).toHaveAttribute("data-ui-confirm-dialog", "");
    expect(getComputedStyle(dialog).position).toBe("fixed");
    expect(getComputedStyle(dialog).backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
    expect(
      canvasElement.ownerDocument.body.querySelector(
        '[data-ui-component="dialog"][data-ui-part="dialog-overlay"]',
      ),
    ).not.toBeNull();
    await userEvent.click(await body.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
        "confirmed",
      ),
    );
  },
};

export const Cancel: Story = {
  ...apiStoryMeta(
    "api-confirm-dialog",
    "Confirm dialog cancel path updates status without confirming.",
    { skipVisual: true },
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    // fireEvent avoids pointer-events checks against leftover portal layers
    // from sibling stories sharing the document in the Vitest browser project.
    fireEvent.click(canvas.getByRole("button", { name: "Ask to confirm" }));
    await userEvent.click(await body.findByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
        "cancelled",
      ),
    );
  },
};
