import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, type InlineConfig, type Plugin } from "vite";

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
const stagedMiraRoot = path.resolve(repoRoot, ".deps/mira");
const miraPackageRoot = existsSync(stagedMiraRoot)
  ? stagedMiraRoot
  : path.resolve(repoRoot, "../mira-mde/packages/mira");
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

function resolveSiblingPackage(
  stagedDirName: string,
  permanentRelative: string,
) {
  const stagedRoot = path.resolve(repoRoot, ".deps", stagedDirName);
  return {
    root: existsSync(stagedRoot)
      ? stagedRoot
      : path.resolve(repoRoot, permanentRelative),
    staged: existsSync(stagedRoot),
  };
}

const miraEditor = resolveSiblingPackage(
  "mira-editor",
  "../mira-mde/packages/mira-editor",
);
const miraPluginMermaid = resolveSiblingPackage(
  "mira-plugin-mermaid",
  "../mira-mde/packages/mira-plugin-mermaid",
);
const miraPluginAi = resolveSiblingPackage(
  "mira-plugin-ai",
  "../mira-mde/packages/mira-plugin-ai",
);
const miraEditorRoot = miraEditor.root;
const miraPluginMermaidRoot = miraPluginMermaid.root;
const miraPluginAiRoot = miraPluginAi.root;
// Local Storybook: resolve Mira packages from sibling source (HMR, no stale
// pnpm file: dist copies). Docker visual capture uses staged `.deps/*` builds.
const miraSourceAliases = !existsSync(stagedMiraRoot);
const miraSrc = path.join(miraPackageRoot, "src");
const uiComponents = path.join(uiLib, "components/ui");
const requireFromMarkdown = createRequire(
  path.join(repoRoot, "packages/plugins/plugin-markdown/package.json"),
);
const requireFromMira = createRequire(
  path.join(miraPackageRoot, "package.json"),
);

