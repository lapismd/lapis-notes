import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NotesSessionFixture, {
  disposeNotesSessionFixtures,
} from "./NotesSessionFixture.svelte";

const meta = {
  title: "Workspace/Notes Session",
  component: NotesSessionFixture,
  tags: ["!autodocs", "visual-pending"],
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  beforeEach: () => disposeNotesSessionFixtures,
} satisfies Meta<typeof NotesSessionFixture>;
export default meta;
type Story = StoryObj<typeof meta>;

async function expectReady(canvasElement: HTMLElement) {
  await waitFor(
    () =>
      expect(
        canvasElement.querySelector('[data-app-shell-ready="true"]'),
      ).toBeInTheDocument(),
    { timeout: 15_000 },
  );
  const shell = canvasElement.querySelector(
    '[data-ui-component="lapis-workspace-shell"]',
  )!;
  expect(
    Math.abs(
      shell.getBoundingClientRect().height -
        canvasElement.ownerDocument.documentElement.clientHeight,
    ),
  ).toBeLessThan(1);
  expect(canvasElement.querySelector('[data-path="Welcome.md"]')).toBeVisible();
}

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    await expectReady(canvasElement);
  },
};
export const NativeRepository: Story = {
  args: { nativeRepository: true },
  play: async ({ canvasElement }) => {
    await expectReady(canvasElement);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Settings" }));
    const dialog = within(canvasElement.ownerDocument.body).getByRole(
      "dialog",
      { name: "Settings" },
    );
    await userEvent.click(
      within(dialog).getByRole("button", {
        name: "Repository History",
      }),
    );
    expect(
      within(dialog).getByRole("switch", {
        name: "Show working copy status",
      }),
    ).toBeVisible();
  },
};
export const StartupRetry: Story = {
  args: { failOnce: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Lapis Notes could not start");
    expect(
      canvasElement.querySelector(
        '[data-ui-component="lapis-workspace-shell"]',
      ),
    ).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: /^Retry$/ }));
    await expectReady(canvasElement);
  },
};
