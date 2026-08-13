<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, waitFor, within } from "storybook/test";
  import CvPreview from "../lib/cv-preview.svelte";

  const svgArtifact = {
    id: "page-1",
    pipeline: "typst" as const,
    filename: "page.svg",
    extension: "svg",
    label: "CV page 1",
    mimeType: "image/svg+xml;charset=utf-8",
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="820" height="1060"></svg>',
    text: '<svg xmlns="http://www.w3.org/2000/svg" width="820" height="1060"></svg>',
    preview: true,
    metadata: { previewFormat: "svg" as const },
  };

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

<Story
  name="Typst Page Zoom"
  args={{ mode: "rendercv", zoom: 1.15, artifacts: [svgArtifact] }}
  play={async ({ canvasElement }) => {
    const document = within(canvasElement).getByTestId("cv-preview-document");
    expect(document.style.width).toBe("115%");
  }}
/>

<Story
  name="HTML Zoom"
  args={{
    mode: "rendercv-html",
    zoom: 0.85,
    html: "<!doctype html><html><body><h1>CV</h1></body></html>",
  }}
  play={async ({ canvasElement }) => {
    const document = within(canvasElement).getByTestId("cv-preview-document");
    expect(document.style.width).toBe("85%");
  }}
/>

<Story
  name="Markdown Zoom"
  args={{ mode: "rendercv-md", zoom: 1.15, markdown: "# CV" }}
  play={async ({ canvasElement }) => {
    const document = within(canvasElement).getByTestId("cv-preview-document");
    expect(document.style.width).toBe("115%");
    expect(within(document).getByRole("heading", { name: "CV" })).toBeTruthy();
  }}
/>

<Story
  name="Typst Source Zoom"
  args={{ mode: "rendercv-typ", zoom: 0.85, typst: "#set page(width: 820pt)" }}
  play={async ({ canvasElement }) => {
    const document = within(canvasElement).getByTestId("preview-text");
    expect(document.style.width).toBe("85%");
  }}
/>
