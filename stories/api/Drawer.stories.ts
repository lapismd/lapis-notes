import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import DrawerDemo from "./DrawerDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Drawer",
  component: DrawerDemo,
} satisfies Meta<typeof DrawerDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Drawer: Story = {
  ...apiStoryMeta("api-drawer", "Drawer used by api mobile menu path.", { baselineImage: "/visual-baselines/stories/api/drawer-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open drawer" }));
    await userEvent.click(await body.findByRole("button", { name: "Choose Daily" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("Daily"),
    );
  },
};
