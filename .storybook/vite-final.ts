import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, realpathSync } from "node:fs";
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
const fileExplorerLib = path.resolve(
  rootDir,
  "../packages/file-explorer/src/lib",
);
const basesLib = path.resolve(
  rootDir,
  "../packages/plugins/plugin-bases/src/lib",
);
const aiLib = path.resolve(rootDir, "../packages/plugins/plugin-ai/src/lib");
const bookmarksLib = path.resolve(
  rootDir,
  "../packages/plugins/plugin-bookmarks/src/lib",
);
const historyLib = path.resolve(
  rootDir,
  "../packages/plugins/plugin-history/src/lib",
);
const wordcountLib = path.resolve(
  rootDir,
  "../packages/plugins/plugin-wordcount/src",
);
const spellcheckLib = path.resolve(
  rootDir,
  "../packages/plugins/plugin-spellcheck/src",
);
const markdownLib = path.resolve(
  rootDir,
  "../packages/plugins/plugin-markdown/src/lib",
);
const markdownSrc = path.resolve(
  rootDir,
  "../packages/plugins/plugin-markdown/src",
);
const searchLib = path.resolve(
  rootDir,
  "../packages/plugins/plugin-search/src/lib",
);
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
  "@lapis-notes/api",
  "@codemirror/state",
  "@codemirror/view",
  "@codemirror/language",
  "@codemirror/commands",
  "@codemirror/autocomplete",
  "@codemirror/lang-markdown",
  "@codemirror/lang-yaml",
  "@codemirror/search",
  "@codemirror/lint",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/markdown",
  "@lezer/lr",
  "bits-ui",
] as const;

const linkedSiblingRoots = linkedSiblingPackages.map((packageName) =>
  realpathSync(path.join(repoRoot, "node_modules", packageName)),
);
const linkedSiblingWorkspaceRoots = [
  ...new Set(linkedSiblingRoots.map(searchForWorkspaceRoot)),
];
const linkedAssetPackages = [
  "@fontsource-variable/dm-sans",
  "@fontsource-variable/source-code-pro",
  "@fontsource/source-code-pro",
] as const;
const linkedAssetRoots = linkedSiblingRoots.flatMap((root) =>
  linkedAssetPackages.flatMap((packageName) => {
    const candidate = path.join(root, "node_modules", packageName);
    return existsSync(candidate) ? [realpathSync(candidate)] : [];
  }),
);

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
            : uiLib;
      return this.resolve(path.join(owner, suffix), importer, {
        skipSelf: true,
      });
    },
  };
}

export async function viteFinal(
  viteConfig: InlineConfig,
): Promise<InlineConfig> {
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
    define: {
      "import.meta.env.LAPIS_AGENT_RUNTIME_URL": JSON.stringify(
        process.env.LAPIS_AGENT_RUNTIME_URL ?? "",
      ),
      "import.meta.env.LAPIS_AGENT_RUNTIME_TOKEN": JSON.stringify(
        process.env.LAPIS_AGENT_RUNTIME_TOKEN ?? "",
      ),
      "import.meta.env.LAPIS_TERMINAL_HOST_URL": JSON.stringify(
        process.env.LAPIS_TERMINAL_HOST_URL ?? "",
      ),
      "import.meta.env.LAPIS_TERMINAL_HOST_TOKEN": JSON.stringify(
        process.env.LAPIS_TERMINAL_HOST_TOKEN ?? "",
      ),
    },
    resolve: {
      dedupe: [...linkedSingletonPackages, "svelte"],
      alias: [
        {
          find: /^harper\.js\/binary$/,
          replacement: "harper.js/binaryInlined",
        },
        {
          find: /^@tursodatabase\/database-wasm\/(?:bundle|vite)$/,
          replacement: path.join(rootDir, "turso-wasm-stub.ts"),
        },
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
          find: /^@lapis-notes\/api\/editor\/extensions\/(.+)$/,
          replacement: path.join(
            apiLib,
            "components/editor/extensions/$1/index.ts",
          ),
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
          find: /^@lapis-notes\/api\/agent-tools$/,
          replacement: path.join(apiLib, "agent-tools.ts"),
        },
        {
          find: /^@lapis-notes\/api\/agent-skills$/,
          replacement: path.join(apiLib, "agent-skills.ts"),
        },
        {
          find: /^@lapis-notes\/api\/app-database$/,
          replacement: path.join(apiLib, "app-database-host.ts"),
        },
        {
          find: /^@lapis-notes\/api\/desktop-native$/,
          replacement: path.join(apiLib, "storage/desktop-native.ts"),
        },
        {
          find: /^@lapis-notes\/api\/metadata-value$/,
          replacement: path.join(apiLib, "metadata-value.ts"),
        },
        {
          find: /^@lapis-notes\/api\/path$/,
          replacement: path.join(apiLib, "storage/path.ts"),
        },
        {
          find: /^@lapis-notes\/api\/plugin-assets$/,
          replacement: path.join(apiLib, "plugin-assets.ts"),
        },
        {
          find: /^@lapis-notes\/api\/vault$/,
          replacement: path.join(apiLib, "vault-api.ts"),
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
          find: /^@lapis-notes\/bases\/styles\.css$/,
          replacement: path.join(basesLib, "styles.css"),
        },
        {
          find: /^@lapis-notes\/bases$/,
          replacement: path.join(basesLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/ai\/styles\.css$/,
          replacement: path.join(aiLib, "styles.css"),
        },
        {
          find: /^@lapis-notes\/ai\/runtimes$/,
          replacement: path.join(aiLib, "runtime-adapters.ts"),
        },
        {
          find: /^@lapis-notes\/ai$/,
          replacement: path.join(aiLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/markdown$/,
          replacement: path.join(markdownLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/search$/,
          replacement: path.join(searchLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/bookmarks$/,
          replacement: path.join(bookmarksLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/history$/,
          replacement: path.join(historyLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/wordcount$/,
          replacement: path.join(wordcountLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/spellcheck$/,
          replacement: path.join(spellcheckLib, "index.ts"),
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
    optimizeDeps: {
      exclude: [
        "@storybook/svelte",
        "@lapismd/ai-host",
        "@lapismd/ai-host/client",
      ],
      include: [
        "aria-query",
        "react",
        "react-dom",
        "react-dom/client",
        "character-entities",
        "@dnd-kit/svelte",
        "@dnd-kit/dom",
        "@myriaddreamin/typst.ts",
        "@myriaddreamin/typst.ts/compiler",
        "@myriaddreamin/typst.ts/fs/index",
        "@myriaddreamin/typst.ts/fs/package",
        "@myriaddreamin/typst.ts/options.init",
        "@lucide/svelte/icons/hash",
        "@lucide/svelte/icons/maximize-2",
        "@lucide/svelte/icons/brain",
        "@lucide/svelte/icons/paperclip",
        "@lucide/svelte/icons/x",
        "@lucide/svelte/icons/git-compare",
        "@lucide/svelte/icons/git-compare-arrows",
        "@lucide/svelte/icons/git-commit-vertical",
        "@lucide/svelte/icons/archive-restore",
        "@lucide/svelte/icons/check",
        "@lucide/svelte/icons/columns-2",
        "@lucide/svelte/icons/rows-2",
        "@lucide/svelte/icons/wrap-text",
        "markdownlint",
        "markdownlint/sync",
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
          ...linkedAssetRoots,
        ],
      },
      watch: {
        ignored: ["**/storybook-static/**"],
      },
    },
  });
}
