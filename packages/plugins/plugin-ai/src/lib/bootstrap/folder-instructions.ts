import { hasHostFilesystemPath } from "../skills/manifest";
import {
  FOLDER_INSTRUCTION_FILE,
  MAX_FOLDER_INSTRUCTION_CHARS,
  MAX_FOLDER_INSTRUCTION_TOTAL_CHARS,
  type FolderInstruction,
} from "./types";

export function ancestorScopeDirs(scopeDir: string): string[] {
  const segments = scopeDir.split("/").filter(Boolean);
  const dirs = [""];
  for (let index = 0; index < segments.length; index += 1) {
    dirs.push(segments.slice(0, index + 1).join("/"));
  }
  return dirs;
}

export function folderInstructionPath(scopeDir: string): string {
  return scopeDir
    ? `${scopeDir}/.lapis/${FOLDER_INSTRUCTION_FILE}`
    : `.lapis/${FOLDER_INSTRUCTION_FILE}`;
}

export async function readAncestorFolderInstructions(
  readText: (path: string) => Promise<string | undefined>,
  scopeDir: string,
): Promise<FolderInstruction[]> {
  const collected: FolderInstruction[] = [];
  let remaining = MAX_FOLDER_INSTRUCTION_TOTAL_CHARS;
  for (const dir of ancestorScopeDirs(scopeDir)) {
    const path = folderInstructionPath(dir);
    const raw = (await readText(path))?.replaceAll("\r\n", "\n");
    if (raw == null || !raw.trim()) continue;
    if (hasHostFilesystemPath(raw)) {
      collected.push({
        path,
        text: "",
        truncated: false,
        omitted: "path-bearing",
      });
      continue;
    }
    let text = raw.trim();
    let truncated = false;
    if (text.length > MAX_FOLDER_INSTRUCTION_CHARS) {
      text = text.slice(0, MAX_FOLDER_INSTRUCTION_CHARS);
      truncated = true;
    }
    if (text.length > remaining) {
      text = text.slice(0, Math.max(0, remaining));
      truncated = true;
    }
    remaining -= text.length;
    collected.push({ path, text, truncated });
    if (remaining <= 0) break;
  }
  return collected;
}
