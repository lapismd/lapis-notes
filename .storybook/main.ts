import type { StorybookConfig } from "@storybook/svelte-vite";
import remarkGfm from "remark-gfm";
import { viteFinal } from "./vite-final.ts";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|ts|svelte)"],
  addons: [
    {
      name: "@storybook/addon-docs",
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
    {
      name: "@lapismd/storybook-addon-visual-delta",
      options: {
        visualDelta: {
          allowVcsWrites: true,
          baselinePathMode: "nested-import",
          snapshotDir: "tests/visual/storybook.spec.ts-snapshots",
        },
      },
    },
  ],
  framework: {
    name: "@storybook/svelte-vite",
    options: {},
  },
  viteFinal,
};

export default config;
