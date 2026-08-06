import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import TableDndDemo from "./TableDndDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Table DnD",
  component: TableDndDemo,
} satisfies Meta<typeof TableDndDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TableDnd: Story = {
  ...apiStoryMeta(
    "api-table-dnd",
    "Table drag grips and reorder helpers used by api settings arrays.",
    { baselineImage: "/visual-baselines/stories/api/table-dnd-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
      "dragType: settings-table-row",
    );
    await expect(canvas.getByRole("button", { name: "Reorder Notes" })).toBeVisible();
  },
};
