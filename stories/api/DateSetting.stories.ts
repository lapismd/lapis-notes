import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import DateSettingDemo from "./DateSettingDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Date Setting",
  component: DateSettingDemo,
} satisfies Meta<typeof DateSettingDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DateSetting: Story = {
  ...apiStoryMeta(
    "api-date-setting",
    "Date/time settings via api date-setting (design-core forms DatePicker/TimePicker).",
    { baselineImage: "/visual-baselines/stories/api/date-setting-chromium.png" },
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
      "date: (empty); time: 12:00; legacy: 2026-01-15T14:30",
    );

    const dateTriggers = canvas.getAllByRole("button", { name: "Choose date" });
    await userEvent.click(dateTriggers[0]!);
    await userEvent.click(await body.findByRole("button", { name: "Today" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
        /date: \d{4}-\d{2}-\d{2}/,
      ),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Clear time" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
        "time: (empty)",
      ),
    );

    // Legacy datetime-local inbound value renders as the date part in the trigger.
    const legacyTrigger = canvas.getAllByRole("button", {
      name: "Choose date",
    }).at(-1);
    await expect(legacyTrigger).toBeVisible();
    await expect(legacyTrigger).toHaveTextContent(/Jan/);
  },
};
