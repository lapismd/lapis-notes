export type ModelRef = {
  provider: string;
  model: string;
};

export type AiThinkingLevel = "off" | "low" | "medium" | "high";

export type ToolContribution = {
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  enabledTools?: string[];
};

export type AgentRequest = {
  prompt: string;
  workspace?: string;
  model?: ModelRef;
  thinking?: AiThinkingLevel;
  metadata?: Record<string, unknown>;
  tools?: ToolContribution[];
  restricted?: boolean;
  requireApprovals?: boolean;
  requirePolicyAmendments?: boolean;
};

export type ApprovalKind = "read" | "write" | "execute" | "network" | "other";

export type ApprovalOptionKind =
  | "allow-once"
  | "allow-always"
  | "deny-once"
  | "deny-always";

export type ApprovalOption = {
  id: string;
  label: string;
  kind: ApprovalOptionKind;
};

export type ApprovalRequest = {
  id: string;
  kind: ApprovalKind;
  title: string;
  tool?: {
    name: string;
    input?: unknown;
  };
  options: ApprovalOption[];
  metadata?: Record<string, unknown>;
};

export type ApprovalCapabilities = {
  supported: boolean;
  interactive: boolean;
  persistentDecisions: boolean;
  granularPermissions: boolean;
  policyAmendments: boolean;
};

export type AgentCapabilities = {
  sessions: boolean;
  resume: boolean;
  cancel: boolean;
  steer: boolean;
  modelSelection: boolean;
  nativeTools: boolean;
  mcpTools: boolean;
  approvals: ApprovalCapabilities;
};

export type AgentEvent =
  | { type: "text"; text: string }
  | {
      type: "thinking";
      text: string;
      kind?: "reasoning" | "summary" | "plan";
    }
  | {
      type: "tool.start";
      id: string;
      name: string;
      server?: string;
      input?: unknown;
    }
  | {
      type: "tool.end";
      id: string;
      name: string;
      server?: string;
      output?: unknown;
      error?: unknown;
    }
  | { type: "file.changed"; path: string }
  | { type: "command.start"; command: string }
  | { type: "command.end"; command: string; exitCode: number }
  | { type: "permission.request"; request: ApprovalRequest }
  | { type: "status"; status: string }
  | { type: "completed"; result?: unknown }
  | { type: "error"; error: Error };

export interface AgentSession {
  readonly id: string;
  events(): AsyncIterable<AgentEvent>;
  send(input: string): Promise<void>;
  respondToApproval(requestId: string, optionId: string): Promise<void>;
  cancel?(): Promise<void>;
  steer?(instruction: string): Promise<void>;
  close(): Promise<void>;
}

export interface AgentRuntime {
  readonly id: string;
  capabilities(): AgentCapabilities;
  supports(request: AgentRequest): Promise<boolean>;
  start(request: AgentRequest): Promise<AgentSession>;
  resume?(sessionId: string): Promise<AgentSession>;
}

export const DEFAULT_APPROVAL_OPTIONS: ApprovalOption[] = [
  { id: "allow-once", label: "Allow once", kind: "allow-once" },
  { id: "allow-always", label: "Allow always", kind: "allow-always" },
  { id: "deny-once", label: "Deny once", kind: "deny-once" },
  { id: "deny-always", label: "Deny always", kind: "deny-always" },
];

export const ACP_APPROVAL_CAPABILITIES: ApprovalCapabilities = {
  supported: true,
  interactive: true,
  persistentDecisions: true,
  granularPermissions: true,
  policyAmendments: false,
};

export const NATIVE_CODEX_APPROVAL_CAPABILITIES: ApprovalCapabilities = {
  supported: true,
  interactive: true,
  persistentDecisions: true,
  granularPermissions: true,
  policyAmendments: true,
};

export const UNAVAILABLE_APPROVAL_CAPABILITIES: ApprovalCapabilities = {
  supported: false,
  interactive: false,
  persistentDecisions: false,
  granularPermissions: false,
  policyAmendments: false,
};
