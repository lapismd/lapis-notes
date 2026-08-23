export type DesktopWindowOpenDecision =
  | { action: "blank-window" }
  | { action: "external"; url: string }
  | { action: "deny" };

export function classifyDesktopWindowOpen(
  value: string | URL | undefined,
): DesktopWindowOpenDecision {
  const raw = value instanceof URL ? value.href : (value ?? "").trim();
  if (raw === "" || raw === "about:blank") return { action: "blank-window" };
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { action: "external", url: url.href };
    }
  } catch {
    // A malformed or relative new-window target is not a workspace popout.
  }
  return { action: "deny" };
}

function externalAnchorUrl(
  value: string,
  rendererOrigin: string,
): string | null {
  try {
    const url = new URL(value, rendererOrigin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin === rendererOrigin ? null : url.href;
  } catch {
    return null;
  }
}

export function installDenoExternalLinkPolicy(
  invoke: (
    command: string,
    payload?: Record<string, unknown>,
  ) => Promise<unknown>,
): () => void {
  const originalOpen = window.open.bind(window);
  const openExternal = (url: string) => {
    void invoke("desktop_open_external", { url }).catch((error) => {
      console.error("[lapis-deno] external link failed", error);
    });
  };

  window.open = (
    url?: string | URL,
    target?: string,
    features?: string,
  ): Window | null => {
    const decision = classifyDesktopWindowOpen(url);
    if (decision.action === "blank-window") {
      return originalOpen("about:blank", target, features);
    }
    if (decision.action === "external") openExternal(decision.url);
    return null;
  };

  const onDocumentClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const url = externalAnchorUrl(anchor.href, globalThis.location.origin);
    if (!url) return;
    event.preventDefault();
    openExternal(url);
  };
  document.addEventListener("click", onDocumentClick, true);

  return () => {
    window.open = originalOpen;
    document.removeEventListener("click", onDocumentClick, true);
  };
}
