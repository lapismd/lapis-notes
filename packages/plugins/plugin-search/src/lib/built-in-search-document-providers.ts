import type { SearchDocumentProvider } from "@lapis-notes/api";

type LocalSearchDocumentProvider = Omit<SearchDocumentProvider, "id">;

function canvasText(content: string): string {
  try {
    const canvas = JSON.parse(content) as {
      nodes?: Array<{
        type?: string;
        text?: string;
        label?: string;
        file?: string;
        url?: string;
      }>;
      edges?: Array<{ label?: string }>;
    };
    return [
      ...(canvas.nodes ?? []).flatMap((node) => [
        node.type,
        node.text,
        node.label,
        node.file,
        node.url,
      ]),
      ...(canvas.edges ?? []).map((edge) => edge.label),
    ]
      .filter((part): part is string => Boolean(part?.trim()))
      .join("\n");
  } catch {
    return content;
  }
}

export const MARKDOWN_SEARCH_DOCUMENT_PROVIDER: LocalSearchDocumentProvider = {
  version: "1",
  matches: (file) => ["md", "markdown"].includes(file.extension.toLowerCase()),
  extract: ({ content }) => ({ content }),
};

export const CANVAS_SEARCH_DOCUMENT_PROVIDER: LocalSearchDocumentProvider = {
  version: "1",
  matches: (file) => file.extension.toLowerCase() === "canvas",
  extract: ({ content }) => ({ content: canvasText(content) }),
};