function resolvePackageRoot(
  requireFn: NodeRequire,
  specifier: string,
): string {
  let dir = path.dirname(requireFn.resolve(specifier));
  while (dir !== path.dirname(dir)) {
    if (existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error(`Unable to resolve package root for ${specifier}`);
}

function resolveWorkspacePackage(specifier: string): string {
  try {
    return resolvePackageRoot(requireFromMarkdown, specifier);
  } catch {
    // Prefer Lapis's install; fall back to Mira's when a peer isn't hoisted.
    return resolvePackageRoot(requireFromMira, specifier);
  }
}

/** Keep a single CodeMirror/Lezer identity when Mira is loaded from source. */
const miraSingletonPackages = [
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

const miraSingletonAliases = miraSourceAliases
  ? miraSingletonPackages.flatMap((specifier) => {
      try {
        return [
          {
            find: new RegExp(
              `^${specifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            ),
            replacement: resolveWorkspacePackage(specifier),
          },
        ];
      } catch {
        return [];
      }
    })
  : [];

/** Only prebundle singletons that resolve in this checkout. */
const miraSingletonOptimizeDeps = miraSingletonPackages.filter((specifier) => {
  try {
    resolveWorkspacePackage(specifier);
    return true;
  } catch {
    return false;
  }
});

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
      dedupe: [...miraSingletonPackages, "svelte"],
      alias: [
        {
          find: /^@lapis-notes\/api\/editor$/,
          replacement: path.join(apiLib, "components/editor/index.ts"),
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
        // Local Storybook: Mira source for HMR. Docker visual capture uses
        // staged package builds under `.deps/*` (dist rewritten to built/).
        ...miraSingletonAliases,
        ...(miraSourceAliases
          ? [
              {
                find: /^@lapismd\/mira\/themes\/obsidian\.css$/,
                replacement: path.join(miraSrc, "themes/obsidian.css"),
              },
              {
                find: /^@lapismd\/mira\/themes\/mira\.css$/,
                replacement: path.join(miraSrc, "themes/mira.css"),
              },
              {
                find: /^@lapismd\/mira\/themes\.css$/,
                replacement: path.join(miraSrc, "themes.css"),
              },
              {
                find: /^@lapismd\/mira\/styles\.css$/,
                replacement: path.join(miraSrc, "styles.css"),
              },
              {
                find: /^@lapismd\/mira\/preview\/styles\.css$/,
                replacement: path.join(miraSrc, "preview/styles.css"),
              },
              {
                find: /^@lapismd\/mira\/ui\/styles\.css$/,
                replacement: path.join(miraSrc, "ui/styles.css"),
              },
              {
                find: /^@lapismd\/mira\/preview\/frontmatter$/,
                replacement: path.join(miraSrc, "preview/frontmatter/index.ts"),
              },
              {
                find: /^@lapismd\/mira\/preview$/,
                replacement: path.join(miraSrc, "preview/index.ts"),
              },
              {
                find: /^@lapismd\/mira\/codemirror$/,
                replacement: path.join(miraSrc, "codemirror.ts"),
              },
              {
                find: /^@lapismd\/mira\/extensions$/,
                replacement: path.join(miraSrc, "extensions/index.ts"),
              },
              {
                find: /^@lapismd\/mira\/core$/,
                replacement: path.join(miraSrc, "core/index.ts"),
              },
              {
                find: /^@lapismd\/mira\/tables$/,
                replacement: path.join(miraSrc, "tables/index.ts"),
              },
              {
                find: /^@lapismd\/mira\/ui\/table-dnd\/sensors$/,
                replacement: path.join(
                  miraSrc,
                  "ui/table-dnd/table-dnd-sensors.ts",
                ),
              },
              {
                find: /^@lapismd\/mira\/ui\/table-dnd\/utils$/,
                replacement: path.join(
                  miraSrc,
                  "ui/table-dnd/table-dnd-utils.ts",
                ),
              },
              {
                find: /^@lapismd\/mira\/ui\/(.+)$/,
                replacement: miraSrc + "/ui/$1",
              },
              {
                find: /^@lapismd\/mira\/ui$/,
                replacement: path.join(miraSrc, "ui/index.ts"),
              },
              {
                find: /^@lapismd\/mira$/,
                replacement: path.join(miraSrc, "index.ts"),
              },
              {
                find: /^@lapismd\/mira-editor\/styles\.css$/,
                replacement: path.join(miraEditorRoot, "src/styles.css"),
              },
              {
                find: /^@lapismd\/mira-editor$/,
                replacement: path.join(miraEditorRoot, "src/index.ts"),
              },
              {
                find: /^@lapismd\/mira-plugin-mermaid$/,
                replacement: path.join(
                  miraPluginMermaidRoot,
                  "src/index.ts",
                ),
              },
              {
                find: /^@lapismd\/mira-plugin-ai$/,
                replacement: path.join(miraPluginAiRoot, "src/index.ts"),
              },
            ]
          : []),
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
          find: /^@lapismd\/design-core\/workspace\/empty$/,
          replacement: path.join(
            designCoreRoot,
            "src/shared/workspace/empty/index.ts",
          ),
        },
        {
          find: /^@lapismd\/design-core\/workspace\/explorer$/,
          replacement: path.join(
            designCoreRoot,
            "src/shared/workspace/explorer/index.ts",
          ),
        },
        {
          find: /^@lapismd\/design-core\/workspace\/startup$/,
          replacement: path.join(
            designCoreRoot,
            "src/shared/workspace/startup/index.ts",
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
        "@lapismd/mira",
        "@lapismd/mira-editor",
        "@lapismd/mira-plugin-ai",
        "@lapismd/mira-plugin-mermaid",
      ],
      include: [
        "aria-query",
        "react",
        "react-dom",
        "react-dom/client",
        "@dnd-kit/svelte",
        "@dnd-kit/dom",
        ...miraSingletonOptimizeDeps,
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
        allow: [
          repoRoot,
          designCoreRoot,
          miraPackageRoot,
          miraEditorRoot,
          miraPluginMermaidRoot,
          miraPluginAiRoot,
          // Local Storybook only — Docker visual capture uses `.deps/*`.
          path.resolve(repoRoot, "../mira-mde"),
        ],
      },
      watch: {
        ignored: ["**/storybook-static/**"],
      },
    },
  });
}
