export function getLanguage(): string {
  return navigator.language || "en";
}

export async function loadMathJax(): Promise<void> {}

export async function loadMermaid(): Promise<any> {
  return (globalThis as any).mermaid ?? {};
}

export async function loadPdfJs(): Promise<any> {
  return (globalThis as any).pdfjsLib ?? {};
}

export async function loadPrism(): Promise<any> {
  return (globalThis as any).Prism ?? {};
}

export function renderMath(source: string, display: boolean): HTMLElement {
  const el = document.createElement(display ? "div" : "span");
  el.className = display ? "math math-block" : "math math-inline";
  el.textContent = source;
  return el;
}

export function finishRenderMath(): void {}

const unsafeElementSelector = "script, iframe, object, embed";
const urlAttributes = new Set([
  "href",
  "src",
  "xlink:href",
  "formaction",
  "poster",
]);

function isUnsafeUrl(value: string): boolean {
  return /^\s*(?:javascript:|vbscript:|data:text\/html)/i.test(value);
}

function sanitizeDomTree(root: ParentNode): void {
  root
    .querySelectorAll(unsafeElementSelector)
    .forEach((element) => element.remove());

  root.querySelectorAll("*").forEach((element) => {
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attr.name);
      } else if (urlAttributes.has(name) && isUnsafeUrl(attr.value)) {
        element.removeAttribute(attr.name);
      }
    }
  });
}

export function sanitizeHTMLString(html: string): string {
  return html
    .replace(
      /<\s*(script|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      "",
    )
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s+(href|src|xlink:href|formaction|poster)\s*=\s*(["']?)\s*(?:javascript:|vbscript:|data:text\/html)[\s\S]*?\2/gi,
      "",
    );
}

export function sanitizeHTMLToDom(html: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = sanitizeHTMLString(html);
  sanitizeDomTree(template.content);
  return template.content;
}
