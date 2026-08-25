import { mount, unmount, type Component, type MountOptions } from "svelte";

export interface LocalMountComponent<T extends Record<string, unknown>> {
  readonly props: T;
  readonly target: Document | Element | ShadowRoot;
  destroy(): void;
}

export function mountLocalComponent<T extends Record<string, unknown>>(
  component: Component<T, Record<string, unknown>, any>,
  options: MountOptions<T>,
): LocalMountComponent<T> {
  const props = $state(options.props ?? {}) as T;
  const instance = mount(component, { ...options, props });
  return {
    props,
    target: options.target,
    destroy() {
      void unmount(instance);
    },
  };
}
