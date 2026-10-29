import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import SearchHighlightDemo from "./SearchHighlightDemo.svelte";
const meta = {
  title: "API/Search Highlight",
  component: SearchHighlightDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof SearchHighlightDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function highlights({ canvasElement }: { canvasElement: HTMLElement }) {
  expect(
    within(canvasElement).getAllByText("Daily", { exact: true }),
  ).toHaveLength(6);
  for (const mark of canvasElement.querySelectorAll(".suggestion-highlight")) {
    expect(mark).toBeVisible();
    expect(getComputedStyle(mark).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  }
}
export const Light: Story = {
  globals: { colorMode: "light" },
  play: highlights,
};
export const Dark: Story = { globals: { colorMode: "dark" }, play: highlights };
