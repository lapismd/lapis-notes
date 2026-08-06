import type { Preview } from "@storybook/svelte-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import "@lapis-notes/ui/styles.css";

const preview: Preview = {
  tags: ["autodocs", "test"],
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i } },
    docs: {
      toc: true,
    },
  },
  initialGlobals: {
    colorMode: "light",
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
      parentSelector: "html",
    }),
  ],
};

export default preview;
