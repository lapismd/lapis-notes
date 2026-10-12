function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/gu, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gu,
      (_match, label, url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
    );
}

export function renderRegistryMarkdown(markdown: string): string {
  const output: string[] = [];
  const paragraphs: string[] = [];
  const listItems: string[] = [];
  const flushParagraph = (): void => {
    if (paragraphs.length === 0) return;
    output.push(`<p>${renderInline(paragraphs.join(" "))}</p>`);
    paragraphs.length = 0;
  };
  const flushList = (): void => {
    if (listItems.length === 0) return;
    output.push(
      `<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`,
    );
    listItems.length = 0;
  };
  for (const line of markdown.replaceAll("\r\n", "\n").split("\n")) {
    const heading = /^(#{1,3})\s+(.+)$/u.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1]!.length;
      output.push(`<h${level}>${renderInline(heading[2]!)}</h${level}>`);
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2));
      continue;
    }
    if (line.trim() === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraphs.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return output.join("\n");
}
