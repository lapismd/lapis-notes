/// <reference types="vitest" />

import { defineConfig, type PluginOption } from "vite";
import { fileURLToPath, URL } from "url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";

const packageDir = fileURLToPath(new URL(".", import.meta.url));
const uiLib = fileURLToPath(new URL("../ui/src/lib", import.meta.url));
const uiComponents = path.join(uiLib, "components/ui");

/** Expected plugin-manager and command-manager failure-path logs in Vitest. */
const SUPPRESSED_VITEST_CONSOLE_PATTERNS = [
  /Unable to load hotkeys\.json; ignoring custom hotkeys/,
  /^Failed to enable plugin .+:/,
  /^Failed to load plugin from /,
  /^Plugin .+ is required and cannot be disabled/,
];

function shouldSuppressVitestConsoleLog(log: string): boolean {
  return SUPPRESSED_VITEST_CONSOLE_PATTERNS.some((pattern) =>
    pattern.test(log),
  );
}

const pluginHostProviderValuesStubAlias = {
  find: fileURLToPath(
    new URL(
      "../workspace/src/lib/generated/plugin-host-cjs-provider-values.generated.ts",
      import.meta.url,
    ),
  ),
  replacement: fileURLToPath(
    new URL(
      "./test/stubs/plugin-host-cjs-provider-values.stub.ts",
      import.meta.url,
    ),
  ),
};

export default defineConfig(() => {
  const isVitest = process.env.VITEST === "true";

  return {
    plugins: [
      ...(svelte({ preprocess: vitePreprocess() }) as PluginOption[]),
    ],
    test: {
      environment: "jsdom",
      setupFiles: ["./test/vitest.setup.ts"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.svelte-kit/**",
      ],
      onConsoleLog(log, type) {
        if (type === "stderr" && shouldSuppressVitestConsoleLog(log)) {
          return false;
        }
      },
    },
    resolve: {
      conditions: ["module", "browser", "development"],
      // Keep host CodeMirror types authoritative when design-core is linked.
      dedupe: [
        "@codemirror/state",
        "@codemirror/view",
        "@codemirror/language",
        "@codemirror/autocomplete",
        "@codemirror/commands",
        "@codemirror/lint",
        "@codemirror/search",
        "svelte",
        "bits-ui",
      ],
      alias: [
        ...(isVitest ? [pluginHostProviderValuesStubAlias] : []),
        // UI package $lib paths used by kept compounds (precede api $lib).
        {
          find: /^\$lib\/components\/ui\/(.*)$/,
          replacement: `${uiComponents}/$1`,
        },
        {
          find: /^\$lib\/utils(?:\.js)?$/,
          replacement: path.join(uiLib, "utils.ts"),
        },
        {
          find: "$lib",
          replacement: path.join(packageDir, "src/lib"),
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
          replacement: `${uiComponents}/$1`,
        },
        {
          find: /^@lapis-notes\/ui$/,
          replacement: path.join(uiLib, "index.ts"),
        },
        {
          find: /^@lapis-notes\/api$/,
          replacement: path.join(packageDir, "src/lib/index.ts"),
        },
      ],
    },
    ssr: {
      noExternal: [
        "@dnd-kit/svelte",
        "@lucide/svelte",
        "bits-ui",
        "paneforge",
        "vaul-svelte",
      ],
    },
    esbuild: {
      minifyIdentifiers: false,
    },
    build: {
      lib: {
        entry: "src/lib/index",
        formats: ["cjs"],
      },
      sourcemap: "inline",
    },
  };
});
