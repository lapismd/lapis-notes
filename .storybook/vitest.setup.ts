import { afterAll, afterEach } from "vitest";
import { installFatalStorybookRuntimeWarningGuard } from "../scripts/storybook-runtime-warnings.mjs";

// Register first so assertions run after story-owned teardown hooks.
const runtimeGuard = installFatalStorybookRuntimeWarningGuard();
afterEach(() => runtimeGuard.assertClean());
afterAll(() => {
  try {
    runtimeGuard.assertClean();
  } finally {
    runtimeGuard.dispose();
  }
});

// Storybook addon-vitest installs preview and addon annotations automatically.
