export type LanguageServiceRuntime = "worker" | "native" | "lsp" | "in-process";

export interface LanguageServicePosition {
  line: number;
  character: number;
}

export interface LanguageServiceRange {
  start: LanguageServicePosition;
  end: LanguageServicePosition;
}

export interface VirtualDocument {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export interface VirtualDocumentUpdate {
  document: VirtualDocument;
}

export type LanguageServiceDiagnosticSeverity =
  | "error"
  | "warning"
  | "information"
  | "hint";

export interface LanguageServiceDiagnostic {
  range: LanguageServiceRange;
  message: string;
  severity: LanguageServiceDiagnosticSeverity;
  source?: string;
  code?: string | number;
}

export type LanguageServiceCompletionKind =
  | "text"
  | "method"
  | "function"
  | "constructor"
  | "field"
  | "variable"
  | "class"
  | "interface"
  | "module"
  | "property"
  | "unit"
  | "value"
  | "enum"
  | "keyword"
  | "snippet"
  | "file"
  | "reference";

export interface LanguageServiceCompletionItem {
  label: string;
  detail?: string;
  documentation?: string;
  kind?: LanguageServiceCompletionKind;
  apply?: string;
}

export interface LanguageServiceCompletionList {
  from?: LanguageServicePosition;
  to?: LanguageServicePosition;
  items: LanguageServiceCompletionItem[];
}

export interface LanguageServiceHover {
  range?: LanguageServiceRange;
  contents: string;
}

export interface LanguageServiceLocation {
  uri: string;
  range: LanguageServiceRange;
}

export interface LanguageServiceCodeActionCommand {
  id: string;
  arguments?: unknown[];
}

export interface LanguageServiceCodeAction {
  title: string;
  kind?: string;
  diagnostics?: LanguageServiceDiagnostic[];
  edit?: unknown;
  command?: LanguageServiceCodeActionCommand;
}

export interface LanguageServiceProviderCapabilities {
  diagnostics?: boolean;
  completion?: boolean;
  hover?: boolean;
  definition?: boolean;
  codeActions?: boolean;
}

export interface LanguageServiceProviderMetadata {
  id: string;
  languages: string[];
  runtime: LanguageServiceRuntime;
  priority?: number;
  capabilities: LanguageServiceProviderCapabilities;
}

export interface LanguageServiceGlobalDeclaration {
  uri: string;
  text: string;
  version?: number;
}

export interface LanguageServiceRequestContext {
  document: VirtualDocument;
  globals: LanguageServiceGlobalDeclaration[];
}

export interface LanguageServiceProvider {
  metadata: LanguageServiceProviderMetadata;
  updateDocument?(update: VirtualDocumentUpdate): Promise<void> | void;
  provideDiagnostics?(
    context: LanguageServiceRequestContext,
  ): Promise<LanguageServiceDiagnostic[]>;
  provideCompletions?(
    context: LanguageServiceRequestContext,
    position: LanguageServicePosition,
  ): Promise<LanguageServiceCompletionList | null>;
  provideHover?(
    context: LanguageServiceRequestContext,
    position: LanguageServicePosition,
  ): Promise<LanguageServiceHover | null>;
  provideDefinition?(
    context: LanguageServiceRequestContext,
    position: LanguageServicePosition,
  ): Promise<LanguageServiceLocation[]>;
  provideCodeActions?(
    context: LanguageServiceRequestContext,
    range: LanguageServiceRange,
  ): Promise<LanguageServiceCodeAction[]>;
  applyCommand?(
    context: LanguageServiceRequestContext,
    command: LanguageServiceCodeActionCommand,
  ): Promise<void> | void;
  dispose?(): Promise<void> | void;
}
