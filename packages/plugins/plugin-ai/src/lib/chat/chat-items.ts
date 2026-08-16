import type { ApprovalRequest, UserInputRequest } from "../core/types";

export type AiChatApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "answered"
  | "cancelled";

export type AiChatItem =
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
  | { id: string; type: "status"; text: string; createdAt?: string }
  | { id: string; type: "error"; text: string; createdAt?: string };

export function createChatItemId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}
