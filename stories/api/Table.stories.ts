import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import TableDemo from "./TableDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Table",
  component: TableDemo,
} satisfies Meta<typeof TableDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Table: Story = {
  ...apiStoryMeta("api-table", "Table primitives used by api settings grids.", { baselineImage: "/visual-baselines/stories/api/table-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("cell", { name: "Notes" })).toBeVisible();
    await userEvent.click(canvas.getByRole("switch", { name: "Notes enabled" }));
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("notes: off");
  },
};
