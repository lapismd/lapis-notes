import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import SliderDemo from "./SliderDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Slider",
  component: SliderDemo,
} satisfies Meta<typeof SliderDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Slider: Story = {
  ...apiStoryMeta("api-slider", "Numeric slider used by api settings.", { baselineImage: "/visual-baselines/stories/api/slider-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
      "value: 40",
    );
    const slider = canvas.getByRole("slider");
    slider.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).not.toHaveTextContent(
        "value: 40",
      ),
    );
  },
};
