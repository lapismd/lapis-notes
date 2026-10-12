import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/svelte-vite";
import { afterAll, afterEach, beforeAll } from "vitest";
import { installFatalStorybookRuntimeWarningGuard } from "../scripts/storybook-runtime-warnings.mjs";
import * as projectAnnotations from "./preview";

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

// a11y annotations first so preview `parameters.a11y.test` overrides addon defaults.
const project = setProjectAnnotations([
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
