import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "server-host.spec.ts",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    browserName: "chromium",
    headless: true,
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
});
