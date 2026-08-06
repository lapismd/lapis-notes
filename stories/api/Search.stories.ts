import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import SearchDemo from "./SearchDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Search",
  component: SearchDemo,
} satisfies Meta<typeof SearchDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {
  ...apiStoryMeta("api-search", "Search field with clear control used by api.", { baselineImage: "/visual-baselines/stories/api/search-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Search notes");
    await userEvent.type(input, "query");
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("value: query");
    const clear = canvasElement.querySelector(
      "button.size-4.rounded-full:not(.hidden)",
    ) as HTMLButtonElement | null;
    expect(clear).toBeTruthy();
    await userEvent.click(clear!);
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("value:"),
    );
  },
};
