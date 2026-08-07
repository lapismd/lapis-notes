import type { StorybookConfig } from "@storybook/svelte-vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import { mergeConfig, type Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "..");
const stagedDesignCoreRoot = path.resolve(repoRoot, ".deps/design-core");
const installedDesignCoreRoot = path.resolve(
  repoRoot,
  "node_modules/@lapismd/design-core",
);
const designCoreRoot = existsSync(stagedDesignCoreRoot)
  ? installedDesignCoreRoot
  : path.resolve(repoRoot, "../design-core");
const apiLib = path.resolve(rootDir, "../packages/api/src/lib");
const uiLib = path.resolve(rootDir, "../packages/ui/src/lib");
const workspaceLib = path.resolve(rootDir, "../packages/workspace/src/lib");
const uiComponents = path.join(uiLib, "components/ui");

function packageLibAlias(): Plugin {
  return {
    name: "lapis-package-lib-alias",
    enforce: "pre",
    async resolveId(source, importer) {
      if (source !== "$lib" && !source.startsWith("$lib/")) return null;

      const suffix = source === "$lib" ? "" : source.slice("$lib/".length);
      if (suffix.startsWith("components/ui/") || suffix === "utils.js") {
        return this.resolve(
          path.join(uiLib, suffix === "utils.js" ? "utils.ts" : suffix),
          importer,
          { skipSelf: true },
        );
      }

      const cleanImporter = importer?.split("?", 1)[0] ?? "";
      const owner = cleanImporter.startsWith(apiLib)
        ? apiLib
        : cleanImporter.startsWith(workspaceLib)
          ? workspaceLib
          : uiLib;
      return this.resolve(path.join(owner, suffix), importer, {
        skipSelf: true,
      });
    },
  };
}

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
      packageLibAlias(),
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
          {
            find: /^@lapis-notes\/api\/workspace-host$/,
            replacement: path.join(apiLib, "workspace-host.ts"),
          },
          {
            find: /^@lapis-notes\/api$/,
            replacement: path.join(apiLib, "index.ts"),
          },
          {
            find: /^@lapis-notes\/workspace$/,
            replacement: path.join(workspaceLib, "index.ts"),
          },
          {
            find: /^@lapismd\/design-core\/workspace\/app-shell$/,
            replacement: path.join(
              designCoreRoot,
              "src/shared/workspace/app-shell/index.ts",
            ),
          },
          {
            find: /^@lapismd\/design-core\/workspace\/core$/,
            replacement: path.join(
              designCoreRoot,
              "src/shared/workspace/core/index.ts",
            ),
          },
          {
            find: /^@lapismd\/design-core\/workspace\/plugins\/notifications$/,
            replacement: path.join(
              designCoreRoot,
              "src/shared/workspace/plugins/notifications/index.ts",
            ),
          },
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
      worker: {
        format: "es",
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
