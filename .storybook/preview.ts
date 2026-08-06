import type { Preview } from "@storybook/svelte-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
// Brand + shadcn paint: design-core. ui/theme.css is Obsidian alias-only.
// Host Tailwind (vite plugin) is for story/demo layout — not component paint.
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";

const preview: Preview = {
  tags: ["autodocs", "test"],
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i } },
    docs: {
      toc: true,
    },
    // Fail Vitest / Testing Module runs on axe violations (panel alone is not enough).
    a11y: {
      test: "error",
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
