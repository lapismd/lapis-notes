import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { AppSettingsRoot } from "@lapismd/design-core/workspace/settings";
import CliSettingsRegistrationDemo from "./CliSettingsRegistrationDemo.svelte";

const meta = {
  title: "API/CLI Settings Registration",
  component: AppSettingsRoot,
  tags: ["autodocs", "visual-pending"],
} satisfies Meta<typeof AppSettingsRoot>;
export default meta;
type Story = StoryObj;

export const RegisteredOwners: Story = {
  render: () => ({ Component: CliSettingsRegistrationDemo }),
  parameters: {
    docs: {
      description: {
        story:
          "Declarative General → Advanced fields retain their separate host bindings through rendering, replacement and disposal without persisting authority.",
      },
      source: {
        language: "svelte",
        type: "code",
        code: '<script>\nimport { onDestroy } from "svelte";\nimport { AppSettings, WorkspaceSettingsController } from "@lapismd/design-core/workspace/settings";\nimport { registerCliSettings } from "@lapis-notes/ui/cli";\nexport let host;\nconst settings = new WorkspaceSettingsController();\nconst dispose = registerCliSettings(settings, host);\nonDestroy(() => { dispose(); settings.destroy(); });\n</script>\n<AppSettings.Root controller={settings}>\n<AppSettings.Navigation />\n<AppSettings.Content />\n</AppSettings.Root>',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "General", exact: true }),
    );
    await expect(await canvas.findByText("/example/first/lapis")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show second owner" }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "General", exact: true }),
    );
    await expect(
      await canvas.findByText("/example/second/lapis"),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show first owner" }),
    );
    await expect(await canvas.findByText("/example/first/lapis")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Replace first host" }),
    );
    await expect(
      await canvas.findByText("/example/replacement/lapis"),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Dispose first host" }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("region", { name: "Command line interface" }),
      ).toBeNull(),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Show second owner" }),
    );
    await expect(
      await canvas.findByText("/example/second/lapis"),
    ).toBeVisible();
    expect(canvas.getByLabelText("First persisted settings")).toHaveTextContent(
      "{}",
    );
    expect(
      canvas.getByLabelText("Second persisted settings"),
    ).toHaveTextContent("{}");
  },
};
