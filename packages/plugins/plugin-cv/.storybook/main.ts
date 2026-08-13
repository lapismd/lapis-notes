import type { StorybookConfig } from "@storybook/svelte-vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, type Plugin } from "vite";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(storybookDir, "..");
const pluginsDir = path.resolve(packageDir, "..");
const packagesDir = path.resolve(pluginsDir, "..");
const repoRoot = path.resolve(packagesDir, "..");
const apiLib = path.join(packagesDir, "api/src/lib");
const uiLib = path.join(packagesDir, "ui/src/lib");
const uiComponents = path.join(uiLib, "components/ui");
const workspaceLib = path.join(packagesDir, "workspace/src/lib");
const fileExplorerLib = path.join(packagesDir, "file-explorer/src/lib");
const searchLib = path.join(pluginsDir, "plugin-search/src/lib");
const markdownLib = path.join(pluginsDir, "plugin-markdown/src/lib");
const markdownSrc = path.join(pluginsDir, "plugin-markdown/src");
const cvLib = path.join(packageDir, "src/lib");
const cvSrc = path.join(packageDir, "src");

/** Keep host peer identities authoritative across linked sibling packages. */
const linkedSingletonPackages = [
  "svelte",
  "@codemirror/state",
  "@codemirror/view",
  "@codemirror/language",
  "@codemirror/commands",
  "@codemirror/autocomplete",
  "@codemirror/search",
  "@codemirror/lint",
  "@codemirror/lang-yaml",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/markdown",
  "@lezer/lr",
] as const;

function libOwner(importer: string | undefined): string {
  const cleanImporter = importer?.split("?", 1)[0] ?? "";
  if (cleanImporter.startsWith(apiLib)) return apiLib;
  if (cleanImporter.startsWith(workspaceLib)) return workspaceLib;
  if (cleanImporter.startsWith(fileExplorerLib)) return fileExplorerLib;
  if (cleanImporter.startsWith(searchLib)) return searchLib;
  if (
    cleanImporter.startsWith(markdownLib) ||
    cleanImporter.startsWith(markdownSrc)
  ) {
    return markdownLib;
  }
  if (cleanImporter.startsWith(cvLib) || cleanImporter.startsWith(cvSrc)) {
    return cvLib;
  }
  return uiLib;
}

function packageLibAlias(): Plugin {
  return {
    name: "lapis-package-lib-alias",
    enforce: "pre",
    configResolved(config) {
      const alias = config.resolve.alias;
      if (!Array.isArray(alias)) return;
      config.resolve.alias = alias.filter((entry) => entry.find !== "$lib");
    },
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

      return this.resolve(path.join(libOwner(importer), suffix), importer, {
        skipSelf: true,
      });
    },
  };
}

function withoutSvelteLibAlias(alias: unknown): unknown {
  if (Array.isArray(alias)) {
    return alias.filter((entry) => {
      const find =
        typeof entry === "object" && entry && "find" in entry
          ? (entry as { find: unknown }).find
          : entry;
      return find !== "$lib";
    });
  }
  if (alias && typeof alias === "object" && "$lib" in alias) {
    const { $lib: _ignored, ...rest } = alias as Record<string, unknown>;
    return rest;
  }
  return alias;
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|ts|svelte)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/svelte-vite",
    options: {},
  },
  staticDirs: [{ from: "../static", to: "/" }],
  viteFinal: async (viteConfig) => {
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: withoutSvelteLibAlias(viteConfig.resolve?.alias) as
        | typeof viteConfig.resolve.alias
        | undefined,
    };
    viteConfig.plugins = [
      packageLibAlias(),
      svelte({
        preprocess: vitePreprocess(),
        compilerOptions: {
          runes: undefined,
        },
      }),
      ...(viteConfig.plugins ?? []),
    ];
    return mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        dedupe: [...linkedSingletonPackages],
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
            find: /^@lapis-notes\/file-explorer$/,
            replacement: path.join(fileExplorerLib, "index.ts"),
          },
          {
            find: /^@lapis-notes\/search$/,
            replacement: path.join(searchLib, "index.ts"),
          },
          {
            find: /^@lapis-notes\/markdown$/,
            replacement: path.join(markdownLib, "index.ts"),
          },
          {
            find: /^@lapis-notes\/cv$/,
            replacement: path.join(cvLib, "index.ts"),
          },
          {
            find: "@lapis-notes/ui/theme.css",
            replacement: path.join(uiLib, "theme.css"),
          },
          {
            find: "@lapis-notes/ui/table-dnd/utils",
            replacement: path.join(uiComponents, "table-dnd/table-dnd-utils.ts"),
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
            replacement: uiComponents + "/$1",
          },
          {
            find: /^@lapis-notes\/ui$/,
            replacement: path.join(uiLib, "index.ts"),
          },
        ],
      },
      worker: { format: "es" },
      esbuild: {
        target: "esnext",
      },
      optimizeDeps: {
        exclude: ["@storybook/svelte"],
        esbuildOptions: {
          target: "esnext",
        },
        include: [
          "aria-query",
          "react",
          "react-dom",
          "react-dom/client",
          "@myriaddreamin/typst.ts",
          "@myriaddreamin/typst.ts/compiler",
          "@myriaddreamin/typst.ts/fs/index",
          "@myriaddreamin/typst.ts/fs/package",
          "@myriaddreamin/typst.ts/options.init",
          "@lucide/svelte/icons/folder-closed",
          "@lucide/svelte/icons/file",
          "@lucide/svelte/icons/search",
          "@lucide/svelte/icons/book-open",
          "@lucide/svelte/icons/pencil",
          "@lucide/svelte/icons/download",
          "@lucide/svelte/icons/save",
        ],
      },
      server: {
        headers: {
          "Cross-Origin-Embedder-Policy": "require-corp",
          "Cross-Origin-Opener-Policy": "same-origin",
        },
        fs: {
          allow: [
            repoRoot,
            path.resolve(repoRoot, "../design-core"),
            path.resolve(repoRoot, "../mira-mde"),
          ],
        },
      },
    });
  },
};

export default config;
