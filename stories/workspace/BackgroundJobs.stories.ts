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

export const NetworkApprovalAndOpaqueCredentials: Story = {
  args: { network: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const origin = await canvas.findByLabelText(
      "Connect to https://bank.example (GET, POST)",
    );
    await expect(origin).not.toBeChecked();
    const privateOrigin = canvas.getByLabelText(
      "Connect to http://127.0.0.1:8787 (GET)",
    );
    await expect(privateOrigin).not.toBeChecked();
    const binding = canvas.getByLabelText(
      "Send stored bank key to https://bank.example in authorization",
    );
    await expect(binding).toBeDisabled();
    await userEvent.click(origin);
    await userEvent.click(binding);
    await userEvent.type(
      canvas.getByLabelText("New key for bank"),
      "synthetic-story-key",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Replace key" }));
    await canvas.findByText("bank: Configured");
    await expect(canvas.getByLabelText("New key for bank")).toHaveValue("");
    await expect(canvas.getByTestId("job-command")).not.toHaveTextContent(
      "synthetic-story-key",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Approve and enable" }),
    );
    await waitFor(() =>
      expect(canvas.getByTestId("job-command")).toHaveTextContent(
        '"origin":"https://bank.example"',
      ),
    );
    await expect(canvas.getByTestId("job-command")).toHaveTextContent(
      '"id":"bank","header":"authorization"',
    );
    await expect(canvas.getByTestId("job-command")).not.toHaveTextContent(
      '"origin":"http://127.0.0.1:8787"',
    );
    await userEvent.click(canvas.getByRole("button", { name: "Remove key" }));
    await canvas.findByText("bank: Not configured");
  },
};

export const PrivateNetworkApproval: Story = {
  args: { network: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const origin = await canvas.findByLabelText(
      "Connect to http://127.0.0.1:8787 (GET)",
    );
    const privateAccess = canvas.getByLabelText(
      "Allow local/private addresses for http://127.0.0.1:8787",
    );
    await expect(privateAccess).toBeDisabled();
    await userEvent.click(origin);
    await expect(privateAccess).not.toBeChecked();
    await userEvent.click(privateAccess);
    await userEvent.click(
      canvas.getByRole("button", { name: "Approve and enable" }),
    );
    await waitFor(() =>
      expect(canvas.getByTestId("job-command")).toHaveTextContent(
        '"allowPrivateNetwork":true',
      ),
    );
    await expect(canvas.getByTestId("job-command")).toHaveTextContent(
      '"credentials":[]',
    );
  },
};

export const LockedCredentialCustody: Story = {
  args: { network: true, locked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Native credential store is locked");
    await expect(canvas.getByLabelText("New key for bank")).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Replace key" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Remove key" }),
    ).toBeDisabled();
  },
};

export const ChangedCodeRequiresFreshNetworkApproval: Story = {
  args: { network: true, changed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const origin = await canvas.findByLabelText(
      "Connect to https://bank.example (GET, POST)",
    );
    await expect(origin).not.toBeChecked();
    const binding = canvas.getByLabelText(
      "Send stored bank key to https://bank.example in authorization",
    );
    await expect(binding).not.toBeChecked();
    await userEvent.click(origin);
    const approve = canvas.getByRole("button", { name: "Approve and enable" });
    await expect(approve).toBeEnabled();
    await userEvent.click(approve);
    await waitFor(() =>
      expect(canvas.getByTestId("job-command")).toHaveTextContent(
        `"fingerprint":"${"a".repeat(64)}"`,
      ),
    );
    await expect(canvas.getByTestId("job-command")).toHaveTextContent(
      '"credentials":[]',
    );
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Run now" })).toBeEnabled(),
    );
  },
};
