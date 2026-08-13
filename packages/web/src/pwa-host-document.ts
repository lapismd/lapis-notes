type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform?: string };
};

function detectEngine(): "webkit" | "blink" | "gecko" | "unknown" {
  const userAgent = navigator.userAgent;
  if (/Firefox\//u.test(userAgent)) return "gecko";
  if (
    /AppleWebKit/u.test(userAgent) &&
    !/(Chrome|Chromium|CriOS|Edg|OPR)/u.test(userAgent)
  ) {
    return "webkit";
  }
  if (/(Chrome|Chromium|CriOS|Edg|OPR)/u.test(userAgent)) return "blink";
  return "unknown";
}

function detectOs(navigatorObject: NavigatorWithUserAgentData): string {
  const platform = [
    navigatorObject.userAgentData?.platform,
    navigatorObject.platform,
    navigatorObject.userAgent,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  if (/iphone|ipad|ipod|ios/u.test(platform)) return "ios";
  if (/android/u.test(platform)) return "android";
  if (/mac/u.test(platform)) return "macos";
  if (/win/u.test(platform)) return "windows";
  if (/linux|x11/u.test(platform)) return "linux";
  return "unknown";
}

export function isInstalledPwaHost(): boolean {
  if (typeof globalThis.matchMedia !== "function") return false;
  return (
    globalThis.matchMedia("(display-mode: standalone)").matches ||
    globalThis.matchMedia("(display-mode: window-controls-overlay)").matches ||
    globalThis.matchMedia("(display-mode: minimal-ui)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function initializeWebHostDocument(): void {
  if (typeof document === "undefined" || typeof navigator === "undefined") return;
  const root = document.documentElement;
  root.dataset.pwaHost = "true";
  root.dataset.runtime = "web-pwa";
  root.dataset.pwaTitlebarHidden = "false";
  root.dataset.engine = detectEngine();
  root.dataset.os = detectOs(navigator as NavigatorWithUserAgentData);
  if (isInstalledPwaHost()) root.dataset.pwaInstalled = "true";
}
