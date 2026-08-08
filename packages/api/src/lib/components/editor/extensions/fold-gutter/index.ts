import { foldGutter as editorFoldGutter } from "@codemirror/language";
import type { Extension } from "@codemirror/state";

/**
 * Mira / Obsidian-style fold chevron. `open` means the range is expanded and
 * can be folded (chevron points down); closed means folded (chevron points
 * endward).
 */
export function useFoldIcon(open: boolean) {
  const foldIcon = document.createElement("div");
  foldIcon.className = "collapse-icon";
  const foldIcon_svg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  const foldIcon_svg_path = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  foldIcon_svg.setAttributeNS(null, "viewBox", "0 0 24 24");
  foldIcon_svg.setAttributeNS(null, "fill", "none");
  foldIcon_svg.setAttributeNS(null, "stroke", "currentColor");
  foldIcon_svg.setAttributeNS(null, "stroke-width", "2");
  foldIcon_svg.setAttributeNS(null, "stroke-linecap", "round");
  foldIcon_svg.setAttributeNS(null, "stroke-linejoin", "round");
  foldIcon_svg.setAttributeNS(null, "class", "svg-icon");
  foldIcon_svg_path.setAttribute("d", "M3 8L12 17L21 8");
  foldIcon_svg.appendChild(foldIcon_svg_path);
  if (open) {
    foldIcon.classList.add("open-fold-icon");
  } else {
    foldIcon.classList.add("closed-fold-icon");
    foldIcon_svg.setAttribute(
      "style",
      "height: 100%; transform: rotate(-90deg);",
    );
  }
  foldIcon.appendChild(foldIcon_svg);

  // Keep leaf-content tab activation from seeing pointerdown; click still
  // bubbles to the CodeMirror fold gutter handler.
  for (const type of ["pointerdown", "mousedown"] as const) {
    foldIcon.addEventListener(type, (event) => {
      event.stopPropagation();
    });
  }

  return foldIcon;
}

export function foldGutter(): Extension {
  return editorFoldGutter({ markerDOM: useFoldIcon });
}
