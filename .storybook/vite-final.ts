import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  mergeConfig,
  searchForWorkspaceRoot,
  type InlineConfig,
  type Plugin,
} from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "..");
const apiLib = path.resolve(rootDir, "../packages/api/src/lib");
const uiLib = path.resolve(rootDir, "../packages/ui/src/lib");
const workspaceLib = path.resolve(rootDir, "../packages/workspace/src/lib");
const markdownLib = path.resolve(
  rootDir,
  "../packages/plugins/plugin-markdown/src/lib",
);
const markdownSrc = path.resolve(
  rootDir,
  "../packages/plugins/plugin-markdown/src",
);
const cvLib = path.resolve(rootDir, "../packages/plugins/plugin-cv/src/lib");
const cvSrc = path.resolve(rootDir, "../packages/plugins/plugin-cv/src");

const uiComponents = path.join(uiLib, "components/ui");
const linkedSiblingPackages = [
  "@lapismd/design-core",
  "@lapismd/mira",
  "@lapismd/mira-editor",
  "@lapismd/mira-plugin-ai",
  "@lapismd/mira-plugin-mermaid",
] as const;

/** Keep host peer identities authoritative across linked sibling packages. */
const linkedSingletonPackages = [
  "@codemirror/state",
  "@codemirror/view",
  "@codemirror/language",
  "@codemirror/commands",
  "@codemirror/autocomplete",
  "@codemirror/search",
  "@codemirror/lint",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/markdown",
  "@lezer/lr",
] as const;

const linkedSiblingRoots = linkedSiblingPackages.map((packageName) =>
  realpathSync(path.join(repoRoot, "node_modules", packageName)),
);
const linkedSiblingWorkspaceRoots = [
  ...new Set(linkedSiblingRoots.map(searchForWorkspaceRoot)),
];

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
          : cleanImporter.startsWith(markdownLib) ||
              cleanImporter.startsWith(markdownSrc)
            ? markdownLib
            : cleanImporter.startsWith(cvLib) ||
                cleanImporter.startsWith(cvSrc)
              ? cvLib
              : uiLib;
      return this.resolve(path.join(owner, suffix), importer, {
        skipSelf: true,
      });
    },
  };
}

export async function viteFinal(viteConfig: InlineConfig): Promise<InlineConfig> {
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
      dedupe: [...linkedSingletonPackages, "svelte"],
      alias: [
        {
          find: /^@lapis-notes\/api\/language-service\/worker$/,
          replacement: path.join(apiLib, "language-service/worker-provider.ts"),
        },
        {
          find: /^@lapis-notes\/api\/editor\/language-service$/,
          replacement: path.join(
            apiLib,
            "components/editor/language-service/index.ts",
          ),
        },
        {
          find: /^@lapis-notes\/api\/editor\/core$/,
          replacement: path.join(apiLib, "components/editor/editor.ts"),
        },
        {
          find: /^@lapis-notes\/api\/editor$/,
          replacement: path.join(apiLib, "components/editor/index.ts"),
        },
        {
          find: /^@lapis-notes\/api\/icon$/,
          replacement: path.join(apiLib, "components/icon/index.ts"),
        },
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
          find: /^@lapis-notes\/markdown$/,
          replacement: path.join(markdownLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/cv$/,
          replacement: path.join(
            repoRoot,
            "packages/plugins/plugin-cv/src/lib/index.ts",
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
          replacement: uiComponents + "/$1",
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
        "@myriaddreamin/typst.ts",
        "@myriaddreamin/typst.ts/compiler",
        "@myriaddreamin/typst.ts/fs/index",
        "@myriaddreamin/typst.ts/fs/package",
        "@myriaddreamin/typst.ts/options.init",
        "@lucide/svelte/icons/hash",
        "@lucide/svelte/icons/maximize-2",
      ],
    },
    ssr: {
      noExternal: ["aria-query"],
    },
    worker: {
      format: "es",
    },

    server: {
      headers: {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
      fs: {
        allow: [
          repoRoot,
          ...linkedSiblingRoots,
          ...linkedSiblingWorkspaceRoots,
        ],
      },
      watch: {
        ignored: ["**/storybook-static/**"],
      },
    },
  });
}
