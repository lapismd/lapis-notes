export type DesktopHostDocumentPlatform = {
  runtime: string;
  os: string;
  overlayWindowControls?: boolean;
  rendererEngine?: "webkit" | "blink";
};

type DesktopDocumentRoot = {
  classList: Pick<DOMTokenList, "toggle">;
  dataset: DOMStringMap;
};

export function applyDesktopHostDocument(
  platform: DesktopHostDocumentPlatform,
  root: DesktopDocumentRoot = document.documentElement,
): void {
  const desktopRuntime = platform.runtime === "deno-desktop";
  root.classList.toggle("lapis-desktop", desktopRuntime);
  root.classList.toggle(
    "lapis-desktop--macos",
    desktopRuntime &&
      platform.os === "macos" &&
      platform.overlayWindowControls === true,
  );
  root.dataset.runtime = "deno-desktop";
  root.dataset.engine =
    platform.rendererEngine === "blink" ? "blink" : "webkit";
}
