import { defineConfig } from "@playwright/test";

const port = Number(process.env.SPECIFICATION_PORT ?? "7310");
const staticBuild = process.env.SPECIFICATION_STATIC === "1";
const baseURL =
  process.env.SPECIFICATION_BASE_URL ??
  `http://127.0.0.1:${port}${staticBuild ? "/specification-preview/" : "/"}`;

export default defineConfig({
  testDir: "./tests/specification",
  fullyParallel: false,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: process.env.SPECIFICATION_BASE_URL
    ? undefined
    : {
        command: staticBuild
          ? `node scripts/serve-specification-storybook.mjs ${port}`
          : `STORYBOOK_PORT=${port} VISUAL_SERVER_PORT=${port + 1} pnpm storybook`,
        url: new URL("index.json", baseURL).href,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
