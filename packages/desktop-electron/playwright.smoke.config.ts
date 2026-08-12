import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

import {
  DESKTOP_SMOKE_DEV_SERVER_URL,
  usesDesktopDevRenderer,
} from "./e2e/smoke-mode";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  testMatch: "app-boot-smoke.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: usesDesktopDevRenderer() ? 40_000 : 20_000,
  },
  globalSetup: "./e2e/global-setup.smoke.ts",
  reporter: "list",
  use: {
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  ...(usesDesktopDevRenderer()
    ? {
        webServer: {
          command: "pnpm exec vite --host 127.0.0.1 --port 1421",
          cwd: packageDir,
          url: DESKTOP_SMOKE_DEV_SERVER_URL,
          timeout: 180_000,
          reuseExistingServer: true,
        },
      }
    : {}),
});
