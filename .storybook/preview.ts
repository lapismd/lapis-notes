import type { Preview } from "@storybook/svelte-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { syncCatalogStoryLayout } from "@lapismd/design-core/storybook/catalog-layout";
// Brand + shadcn paint: design-core. ui/theme.css is Obsidian alias-only.
// Host Tailwind (vite plugin) is for story/demo layout — not component paint.
import "@lapismd/design-core/storybook.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/bases/styles.css";
import "@lapis-notes/ai/styles.css";
import "@lapis-notes/ui/theme.css";

const preview: Preview = {
  tags: ["autodocs", "test"],
  globalTypes: {
    theme: {
      description: "Brand theme",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "lapis", title: "Obsidian" },
          { value: "default", title: "Default" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i } },
    docs: {
      toc: true,
    },
    options: {
      storySort: {
        order: [
          "Specification",
          [
            "Introduction",
            "Architecture",
            "Packages",
            "Workspace Shell",
            ["Overview", "Panels"],
            "Lapis Editor Demo",
            "Markdown Plugin",
            [
              "Overview",
              "Panels",
              [
                "Overview",
                "All Properties",
                "File Properties",
                "Outline",
                "Backlinks",
                "Outgoing Links",
                "Tags",
                "Link Previews",
              ],
            ],
            "Search Plugin",
            "CV Plugin",
            "UI and Styling",
            "Storybook Catalog",
            "Specification Governance",
            "Verification",
          ],
          "*",
        ],
      },
    },
    // Fail Vitest / Testing Module runs on axe violations (panel alone is not enough).
    a11y: {
      test: "error",
      context: {
        exclude: [".cm-gutters"],
      },
    },
    backgrounds: {
      disable: true,
    },
    // Brand theme is owned by data-ui-theme; keep Lapis CSS for kept compounds.
    themes: {
      disable: true,
    },
  },
  initialGlobals: {
    colorMode: "light",
    theme: "lapis",
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        lapis: "lapis",
        default: "default",
      },
      defaultTheme: "lapis",
      attributeName: "data-ui-theme",
    }),
    (story, context) => {
      if (typeof document !== "undefined") {
        syncCatalogStoryLayout(document, context);
        document.documentElement.classList.toggle(
          "dark",
          context.globals.colorMode === "dark",
        );
      }
      return story();
    },
  ],
};

export default preview;
