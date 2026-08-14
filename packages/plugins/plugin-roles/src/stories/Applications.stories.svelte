<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, fn, userEvent, within } from "storybook/test";
  import ApplicationsBoard from "../lib/applications-board.svelte";
  import { ApplicationsExample } from "./Roles.example-sources";
  import { roleFixtures } from "./roles-fixtures";

  const onMove = fn();
  const onSelect = fn();
  const { Story } = defineMeta({
    title: "Roles/Applications",
    component: ApplicationsBoard,
    tags: ["visual-pending"],
    args: { roles: roleFixtures, onMove, onSelect },
    parameters: {
      layout: "fullscreen",
      a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
      docs: {
        source: { code: ApplicationsExample, language: "svelte", type: "code" },
        story: { height: "700px", inline: false },
      },
    },
  });
</script>

<Story
  name="All Statuses"
  play={async ({ canvasElement }) => {
    canvasElement.style.height = `${window.innerHeight}px`;
    const canvas = within(canvasElement);
    const saved = canvas.getByRole("button", { name: /Open application 1: Senior Lead Software Engineer/ });
    saved.focus();
    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: "jpmorgan-chase" }), "applied", expect.any(Number));
    await userEvent.click(saved);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "jpmorgan-chase" }));
    expect(canvas.getByText("Offer")).toBeTruthy();
    expect(canvas.getByText("Rejected")).toBeTruthy();
  }}
/>
