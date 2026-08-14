<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, fn, within } from "storybook/test";
  import RoleActivityTimeline from "../lib/role-activity-timeline.svelte";
  import { ActivityExample } from "./Roles.example-sources";
  import { roleFixtures } from "./roles-fixtures";

  const { Story } = defineMeta({
    title: "Roles/Activity",
    component: RoleActivityTimeline,
    tags: ["visual-pending"],
    args: { roles: roleFixtures, onSelect: fn() },
    parameters: {
      layout: "fullscreen",
      a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
      docs: {
        source: { code: ActivityExample, language: "svelte", type: "code" },
        story: { height: "700px", inline: false },
      },
    },
  });
</script>

<Story
  name="Grouped Timeline"
  play={async ({ canvasElement }) => {
    canvasElement.style.height = `${window.innerHeight}px`;
    const canvas = within(canvasElement);
    expect(canvas.getAllByText("updated").length).toBeGreaterThan(0);
    expect(canvas.getAllByText(/No activity for/).length).toBeGreaterThan(0);
  }}
/>
