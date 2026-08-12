import type {
  LanguageServiceCodeAction,
  LanguageServiceDiagnostic,
  LanguageServiceRange,
  VirtualDocument,
} from "@lapis-notes/api/language-service";
import { registerLanguageServiceWorker } from "./protocol";
import { installWorkerEntityDecoderDocumentShim } from "./worker-entity-decoder";

installWorkerEntityDecoderDocumentShim();

const markdownlintRuntime = import("../markdownlint/runtime");

const documents = new Map<string, VirtualDocument>();

registerLanguageServiceWorker({
  "document/update"(request) {
    documents.set(request.document.uri, request.document);
    return { type: "document/update", ok: true };
  },
  async diagnostics(request) {
    documents.set(request.document.uri, request.document);
    return {
      type: "diagnostics",
      diagnostics: await lintMarkdown(request.document, request.rules),
    };
  },
  async "code-actions"(request) {
    documents.set(request.document.uri, request.document);
    return {
      type: "code-actions",
      actions: await codeActionsForMarkdown(
        request.document,
        request.range,
        request.rules,
      ),
    };
  },
});

async function lintMarkdown(
  document: VirtualDocument,
  rules?: Record<string, unknown>,
): Promise<LanguageServiceDiagnostic[]> {
  const { markdownDiagnosticsForDocument } = await markdownlintRuntime;
  return markdownDiagnosticsForDocument(document, rules);
}

async function codeActionsForMarkdown(
  document: VirtualDocument,
  requestedRange: LanguageServiceRange,
  rules?: Record<string, unknown>,
): Promise<LanguageServiceCodeAction[]> {
  const { markdownCodeActionsForDocument } = await markdownlintRuntime;
  return markdownCodeActionsForDocument(document, requestedRange, rules);
}
