import type { BootstrapAppearanceMode } from "@lapis-notes/api";

export function applyWebHostAppearance(
  mode: BootstrapAppearanceMode,
  source: Document = document,
): void {
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      source.defaultView?.matchMedia?.("(prefers-color-scheme: dark)")
        .matches === true);
  const root = source.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  root.classList.toggle("theme-dark", dark);
  root.classList.toggle("theme-light", !dark);
  root.dataset.uiTheme = "lapis";
}

export function observeWebHostAppearance(
  mode: BootstrapAppearanceMode,
  source: Document = document,
): () => void {
  const media = source.defaultView?.matchMedia?.(
    "(prefers-color-scheme: dark)",
  );
  const sync = () => applyWebHostAppearance(mode, source);
  sync();
  media?.addEventListener("change", sync);
  return () => media?.removeEventListener("change", sync);
}
