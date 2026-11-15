import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineConfig } from "vitest/config";
import {
  storybookFirstPartyPackageExcludes,
  storybookPackedDependencyIncludes,
} from "./.storybook/dependency-optimization.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  optimizeDeps: {
    exclude: [...storybookFirstPartyPackageExcludes],
    include: [
      "aria-query",
      "react",
      "react-dom",
      "react-dom/client",
      "@storybook/addon-a11y/preview",
      "@storybook/svelte-vite",
      ...storybookPackedDependencyIncludes,
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
          exclude: [...storybookFirstPartyPackageExcludes],
          include: [
            "aria-query",
            "react",
            "react-dom",
            "react-dom/client",
            "@storybook/addon-a11y/preview",
            "@storybook/svelte-vite",
            ...storybookPackedDependencyIncludes,
          ],
        },
        ssr: {
          noExternal: ["aria-query"],
        },
        test: {
          name: "storybook",
          // User-approved quarantine: the two LinkPreviewAcceptance cases can
          // lose the browser orchestrator connection before either test runs.
          // Catalog/pointer fixtures remain available; omitted tests are not a pass.
          // Evidence: spec/records/2026-11-15-link-preview-browser-quarantine.md
          exclude: [
            ...configDefaults.exclude,
            ...(process.env.LAPIS_NOTES_RUN_QUARANTINED_LINK_PREVIEW === "1"
              ? []
              : [
                  "stories/plugins/markdown/panels/LinkPreviewAcceptance.stories.ts",
                ]),
          ],
          setupFiles: ["./.storybook/vitest.setup.ts"],
          testTimeout: 120_000,
          // App-backed stories share browser-level compatibility and overlay
          // resources. Run files serially so one App can finish teardown before
          // another file installs its lifecycle lease in the same browser.
          fileParallelism: false,
          browser: {
            enabled: true,
            fileParallelism: false,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
