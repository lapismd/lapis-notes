import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/svelte-vite";
import { beforeAll } from "vitest";
import { assertNoFatalStorybookRuntimeWarning } from "../scripts/storybook-runtime-warnings.mjs";
import * as projectAnnotations from "./preview";

// a11y annotations first so preview `parameters.a11y.test` overrides addon defaults.
const project = setProjectAnnotations([
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);

const guardKey = Symbol.for("lapis.storybook.runtime-warning-guard");
const guardedGlobal = globalThis as typeof globalThis & {
  [guardKey]?: boolean;
};

if (!guardedGlobal[guardKey]) {
  guardedGlobal[guardKey] = true;
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    assertNoFatalStorybookRuntimeWarning(args);
  };
  console.error = (...args: unknown[]) => {
    originalError(...args);
    assertNoFatalStorybookRuntimeWarning(args);
  };
}
