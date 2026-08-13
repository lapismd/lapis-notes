<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, waitFor, within } from "storybook/test";
  import CvPreview from "../lib/cv-preview.svelte";

  const { Story } = defineMeta({
    title: "CV/Preview",
    component: CvPreview,
    tags: ["!autodocs", "test", "visual-pending"],
  });
</script>

<Story
  name="Worker Failure Fallback"
  args={{
    mode: "rendercv",
    html: "<!doctype html><html><body><h1>Fallback CV</h1></body></html>",
    error: "Typst worker unavailable",
    pending: false,
    artifacts: [],
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("alert")).toHaveTextContent("Typst worker unavailable");
    const fallback = canvas.getByTitle("CV HTML preview fallback") as HTMLIFrameElement;
    await waitFor(() => expect(fallback.srcdoc).toContain("Fallback CV"));
    expect(canvas.queryByTestId("cv-preview-pages")).toBeNull();
  }}
/>
