import {
  markdownCodeActionsForDocument,
  markdownDiagnosticsForDocument,
} from "@lapis-notes/language-service/markdownlint/runtime";
import type {
  LanguageServiceRange,
  VirtualDocument,
} from "@lapis-notes/api";

type SidecarRequest = {
  id?: string;
  type?: string;
  payload?: Record<string, unknown>;
};

const documents = new Map<string, VirtualDocument>();
let queue = Promise.resolve();

process.on("message", (message) => {
  queue = queue.then(() => handleMessage(message)).catch((error) => {
    sendError(undefined, error);
  });
});

process.once("SIGTERM", () => process.exit(0));
process.once("SIGINT", () => process.exit(0));
send({ type: "ready" });

async function handleMessage(message: unknown): Promise<void> {
  if (!isRequest(message) || !message.id) return;

  try {
    const document =
      message.type === "shutdown"
        ? null
        : readDocument(message.payload?.document);
    switch (message.type) {
      case "document-update":
        documents.set(document!.uri, document!);
        send({ type: "response", id: message.id, result: null });
        return;
      case "diagnostics":
        documents.set(document!.uri, document!);
        send({
          type: "response",
          id: message.id,
          result: markdownDiagnosticsForDocument(document!),
        });
        return;
      case "code-actions":
        documents.set(document!.uri, document!);
        send({
          type: "response",
          id: message.id,
          result: markdownCodeActionsForDocument(
            document!,
            readRange(message.payload?.range),
          ),
        });
        return;
      case "shutdown":
        send({ type: "response", id: message.id, result: null });
        process.exit(0);
        return;
      default:
        throw new Error(`Unsupported Markdown sidecar request: ${message.type}`);
    }
  } catch (error) {
    sendError(message.id, error);
  }
}

function readDocument(raw: unknown): VirtualDocument {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("language-service: missing document");
  }
  const record = raw as Record<string, unknown>;
  const document: VirtualDocument = {
    uri: String(record.uri ?? ""),
    languageId: String(record.languageId ?? ""),
    version: Number(record.version ?? 0),
    text: String(record.text ?? ""),
  };
  if (!document.uri || document.languageId !== "markdown") {
    throw new Error("language-service: only Markdown documents are supported");
  }
  return document;
}

function readRange(raw: unknown): LanguageServiceRange {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("language-service: missing range");
  }
  const record = raw as Record<string, unknown>;
  return { start: readPosition(record.start), end: readPosition(record.end) };
}

function readPosition(raw: unknown): { line: number; character: number } {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("language-service: missing position");
  }
  const record = raw as Record<string, unknown>;
  return {
    line: Math.max(0, Number(record.line ?? 0)),
    character: Math.max(0, Number(record.character ?? 0)),
  };
}

function isRequest(message: unknown): message is SidecarRequest {
  return typeof message === "object" && message !== null;
}

function send(message: Record<string, unknown>): void {
  process.send?.(message);
}

function sendError(id: string | undefined, error: unknown): void {
  send({
    type: "error",
    id,
    error: error instanceof Error ? error.message : String(error),
  });
}
