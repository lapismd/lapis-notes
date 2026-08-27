type DesktopStatusElement = {
  hidden: boolean;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
};

type DesktopPresentationDocument = {
  documentElement: {
    setAttribute(name: string, value: string): void;
  };
  getElementById(id: string): DesktopStatusElement | null;
};

export function dismissDesktopBootPresentation(
  document: DesktopPresentationDocument,
): void {
  const status = document.getElementById("lapis-boot-status");
  if (!status) return;
  status.hidden = true;
  status.setAttribute("aria-hidden", "true");
}

export function showDesktopClosingPresentation(
  document: DesktopPresentationDocument,
): void {
  document.documentElement.setAttribute("data-desktop-closing", "true");
  const status = document.getElementById("lapis-boot-status");
  if (!status) return;
  status.hidden = false;
  status.removeAttribute("aria-hidden");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-label", "Closing Lapis Notes");
}
