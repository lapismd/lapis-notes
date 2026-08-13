const HOST_THEME_COLOR_ATTRIBUTE = "data-lapis-host-theme-color";
const BOOTSTRAP_THEME_COLOR_ATTRIBUTE = "data-lapis-bootstrap-theme-color";
const THEME_COLOR_VARIABLES = [
  "--workspace-chrome-background",
  "--tab-container-background",
  "--sidebar",
  "--titlebar-background",
  "--background-secondary",
  "--background-primary",
] as const;

function resolveCssColor(source: Document, value: string): string | null {
  const probe = source.createElement("span");
  probe.style.cssText = `position:fixed;pointer-events:none;visibility:hidden;background-color:${value}`;
  (source.body ?? source.documentElement).appendChild(probe);
  const color =
    source.defaultView?.getComputedStyle(probe).backgroundColor.trim() ?? "";
  probe.remove();
  return !color || color === "rgba(0, 0, 0, 0)" || color === "transparent"
    ? null
    : color;
}

export function resolveDocumentThemeColor(source: Document = document): string {
  for (const variableName of THEME_COLOR_VARIABLES) {
    const color = resolveCssColor(source, `var(${variableName})`);
    if (color) return color;
  }
  const bodyColor = source.body
    ? source.defaultView?.getComputedStyle(source.body).backgroundColor.trim()
    : "";
  return bodyColor && bodyColor !== "rgba(0, 0, 0, 0)"
    ? bodyColor
    : "#ffffff";
}

export function syncHostThemeColor(source: Document = document): void {
  source.head
    .querySelectorAll<HTMLMetaElement>(
      `meta[name='theme-color'][${BOOTSTRAP_THEME_COLOR_ATTRIBUTE}='true']`,
    )
    .forEach((meta) => meta.remove());
  let themeColor = source.head.querySelector<HTMLMetaElement>(
    `meta[name='theme-color'][${HOST_THEME_COLOR_ATTRIBUTE}='true']`,
  );
  if (!themeColor) {
    themeColor = source.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.setAttribute(HOST_THEME_COLOR_ATTRIBUTE, "true");
    source.head.appendChild(themeColor);
  }
  themeColor.content = resolveDocumentThemeColor(source);
}

export function observeHostThemeColor(source: Document = document): () => void {
  const sync = () => syncHostThemeColor(source);
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(source.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  const colorScheme = source.defaultView?.matchMedia(
    "(prefers-color-scheme: dark)",
  );
  colorScheme?.addEventListener("change", sync);
  return () => {
    observer.disconnect();
    colorScheme?.removeEventListener("change", sync);
  };
}
