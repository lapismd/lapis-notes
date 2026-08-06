import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import SelectDemo from "./SelectDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Select",
  component: SelectDemo,
} satisfies Meta<typeof SelectDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Select: Story = {
  ...apiStoryMeta("api-select", "Select used by api configuration and menus.", { baselineImage: "/visual-baselines/stories/api/select-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    // bits-ui select trigger is a button with listbox popup, not combobox.
    await userEvent.click(canvas.getByRole("button", { name: "Workspace" }));
    await userEvent.click(await body.findByRole("option", { name: "Daily" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
        "selection: Daily",
      ),
    );
  },
};
