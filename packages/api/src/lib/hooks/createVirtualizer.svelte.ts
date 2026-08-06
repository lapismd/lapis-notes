import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  windowScroll,
  type PartialKeys,
  type VirtualizerOptions,
} from "@tanstack/virtual-core";

export * from "@tanstack/virtual-core";

export type SvelteVirtualizer<
  TScrollElement extends Element | Window,
  TItemElement extends Element,
> = Omit<Virtualizer<TScrollElement, TItemElement>, "setOptions"> & {
  setOptions: (
    options: Partial<VirtualizerOptions<TScrollElement, TItemElement>>,
  ) => void;
};

function createVirtualizerBase<
  TScrollElement extends Element | Window,
  TItemElement extends Element,
>(
  options: VirtualizerOptions<TScrollElement, TItemElement>,
): SvelteVirtualizer<TScrollElement, TItemElement> {
  const resolvedOptions = { ...options };
  const instance = new Virtualizer(resolvedOptions);
  let virtualItems = $state(instance.getVirtualItems());
  let totalSize = $state(instance.getTotalSize());
  const originalSetOptions = instance.setOptions;

  const handler = {
    get(
      target: Virtualizer<TScrollElement, TItemElement>,
      prop: keyof Virtualizer<TScrollElement, TItemElement>,
    ) {
      if (prop === "getVirtualItems") return () => virtualItems;
      if (prop === "getTotalSize") return () => totalSize;
      return Reflect.get(target, prop);
    },
  };

  const virtualizer = new Proxy(instance, handler);
  virtualizer.setOptions(resolvedOptions);

  const setOptions = (
    options: Partial<VirtualizerOptions<TScrollElement, TItemElement>>,
  ) => {
    originalSetOptions({
      ...resolvedOptions,
      ...options,
      onChange: (instance, sync) => {
        instance._willUpdate();
        virtualItems = instance.getVirtualItems();
        totalSize = instance.getTotalSize();
        options.onChange?.(instance, sync);
      },
    });
    virtualizer.measure();
  };

  $effect(() => {
    const cleanup = virtualizer._didMount();
    virtualizer._willUpdate();
    return cleanup;
  });

  $effect(() => {
    virtualizer.setOptions({
      ...resolvedOptions,
      ...options,
      onChange: (virtualizer, sync) => {
        virtualizer._willUpdate();
        virtualItems = virtualizer.getVirtualItems();
        totalSize = virtualizer.getTotalSize();
        options.onChange?.(virtualizer, sync);
      },
    });
    virtualizer.measure();
  });

  return Object.assign(virtualizer, { setOptions });
}

export function createVirtualizer<
  TScrollElement extends Element,
  TItemElement extends Element,
>(
  options: PartialKeys<
    VirtualizerOptions<TScrollElement, TItemElement>,
    "observeElementRect" | "observeElementOffset" | "scrollToFn"
  >,
): SvelteVirtualizer<TScrollElement, TItemElement> {
  return createVirtualizerBase<TScrollElement, TItemElement>({
    observeElementRect: observeElementRect,
    observeElementOffset: observeElementOffset,
    scrollToFn: elementScroll,
    ...options,
  });
}

export function createWindowVirtualizer<TItemElement extends Element>(
  options: PartialKeys<
    VirtualizerOptions<Window, TItemElement>,
    | "getScrollElement"
    | "observeElementRect"
    | "observeElementOffset"
    | "scrollToFn"
  >,
): SvelteVirtualizer<Window, TItemElement> {
  return createVirtualizerBase<Window, TItemElement>({
    getScrollElement: () => (typeof document !== "undefined" ? window : null),
    observeElementRect: observeWindowRect,
    observeElementOffset: observeWindowOffset,
    scrollToFn: windowScroll,
    initialOffset: () => (typeof document !== "undefined" ? window.scrollY : 0),
    ...options,
  });
}
