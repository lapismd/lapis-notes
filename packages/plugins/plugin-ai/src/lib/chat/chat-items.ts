import type { ApprovalRequest } from "../core/types";

export type AiChatApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "answered"
  | "cancelled";

export type AiChatItem =
  | { id: string; type: "message"; role: "user" | "assistant"; text: string }
  | {
      id: string;
      type: "thinking";
      text: string;
      kind?: "reasoning" | "summary" | "plan";
      state: "streaming" | "done";
    }
  | {
      id: string;
      type: "tool";
      toolId: string;
      name: string;
      server?: string;
      state: "running" | "completed" | "error";
      output?: string;
    }
  | {
      id: string;
      type: "approval";
      request: ApprovalRequest;
      status: AiChatApprovalStatus;
      responseOptionId?: string;
    }
  | { id: string; type: "status"; text: string }
  | { id: string; type: "error"; text: string };

export function createChatItemId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}
