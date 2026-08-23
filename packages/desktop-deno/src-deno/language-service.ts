import type {
  LanguageServiceRange,
  VirtualDocument,
} from "@lapis-notes/api/language-service";
import {
  markdownCodeActionsForDocument,
  markdownDiagnosticsForDocument,
} from "@lapis-notes/language-service/markdownlint/runtime";

export const DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION = 1;
const MAX_TEXT_CHARS = 2_000_000;
const MAX_URI_CHARS = 8_192;
const MAX_POSITION = 2_000_000;

function assertProtocol(payload: Record<string, unknown>): void {
  const version = Number(payload.protocolVersion);
  if (version !== DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION) {
    throw new Error(
      `desktop_ls: unsupported protocol ${String(version)}, expected ${DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION}`,
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
    !uri ||
    uri.length > MAX_URI_CHARS ||
    languageId !== "markdown" ||
    !Number.isFinite(version) ||
    version < 0 ||
    text.length > MAX_TEXT_CHARS
  ) {
    throw new Error("desktop_ls: invalid Markdown document bounds");
  }
  return { uri, languageId, text, version: Math.trunc(version) };
}

function sanitizePosition(raw: unknown): { line: number; character: number } {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("desktop_ls: missing position");
  }
  const position = raw as Record<string, unknown>;
  const line = Number(position.line);
  const character = Number(position.character);
  if (
    !Number.isFinite(line) ||
    line < 0 ||
    line > MAX_POSITION ||
    !Number.isFinite(character) ||
    character < 0 ||
    character > MAX_POSITION
  ) {
    throw new Error("desktop_ls: invalid position bounds");
  }
  return { line: Math.trunc(line), character: Math.trunc(character) };
}

function sanitizeRange(raw: unknown): LanguageServiceRange {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("desktop_ls: missing range");
  }
  const range = raw as Record<string, unknown>;
  return {
    start: sanitizePosition(range.start),
    end: sanitizePosition(range.end),
  };
}

function sanitizeRules(raw: unknown): Record<string, unknown> | undefined {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : undefined;
}

export function handleLanguageService(
  command: string,
  payload: Record<string, unknown>,
): unknown {
  assertProtocol(payload);
  if (command === "desktop_ls_capabilities") {
    return { markdown: true, protocolVersion: 1 };
  }
  const document = sanitizeVirtualDocument(payload.document);
  if (command === "desktop_ls_update_document") return null;
  if (command === "desktop_ls_diagnostics") {
    return markdownDiagnosticsForDocument(
      document,
      sanitizeRules(payload.rules),
    );
  }
  if (command === "desktop_ls_code_actions") {
    return markdownCodeActionsForDocument(
      document,
      sanitizeRange(payload.range),
      sanitizeRules(payload.rules),
    );
  }
  throw new Error(`Unhandled language-service command: ${command}`);
}
