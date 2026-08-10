import { defineConfig, devices } from "@playwright/test";

const storybookPort = Number(process.env.STORYBOOK_PORT ?? "7010");
const port = Number(
  process.env.WORKSPACE_STORYBOOK_PORT ?? storybookPort + 200,
);
const visualPort = Number(process.env.WORKSPACE_VISUAL_SERVER_PORT ?? port + 1);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/workspace",
  fullyParallel: false,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  retries: process.env.CI ? 2 : 1,
  reporter: [["list"]],
  use: {
    baseURL,
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: [
      `STORYBOOK_PORT=${port}`,
      `VISUAL_SERVER_PORT=${visualPort}`,
      `STORYBOOK_EXTRA_PORTS='${visualPort} ${port + 90}'`,
      "pnpm storybook",
    ].join(" "),
    url: `${baseURL}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
