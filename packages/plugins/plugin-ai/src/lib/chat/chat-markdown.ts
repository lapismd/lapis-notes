function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function renderChatMarkdown(text: string): string {
  const blocks = text.replaceAll("\r\n", "\n").split(/\n{2,}/);
  const html: string[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const fence = trimmed.match(/^```(?:\w+)?\n?([\s\S]*?)```$/);
    if (fence) {
      html.push(`<pre><code>${escapeHtml(fence[1] ?? "").trim()}</code></pre>`);
      continue;
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1]?.length ?? 1;
      html.push(`<h${level}>${inlineMarkdown(heading[2] ?? "")}</h${level}>`);
      continue;
    }
    if (/^[-*]\s+/m.test(trimmed)) {
      const items = trimmed
        .split("\n")
        .map((line) => line.replace(/^[-*]\s+/, "").trim())
        .filter(Boolean)
        .map((item) => `<li>${inlineMarkdown(item)}</li>`)
        .join("");
      html.push(`<ul>${items}</ul>`);
      continue;
    }
    html.push(`<p>${inlineMarkdown(trimmed.replaceAll("\n", " "))}</p>`);
  }
  return html.join("");
}
