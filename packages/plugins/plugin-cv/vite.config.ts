import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

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

export default defineConfig({
  optimizeDeps: {
    include: [
      "aria-query",
      "react",
      "react-dom",
      "react-dom/client",
      "@storybook/addon-a11y/preview",
      "@storybook/svelte-vite",
      "@myriaddreamin/typst.ts",
      "@myriaddreamin/typst.ts/compiler",
      "@myriaddreamin/typst.ts/fs/index",
      "@myriaddreamin/typst.ts/fs/package",
      "@myriaddreamin/typst.ts/options.init",
      "@lucide/svelte/icons/book-open",
      "@lucide/svelte/icons/pencil",
    ],
    esbuildOptions: {
      target: "esnext",
    },
  },
  esbuild: {
    target: "esnext",
  },
  ssr: {
    noExternal: ["aria-query"],
  },
  test: {
    projects: [
      {
        plugins: [svelte()],
        resolve: {
          alias: {
            $lib: path.resolve(packageDir, "src/lib"),
          },
          dedupe: [...linkedSingletonPackages],
        },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(packageDir, ".storybook") }),
        ],
        test: {
          name: "storybook",
          setupFiles: ["./.storybook/vitest.setup.ts"],
          testTimeout: 60_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium", viewport: { width: 1280, height: 800 } }],
          },
        },
      },
    ],
  },
});
