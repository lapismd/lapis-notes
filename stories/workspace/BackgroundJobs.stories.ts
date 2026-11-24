import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import BackgroundJobsSurface from "./BackgroundJobsSurface.svelte";
const meta = {
  title: "Workspace/Background Jobs",
  component: BackgroundJobsSurface,
  tags: ["test", "visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
} satisfies Meta<typeof BackgroundJobsSurface>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ApprovalScheduleAndPause: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Background jobs" });
    await userEvent.selectOptions(canvas.getByLabelText("Schedule"), "daily");
    await userEvent.clear(canvas.getByLabelText("Time zone"));
    await userEvent.type(canvas.getByLabelText("Time zone"), "Europe/London");
    await userEvent.click(
      canvas.getByLabelText("Also show local system alerts"),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Approve and enable" }),
    );
    await waitFor(() =>
      expect(canvas.getByTestId("job-command").textContent).toContain(
        '"nativeNotifications":true',
      ),
    );
    await expect(canvas.getByTestId("job-command")).toHaveTextContent(
      '"timezone":"Europe/London"',
    );
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Run now" })).toBeEnabled(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Run now" }));
    await waitFor(() =>
      expect(canvas.getByTestId("job-command").textContent).toContain(
        '"kind":"runNow"',
      ),
    );
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: /^Pause$/ })).toBeEnabled(),
    );
    await userEvent.click(canvas.getByRole("button", { name: /^Pause$/ }));
    await canvas.findByRole("button", { name: "Approve and enable" });
  },
};
export const ControlFailure: Story = {
  args: { fail: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: "Approve and enable" });
    await userEvent.click(
      canvas.getByRole("button", { name: "Approve and enable" }),
    );
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "native runner is unavailable",
    );
    await expect(
      canvas.getByRole("button", { name: "Refresh status" }),
    ).toBeVisible();
  },
};
