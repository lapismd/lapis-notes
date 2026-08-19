import { mount, unmount, type Component } from "svelte";
import type { App } from "@lapis-notes/api";

export function dialogPortalPropsForApp(app: App): { to: HTMLElement } {
  return { to: app.workspace.getCommandHostDocument().body };
}

export function mountDialog<Props extends Record<string, unknown>>(
  app: App,
  component: Component<Props>,
  props: Props,
): { close: () => void } {
  const target = app.workspace.getCommandHostDocument().body;
  const instance = mount(component, {
    target,
    props,
  });
  return {
    close: () => {
      void unmount(instance);
    },
  };
}
