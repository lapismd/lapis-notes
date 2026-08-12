import type { VirtualDocument } from "@lapis-notes/api";
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import type { LanguageServiceSidecarManager } from "./language-service-sidecar";

export const DESKTOP_LS_PROTOCOL_VERSION = 1;

const LS_MAX_TEXT_CHARS = 2_000_000;
const LS_MAX_URI_CHARS = 8_192;
const LS_MAX_POSITION = 2_000_000;

function readProtocol(payload: unknown): asserts payload is Record<string, unknown> {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("desktop_ls: missing payload envelope");
  }
  const version = Number(
    (payload as Record<string, unknown>).protocolVersion,
  );
  if (version !== DESKTOP_LS_PROTOCOL_VERSION) {
    throw new Error(
      `desktop_ls: unsupported protocol ${String(version)}, expected ${DESKTOP_LS_PROTOCOL_VERSION}`,
    );
  }
}

export function sanitizeVirtualDocument(raw: unknown): VirtualDocument {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("desktop_ls: missing document");
  }
  const document = raw as Record<string, unknown>;
  const uri = String(document.uri ?? "");
  const languageId = String(document.languageId ?? "");
  const text = String(document.text ?? "");
  const version = Number(document.version);
  if (
    uri.length === 0 ||
    uri.length > LS_MAX_URI_CHARS ||
    languageId !== "markdown" ||
    !Number.isFinite(version) ||
    version < 0 ||
    text.length > LS_MAX_TEXT_CHARS
  ) {
    throw new Error("desktop_ls: invalid Markdown document bounds");
  }
  return { uri, languageId, text, version: Math.trunc(version) };
}

function sanitizePosition(raw: unknown): { line: number; character: number } {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("desktop_ls: missing position");
  }
  const record = raw as Record<string, unknown>;
  const line = Number(record.line);
  const character = Number(record.character);
  if (
    !Number.isFinite(line) ||
    line < 0 ||
    line > LS_MAX_POSITION ||
    !Number.isFinite(character) ||
    character < 0 ||
    character > LS_MAX_POSITION
  ) {
    throw new Error("desktop_ls: invalid position bounds");
  }
  return { line: Math.trunc(line), character: Math.trunc(character) };
}

function sanitizeRange(raw: unknown): {
  start: { line: number; character: number };
  end: { line: number; character: number };
} {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("desktop_ls: missing range");
  }
  const record = raw as Record<string, unknown>;
  return {
    start: sanitizePosition(record.start),
    end: sanitizePosition(record.end),
  };
}

let installed = false;

export function ensureLanguageServiceIpc(
  manager: LanguageServiceSidecarManager,
  assertSender: (event: IpcMainInvokeEvent) => void,
): void {
  if (installed) return;
  installed = true;

  ipcMain.handle("desktop_ls_capabilities", async (event, payload) => {
    assertSender(event);
    readProtocol(payload);
    return { markdown: true };
  });

  ipcMain.handle("desktop_ls_update_document", async (event, payload) => {
    assertSender(event);
    readProtocol(payload);
    await manager.invoke("document-update", {
      document: sanitizeVirtualDocument(payload.document),
    });
    return null;
  });

  ipcMain.handle("desktop_ls_diagnostics", async (event, payload) => {
    assertSender(event);
    readProtocol(payload);
    return manager.invoke("diagnostics", {
      document: sanitizeVirtualDocument(payload.document),
    });
  });

  ipcMain.handle("desktop_ls_code_actions", async (event, payload) => {
    assertSender(event);
    readProtocol(payload);
    return manager.invoke("code-actions", {
      document: sanitizeVirtualDocument(payload.document),
      range: sanitizeRange(payload.range),
    });
  });
}
