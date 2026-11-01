import { afterEach, expect, it } from "vitest";
import { mount, unmount } from "svelte";
import PluginRegistryContentState from "./PluginRegistryContentState.svelte";

let component: ReturnType<typeof mount>;
let target: HTMLDivElement;
afterEach(async () => {
  if (component) await unmount(component);
  target?.remove();
});

it("uses skeleton rows and one announcement while loading instead of a package illustration", () => {
  target = document.createElement("div");
  document.body.append(target);
  component = mount(PluginRegistryContentState, {
    target,
    props: {
      kind: "loading",
      heading: "Loading plugins",
      description: "Reading verified metadata",
    },
  });
  expect(
    target.querySelectorAll('[data-ui-component="skeleton"]').length,
  ).toBeGreaterThan(3);
  expect(target.querySelector('[role="status"]')?.textContent).toContain(
    "Loading plugins",
  );
  expect(target.querySelector("svg")).toBeNull();
  expect(target.querySelector("button, a")).toBeNull();
});
