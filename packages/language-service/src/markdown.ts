import {
  type LanguageServiceCodeAction,
  type LanguageServiceDiagnostic,
  type LanguageServiceGlobalDeclaration,
  type LanguageServiceProvider,
} from "@lapis-notes/api/language-service";
import { LanguageServiceWorkerClient } from "@lapis-notes/api/language-service/worker";

const DESKTOP_LANGUAGE_SERVICE_PROTOCOL_VERSION = 1 as const;

export interface MarkdownLanguageServiceProviderOptions {
  rules?: Record<string, unknown>;
  getRules?: () => Record<string, unknown> | undefined;
}

function resolveMarkdownRules(
  options: MarkdownLanguageServiceProviderOptions,
): Record<string, unknown> | undefined {
  return options.getRules?.() ?? options.rules;
}

export function createMarkdownLanguageServiceProvider(
  options: MarkdownLanguageServiceProviderOptions = {},
): LanguageServiceProvider {
  const client = new LanguageServiceWorkerClient(
    new Worker(new URL("./workers/markdownlint.worker.js", import.meta.url), {
      type: "module",
    }),
  );
  return {
    metadata: {
      id: "markdownlint-worker",
      languages: ["markdown"],
      runtime: "worker",
      priority: 0,
      capabilities: { diagnostics: true, codeActions: true },
    },
    async updateDocument(update) {
      await client.request({
        type: "document/update",
        document: update.document,
      });
    },
    async provideDiagnostics(context) {
      const response = await client.request({
        type: "diagnostics",
        document: context.document,
        globals: context.globals as LanguageServiceGlobalDeclaration[],
        rules: resolveMarkdownRules(options),
      });
      if (response.type !== "diagnostics") return [];
      return response.diagnostics.map(
        (diagnostic): LanguageServiceDiagnostic => ({
          ...diagnostic,
          source: diagnostic.source ?? "markdownlint",
        }),
      );
    },
    async provideCodeActions(context, range) {
      const response = await client.request({
        type: "code-actions",
        document: context.document,
        range,
        globals: context.globals as LanguageServiceGlobalDeclaration[],
        rules: resolveMarkdownRules(options),
      });
      if (response.type !== "code-actions") {
        return [];
      }
      return response.actions as LanguageServiceCodeAction[];
    },
    dispose() {
      client.dispose();
    },
  };
}

export function createNativeMarkdownLanguageServiceProvider(
  invoke: (
    command: string,
    payload?: Record<string, unknown>,
  ) => Promise<unknown>,
  options: MarkdownLanguageServiceProviderOptions = {},
): LanguageServiceProvider {
  return {
    metadata: {
      id: "markdownlint-native-sidecar",
      languages: ["markdown"],
      runtime: "native",
      priority: 100,
      capabilities: { diagnostics: true, codeActions: true },
    },
    async updateDocument(update) {
      await invoke("desktop_ls_update_document", {
        protocolVersion: DESKTOP_LANGUAGE_SERVICE_PROTOCOL_VERSION,
        document: update.document,
        globals: [],
      });
    },
    async provideDiagnostics(context) {
      const raw = await invoke("desktop_ls_diagnostics", {
        protocolVersion: DESKTOP_LANGUAGE_SERVICE_PROTOCOL_VERSION,
        document: context.document,
        rules: resolveMarkdownRules(options),
        globals: context.globals.map((declaration) => ({
          uri: declaration.uri,
          text: declaration.text,
          version: declaration.version,
        })),
      });
      if (!Array.isArray(raw)) {
        return [];
      }
      return raw as LanguageServiceDiagnostic[];
    },
    async provideCodeActions(context, range) {
      const raw = await invoke("desktop_ls_code_actions", {
        protocolVersion: DESKTOP_LANGUAGE_SERVICE_PROTOCOL_VERSION,
        document: context.document,
        range,
        rules: resolveMarkdownRules(options),
        globals: context.globals.map((declaration) => ({
          uri: declaration.uri,
          text: declaration.text,
          version: declaration.version,
        })),
      });
      if (!Array.isArray(raw)) {
        return [];
      }
      return raw as LanguageServiceCodeAction[];
    },
    dispose() {
      //
    },
  };
}

export async function probeNativeMarkdownLanguageService(
  invoke: (
    command: string,
    payload?: Record<string, unknown>,
  ) => Promise<unknown>,
): Promise<boolean> {
  try {
    await invoke("desktop_ls_capabilities", {
      protocolVersion: DESKTOP_LANGUAGE_SERVICE_PROTOCOL_VERSION,
    });
    return true;
  } catch {
    return false;
  }
}
