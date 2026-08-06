import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, within, waitFor } from "storybook/test";
import ContextMenuDemo from "./ContextMenuDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Context Menu",
  component: ContextMenuDemo,
} satisfies Meta<typeof ContextMenuDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ContextMenu: Story = {
  ...apiStoryMeta("api-context-menu", "Context menu used by api editor surfaces.", { baselineImage: "/visual-baselines/stories/api/context-menu-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const area = canvas.getByText("Right-click here");
    await fireEvent.contextMenu(area);
    await userEvent.click(await body.findByRole("menuitem", { name: "Open" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("open"),
    );
  },
};
