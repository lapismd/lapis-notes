export function createLanguageServiceHoverDom(
  doc: Document,
  contents: string,
): HTMLDivElement {
  const dom = doc.createElement("div");
  dom.className = "cm-language-service-hover";
  dom.textContent = contents;
  return dom;
}
