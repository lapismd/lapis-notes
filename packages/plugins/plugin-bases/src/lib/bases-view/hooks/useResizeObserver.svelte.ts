export function useResizeObserver() {
  let size = $state({ width: 0, height: 0 });
  let ref = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!ref) return;
    const observer = new ResizeObserver(([entry]) => {
      size = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
    });
    observer.observe(ref);
    return () => {
      observer.disconnect();
    };
  });

  return {
    set ref(el: HTMLElement) {
      ref = el;
    },
    get size() {
      return size;
    },
  };
}
