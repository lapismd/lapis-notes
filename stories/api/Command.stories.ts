import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import CommandDemo from "./CommandDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Command",
  component: CommandDemo,
} satisfies Meta<typeof CommandDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

const commandMeta = apiStoryMeta(
  "api-command",
  "Command list used by api popover menus.",
  { baselineImage: "/visual-baselines/stories/api/command-chromium.png" },
);

export const Command: Story = {
  ...commandMeta,
  parameters: {
  visualDelta: {"images":["/visual-baselines/stories/api/command-chromium.png"],"opacity":0.5,"colorInversion":false,"align":"canvas","placement":"right"},
    ...commandMeta.parameters,
    // bits-ui command combobox omits aria-controls while expanded (upstream).
    a11y: {
      config: {
        rules: [{ id: "aria-required-attr", enabled: false }],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("option", { name: "Daily" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("selected: Daily"),
    );
  },
};
