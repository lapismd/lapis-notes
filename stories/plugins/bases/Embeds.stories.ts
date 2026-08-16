import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../workspace/docs-parameters";
import { basesEmbedsExampleSource } from "./BasesEmbeds.example-sources";
import BasesMarkdownEmbedsDemo from "./BasesMarkdownEmbedsDemo.svelte";

const meta = {
  title: "Plugins/Bases/Embeds",
  component: BasesMarkdownEmbedsDemo,
  tags: ["visual-pending", "test"],
  parameters: {
    ...workspaceCatalogParameters("plugins-bases-embeds-markdown"),
    layout: "fullscreen",
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      description: {
        component:
          "A real App renders read-only Bases file and fenced embeds through the plugin registries.",
      },
      source: {
        code: basesEmbedsExampleSource,
        language: "svelte",
        type: "code",
      },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/bases/embeds/markdown-chromium.png",
      ],
    },
  },
} satisfies Meta<typeof BasesMarkdownEmbedsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Markdown: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("bases-embeds-status")).toHaveTextContent(
          "ready",
        );
        expect(
          canvas
            .getByTestId("bases-file-embed")
            .querySelector(
              '[data-ui-component="bases-view"][data-read-only="true"]',
            ),
        ).toBeVisible();
        expect(
          canvas
            .getByTestId("bases-fenced-embed")
            .querySelector(
              '[data-ui-component="bases-view"][data-read-only="true"]',
            ),
        ).toBeVisible();
        expect(canvas.getByText(/Unable to render this base:/u)).toBeVisible();
      },
      { timeout: 8_000 },
    );

    const root = canvas.getByTestId("bases-embeds-demo") as HTMLElement & {
      __cleanupBasesEmbeds?: () => void;
    };
    root.__cleanupBasesEmbeds?.();
    expect(canvas.getByTestId("bases-file-embed")).toBeEmptyDOMElement();
    expect(canvas.getByTestId("bases-fenced-embed")).toBeEmptyDOMElement();
    expect(canvas.getByTestId("bases-invalid-embed")).toBeEmptyDOMElement();
  },
};
