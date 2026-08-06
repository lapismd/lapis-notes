import type { StorybookConfig } from "@storybook/svelte-vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import { mergeConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "..");
const designCoreRoot = path.resolve(repoRoot, "../design-core");
const uiLib = path.resolve(rootDir, "../packages/ui/src/lib");
const uiComponents = path.join(uiLib, "components/ui");

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
  viteFinal: async (viteConfig) => {
    const plugins = viteConfig.plugins ?? [];
    viteConfig.plugins = [
      svelte({
        preprocess: vitePreprocess(),
        compilerOptions: {
          runes: undefined,
        },
      }),
      tailwindcss(),
      ...plugins,
    ];
    return mergeConfig(viteConfig, {
      resolve: {
        alias: [
          { find: "$lib", replacement: uiLib },
          {
            find: "@lapis-notes/ui/theme.css",
            replacement: path.join(uiLib, "theme.css"),
          },
          {
            find: "@lapis-notes/ui/styles.css",
            replacement: path.join(uiLib, "styles.css"),
          },
          {
            find: "@lapis-notes/ui/codemirror-autocomplete.css",
            replacement: path.join(uiLib, "codemirror-autocomplete.css"),
          },
          {
            find: "@lapis-notes/ui/table-dnd/utils",
            replacement: path.join(
              uiComponents,
              "table-dnd/table-dnd-utils.ts",
            ),
          },
          {
            find: "@lapis-notes/ui/table-dnd/sensors",
            replacement: path.join(
              uiComponents,
              "table-dnd/table-dnd-sensors.ts",
            ),
          },
          {
            find: /^@lapis-notes\/ui\/(.+)$/,
            replacement: `${uiComponents}/$1`,
          },
          {
            find: /^@lapis-notes\/ui$/,
            replacement: path.join(uiLib, "index.ts"),
          },
        ],
      },
      optimizeDeps: {
        exclude: ["@storybook/svelte"],
        include: [
          "aria-query",
          "react",
          "react-dom",
          "react-dom/client",
          "@dnd-kit/svelte",
          "@dnd-kit/dom",
        ],
      },
      ssr: {
        noExternal: ["aria-query"],
      },

      server: {
        fs: {
          allow: [repoRoot, designCoreRoot],
        },
        watch: {
          ignored: ["**/storybook-static/**"],
        },
      },
    });
  },
};

export default config;
