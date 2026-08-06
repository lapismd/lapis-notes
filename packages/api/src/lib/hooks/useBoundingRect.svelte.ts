import { onMount } from "svelte";
type BoundingRectProps = {
  resize: boolean;
  scroll: boolean;
  observe: boolean;
};

export function useBoundingRect(props: Partial<BoundingRectProps> = {}) {
  const { resize = true, scroll = false, observe = false } = props;
  let ref = $state<HTMLElement | null>(null);
  let rect = $state<DOMRect | null>(null);
  let observer = new ResizeObserver(() => update());

  const update = () => {
    if (!ref) return;
    rect = ref.getBoundingClientRect();
  };

  onMount(() => {
    if (resize) {
      window.addEventListener("resize", update);
    }

    if (scroll) {
      window.addEventListener("scroll", update);
    }

    update();

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      observer.disconnect();
    };
  });

  return {
    get ref() {
      return ref;
    },
    get rect() {
      return rect;
    },
    set ref(el) {
      ref = el;
      update();
      if (el && observe) {
        if (observer) {
          observer.disconnect();
        }
        observer = new ResizeObserver(update);
        observer.observe(el);
      }
    },
    update,
  };
}
