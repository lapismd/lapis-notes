<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, fn, userEvent, waitFor, within } from "storybook/test";
  import RoleWorkspace from "../lib/role-workspace.svelte";
  import { RoleFileExample } from "./Roles.example-sources";
  import { roleFileSource } from "./roles-fixtures";

  const onContentChange = fn();
  const { Story } = defineMeta({
    title: "Roles/Role File",
    component: RoleWorkspace,
    tags: ["visual-pending"],
    args: {
      filePath: "Roles/atlas-platform/role.md",
      content: roleFileSource,
      onContentChange,
      onOpenCv: fn(),
      onTailorCv: fn(),
      onDelete: fn(),
    },
    parameters: {
      layout: "fullscreen",
      a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } },
      docs: {
        source: { code: RoleFileExample, language: "svelte", type: "code" },
        story: { height: "700px", inline: false },
      },
    },
  });
</script>

<Story
  name="Structured Role"
  play={async ({ canvasElement }) => {
    canvasElement.style.height = `${window.innerHeight}px`;
    const canvas = within(canvasElement);
    expect(canvas.getByRole("heading", { name: "Engineering Manager, Infrastructure" })).toBeTruthy();
    await userEvent.click(canvas.getByRole("tab", { name: "Stages" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Interview or preparation stage" }), "Architecture panel");
    await userEvent.click(canvas.getByRole("button", { name: "Add stage" }));
    await waitFor(() => expect(canvas.getByText("Architecture panel")).toBeTruthy());
    expect(onContentChange).toHaveBeenCalled();
  }}
/>

<Story
  name="Invalid Source Recovery"
  args={{ content: "---\nid: broken\nstatus: later\n---\n# Recover me" }}
  play={async ({ canvasElement }) => {
    canvasElement.style.height = `${window.innerHeight}px`;
    const canvas = within(canvasElement);
    expect(canvas.getByRole("alert")).toHaveTextContent("Role source needs attention");
    expect(canvas.getByLabelText("Raw role source")).toBeTruthy();
  }}
/>
