import { defineConfig } from "@playwright/test";
import hosted from "./playwright.rust-server.config";

export default defineConfig(hosted, {
  testMatch: ["rust-server-history.spec.ts", "rust-server-backup.spec.ts"],
  outputDir: "../../.local/rust-hosted-history-results",
});
