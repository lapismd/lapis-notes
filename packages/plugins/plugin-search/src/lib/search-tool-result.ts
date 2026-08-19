import {
  FileView,
  TextFileView,
  TFile,
  type App,
  type EditorPosition,
} from "@lapis-notes/api";
import type { AgentResultViewProps } from "@lapis-notes/api";

export type NotesSearchSnippet = {
  text: string;
  offset: number;
};

export type NotesSearchHit = {
  path: string;
  score: number;
  snippets: NotesSearchSnippet[];
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function normalizeHits(value: unknown): NotesSearchHit[] {
  if (!Array.isArray(value)) return [];
  const hits: NotesSearchHit[] = [];
  for (const entry of value) {
    const record = asRecord(entry);
    if (!record) continue;
    const path = record.path;
    if (typeof path !== "string" || !path.trim()) continue;
    const snippets = Array.isArray(record.snippets)
      ? record.snippets.flatMap((snippet) => {
          const item = asRecord(snippet);
          if (!item || typeof item.text !== "string") return [];
          return [
            {
              text: item.text,
              offset:
                typeof item.offset === "number" && Number.isFinite(item.offset)
                  ? Math.max(0, item.offset)
                  : 0,
            },
          ];
        })
      : [];
    hits.push({
      path: path.trim(),
      score:
        typeof record.score === "number" && Number.isFinite(record.score)
          ? record.score
          : 0,
      snippets,
    });
  }
  return hits;
}

function resultsFromRecord(
  record: Record<string, unknown> | undefined,
): NotesSearchHit[] {
  if (!record) return [];
  const direct = normalizeHits(record.results);
  if (direct.length > 0) return direct;
  const structured = resultsFromRecord(asRecord(record.structuredContent));
  if (structured.length > 0) return structured;
  const content = record.content;
  if (!Array.isArray(content)) return [];
  for (const item of content) {
    const entry = asRecord(item);
    if (typeof entry?.text !== "string") continue;
    const nested = resultsFromRecord(asRecord(parseJson(entry.text)));
    if (nested.length > 0) return nested;
  }
  return [];
}

export function notesSearchHitsFromOutput(output: unknown): NotesSearchHit[] {
  return resultsFromRecord(asRecord(parseJson(output)));
}

export function fileNameFromPath(path: string): string {
  return path.split("/").at(-1) || path;
}

export function editorPositionFromOffset(
  source: string,
  offset: number,
): EditorPosition {
  const clamped = Math.max(0, Math.min(offset, source.length));
  const before = source.slice(0, clamped);
  const line = before.split("\n").length - 1;
  const ch = before.length - (before.lastIndexOf("\n") + 1);
  return { line, ch };
}

export async function openNotesSearchHit(
  app: App,
  hit: NotesSearchHit,
  snippet?: NotesSearchSnippet,
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(hit.path);
  if (!(file instanceof TFile)) return;
  const selected =
    app.workspace.getMostRecentLeaf() ?? app.workspace.activeLeaf;
  const leaf =
    selected && selected.view instanceof FileView
      ? selected
      : app.workspace.getLeaf("tab");
  await leaf.openFile(file);
  app.workspace.activeLeaf = leaf;
  app.workspace.revealLeaf(leaf);
  if (!snippet || !(leaf.view instanceof TextFileView)) return;
  try {
    const source = await app.vault.cachedRead(file);
    leaf.view.editor.setCursor(
      editorPositionFromOffset(source, snippet.offset),
    );
  } catch {
    // Opening the file is enough when the editor is not ready.
  }
}

export function searchToolResultProps(
  props: AgentResultViewProps<App>,
): NotesSearchHit[] {
  return notesSearchHitsFromOutput(props.output);
}
