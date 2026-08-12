import type {
  App,
  LanguageServiceCodeAction,
  LanguageServiceDiagnostic,
  LanguageServiceDiagnosticSeverity,
  LanguageServicePosition,
  LanguageServiceProvider,
} from "@lapis-notes/api";
import { DESKTOP_LANGUAGE_SERVICE_PROTOCOL_VERSION } from "./language-service-protocol";

const NATIVE_LS_PRIORITY = 100;
type Invoke = (
  command: string,
  payload?: Record<string, unknown>,
) => Promise<unknown>;

export async function probeElectronLanguageService(
  invoke: Invoke,
): Promise<boolean> {
  try {
    const result = (await invoke("desktop_ls_capabilities", {
      protocolVersion: DESKTOP_LANGUAGE_SERVICE_PROTOCOL_VERSION,
    })) as { markdown?: unknown };
    return result.markdown === true;
  } catch {
    return false;
  }
}

export async function registerElectronMarkdownLanguageServiceProvider(
  app: App,
  invoke: Invoke,
): Promise<(() => void) | null> {
  if (!(await probeElectronLanguageService(invoke))) return null;
  return app.languageServices.registerProvider(createProvider(invoke));
}

function createProvider(invoke: Invoke): LanguageServiceProvider {
  const payload = (body: Record<string, unknown>) => ({
    protocolVersion: DESKTOP_LANGUAGE_SERVICE_PROTOCOL_VERSION,
    ...body,
  });
  return {
    metadata: {
      id: "markdown-native-sidecar",
      languages: ["markdown"],
      runtime: "native",
      priority: NATIVE_LS_PRIORITY,
      capabilities: { diagnostics: true, codeActions: true },
    },
    async updateDocument(update) {
      await invoke(
        "desktop_ls_update_document",
        payload({ document: update.document }),
      );
    },
    async provideDiagnostics(context) {
      return deserializeDiagnostics(
        await invoke(
          "desktop_ls_diagnostics",
          payload({ document: context.document }),
        ),
      );
    },
    async provideCodeActions(context, range) {
      const actions = await invoke(
        "desktop_ls_code_actions",
        payload({ document: context.document, range }),
      );
      return Array.isArray(actions)
        ? (actions as LanguageServiceCodeAction[])
        : [];
    },
  };
}

function deserializeDiagnostics(raw: unknown): LanguageServiceDiagnostic[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): LanguageServiceDiagnostic[] => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    const range = record.range as Record<string, unknown> | undefined;
    if (!range || typeof record.message !== "string") return [];
    const start = mapPosition(range.start);
    const end = mapPosition(range.end);
    if (!start || !end) return [];
    return [
      {
        range: { start, end },
        message: record.message,
        severity: mapSeverity(record.severity),
        source: typeof record.source === "string" ? record.source : undefined,
        code:
          typeof record.code === "string" || typeof record.code === "number"
            ? record.code
            : undefined,
      },
    ];
  });
}

function mapPosition(raw: unknown): LanguageServicePosition | null {
  if (typeof raw !== "object" || raw === null) return null;
  const position = raw as Record<string, unknown>;
  return {
    line: Math.max(0, Number(position.line ?? 0)),
    character: Math.max(0, Number(position.character ?? 0)),
  };
}

function mapSeverity(raw: unknown): LanguageServiceDiagnosticSeverity {
  return raw === "error" ||
    raw === "information" ||
    raw === "hint" ||
    raw === "warning"
    ? raw
    : "warning";
}
