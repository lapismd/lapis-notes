export function createSearchPanelHost(doc: Document): HTMLDivElement {
  return doc.createElement("div");
}

export function focusSearchPanelInput(container: ParentNode): void {
  container.querySelector<HTMLInputElement>("input.search-input")?.focus();
}
