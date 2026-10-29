import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { DesktopRecoveryBanner } from "@lapis-notes/workspace";
const meta = {
  title: "Workspace/Desktop Recovery",
  component: DesktopRecoveryBanner,
  tags: ["test", "visual-pending"],
  args: {
    reasons: [
      "non-required core plugins disabled",
      "saved layout restore skipped",
    ],
    lastFailure: "Saved layout could not be read",
    onRebuildMetadata: fn(async () => {}),
    onRebuildSearch: fn(async () => {}),
    onRestart: fn(async () => {}),
  },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: `<script lang="ts">
  import { DesktopRecoveryBanner } from "@lapis-notes/workspace";
  let { onRebuildMetadata, onRebuildSearch, onRestart } = $props();
</script>
<DesktopRecoveryBanner reasons={["saved layout restore skipped"]} {onRebuildMetadata} {onRebuildSearch} {onRestart} />`,
      },
    },
  },
} satisfies Meta<typeof DesktopRecoveryBanner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SafeMode: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The retained desktop recovery banner describes session restrictions and delegates rebuild/restart to its host. Future visual capture: tests/visual/storybook.spec.ts-snapshots/workspace/desktop-recovery/safe-mode.png.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("status", { name: "Safe Mode" }),
    ).toBeVisible();
    await expect(canvas.getByText("Safe Mode is active")).toBeVisible();
    for (const [label, callback] of [
      ["Rebuild metadata", args.onRebuildMetadata],
      ["Rebuild Search", args.onRebuildSearch],
      ["Restart normally", args.onRestart],
    ] as const) {
      await userEvent.click(canvas.getByRole("button", { name: label }));
      await expect(callback).toHaveBeenCalledOnce();
    }
  },
};
