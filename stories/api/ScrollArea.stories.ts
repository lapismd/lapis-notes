import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import ScrollAreaDemo from "./ScrollAreaDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Scroll Area",
  component: ScrollAreaDemo,
} satisfies Meta<typeof ScrollAreaDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ScrollArea: Story = {
  ...apiStoryMeta("api-scroll-area", "Scroll area used by api editor surfaces.", { baselineImage: "/visual-baselines/stories/api/scroll-area-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("items: 40");
    const viewport = canvasElement.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null;
    expect(viewport).toBeTruthy();
    viewport!.scrollTop = 120;
    await expect(viewport!.scrollTop).toBeGreaterThan(0);
  },
};
