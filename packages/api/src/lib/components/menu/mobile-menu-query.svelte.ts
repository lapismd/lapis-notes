import { onMount } from "svelte";

export function createMobileMenuQuery() {
  let matches = $state(
    globalThis.matchMedia?.("(max-width: 767px)").matches ?? false,
  );

  onMount(() => {
    if (!globalThis.matchMedia) {
      return;
    }

    const media = globalThis.matchMedia("(max-width: 767px)");
    const update = () => {
      matches = media.matches;
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  });

  return {
    get matches() {
      return matches;
    },
  };
}
