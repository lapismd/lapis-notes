import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import DateTimePickerDialogDemo from "./DateTimePickerDialogDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Date Time Picker Dialog",
  component: DateTimePickerDialogDemo,
} satisfies Meta<typeof DateTimePickerDialogDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DateTimePickerDialog: Story = {
  ...apiStoryMeta(
    "api-date-time-picker-dialog",
    "Date/time picker dialog used by api date settings.",
    { baselineImage: "/visual-baselines/stories/api/date-time-picker-dialog-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Pick date" }));
    await expect(await body.findByRole("heading", { name: "Pick date & time" })).toBeVisible();
    await userEvent.click(await body.findByRole("button", { name: "Apply" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
        "applied: 2026-08-06T12:00",
      ),
    );
  },
};
