import type {
  LanguageServiceCodeAction,
  LanguageServiceCompletionList,
  LanguageServiceDiagnostic,
  LanguageServiceGlobalDeclaration,
  LanguageServiceHover,
  LanguageServiceLocation,
  LanguageServicePosition,
  LanguageServiceRange,
  VirtualDocument,
} from "./types";

export type LanguageServiceWorkerRequest =
  | {
      type: "document/update";
      document: VirtualDocument;
      globals?: LanguageServiceGlobalDeclaration[];
    }
  | {
      type: "diagnostics";
      document: VirtualDocument;
      globals?: LanguageServiceGlobalDeclaration[];
      rules?: Record<string, unknown>;
    }
  | {
      type: "completion";
      document: VirtualDocument;
      position: LanguageServicePosition;
      globals?: LanguageServiceGlobalDeclaration[];
    }
  | {
      type: "hover";
      document: VirtualDocument;
      position: LanguageServicePosition;
      globals?: LanguageServiceGlobalDeclaration[];
    }
  | {
      type: "definition";
      document: VirtualDocument;
      position: LanguageServicePosition;
      globals?: LanguageServiceGlobalDeclaration[];
    }
  | {
      type: "code-actions";
      document: VirtualDocument;
      range: LanguageServiceRange;
      globals?: LanguageServiceGlobalDeclaration[];
      rules?: Record<string, unknown>;
    };

export type LanguageServiceWorkerResponse =
  | { type: "document/update"; ok: true }
  | { type: "diagnostics"; diagnostics: LanguageServiceDiagnostic[] }
  | { type: "completion"; completions: LanguageServiceCompletionList | null }
  | { type: "hover"; hover: LanguageServiceHover | null }
  | { type: "definition"; locations: LanguageServiceLocation[] }
  | { type: "code-actions"; actions: LanguageServiceCodeAction[] };

export interface LanguageServiceWorkerEnvelope<T> {
  id: string;
  payload: T;
}

export type LanguageServiceWorkerMessage =
  LanguageServiceWorkerEnvelope<LanguageServiceWorkerRequest>;

export type LanguageServiceWorkerResult =
  | (LanguageServiceWorkerEnvelope<LanguageServiceWorkerResponse> & {
      ok: true;
    })
  | {
      id: string;
      ok: false;
      error: string;
    };
