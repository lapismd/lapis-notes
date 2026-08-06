import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  optimizeDeps: {
    include: [
      "aria-query",
      "react",
      "react-dom",
      "react-dom/client",
      "@storybook/addon-a11y/preview",
      "@storybook/svelte-vite",
    ],
  },
  ssr: {
    noExternal: ["aria-query"],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        optimizeDeps: {
          include: [
            "aria-query",
            "react",
            "react-dom",
            "react-dom/client",
            "@storybook/addon-a11y/preview",
            "@storybook/svelte-vite",
          ],
        },
        ssr: {
          noExternal: ["aria-query"],
        },
        test: {
          name: "storybook",
          setupFiles: ["./.storybook/vitest.setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
