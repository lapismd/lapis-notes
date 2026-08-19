import type {
  AgentEventSource,
  ApprovalRequest,
  UserInputRequest,
} from "../core/types";

export type AiChatApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "answered"
  | "cancelled";

export type AiChatItem = (
  | {
      id: string;
      type: "message";
      role: "user" | "assistant";
      text: string;
      createdAt?: string;
    }
  | {
      id: string;
      type: "thinking";
      text: string;
      kind?: "reasoning" | "summary" | "plan";
      state: "streaming" | "done";
      createdAt?: string;
    }
  | {
      id: string;
      type: "tool";
      toolId: string;
      name: string;
      server?: string;
      state: "running" | "completed" | "error";
      input?: string;
      output?: string;
      createdAt?: string;
    }
  | {
      id: string;
      type: "approval";
      request: ApprovalRequest;
      status: AiChatApprovalStatus;
      responseOptionId?: string;
      createdAt?: string;
    }
  | {
      id: string;
      type: "question";
      request: UserInputRequest;
      status: "pending" | "answered" | "cancelled";
      createdAt?: string;
    }
  | {
      id: string;
      type: "status";
      text: string;
      layout?: "report";
      createdAt?: string;
    }
  | { id: string; type: "error"; text: string; createdAt?: string }
  | {
      id: string;
      type: "command";
      command: string;
      origin: "app" | "extension" | "skill" | "native-agent";
      arguments?: string;
      status: "completed" | "failed" | "cancelled";
      text: string;
      createdAt?: string;
    }
  | {
      id: string;
      type: "skill-activation";
      skillId: string;
      skillName: string;
      version: string;
      origin: "user" | "model" | "app";
      arguments?: string;
      text: string;
      createdAt?: string;
    }
) & { agentBindingId?: string; source?: AgentEventSource };

export function createChatItemId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

export function isSlashCommandNotice(
  item: AiChatItem,
): item is Extract<AiChatItem, { type: "status" }> {
  return (
    item.type === "status" &&
    (item.layout === "report" || item.text.includes("\n"))
  );
}
