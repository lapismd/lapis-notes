import { mount, unmount, type Component, type MountOptions } from "svelte";

export function mountComponent<T extends Record<string, any>>(
  component: Component<T, Record<string, any>, any>,
  options: MountOptions<T>,
): MountComponent<T> {
  const _props: Record<string, any> = $state(options.props || {});
  const comp = mount(component, { ...options, props: _props as T });
  return {
    destroy() {
      unmount(comp);
    },

    get target() {
      return options.target;
    },

    get props(): T {
      return _props as T;
    },
  };
}

export type MountComponent<T> = {
  props: T;
  target: Document | Element | ShadowRoot;
  destroy: () => void;
};
