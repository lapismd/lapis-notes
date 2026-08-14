<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, fn, userEvent, within } from "storybook/test";
  import RoleActionsBoard from "../lib/role-actions-board.svelte";
  import { ActionsExample } from "./Roles.example-sources";
  import { roleFixtures } from "./roles-fixtures";

  const onMove = fn();
  const onStatusChange = fn();
  const { Story } = defineMeta({
    title: "Roles/Actions",
    component: RoleActionsBoard,
    tags: ["visual-pending"],
    args: { roles: roleFixtures, now: new Date("2026-08-13T12:00:00.000Z"), onMove, onStatusChange, onSelect: fn() },
    parameters: {
      layout: "fullscreen",
      a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
      docs: {
        source: { code: ActionsExample, language: "svelte", type: "code" },
        story: { height: "700px", inline: false },
      },
    },
  });
</script>

<Story
  name="Task Free Actions"
  play={async ({ canvasElement }) => {
    canvasElement.style.height = `${window.innerHeight}px`;
    const canvas = within(canvasElement);
    expect(canvas.getByText("Overdue")).toBeTruthy();
    expect(canvas.getByRole("heading", { name: "Waiting" })).toBeTruthy();
    expect(canvas.queryByText(/task/i)).toBeNull();
    await userEvent.click(canvas.getAllByRole("button", { name: "Contacted" })[0]!);
    expect(onMove).toHaveBeenCalledWith(expect.any(Object), "done");
    await userEvent.click(canvas.getAllByRole("button", { name: "Screening" })[0]!);
    expect(onStatusChange).toHaveBeenCalledWith(expect.any(Object), "screening");
  }}
/>
