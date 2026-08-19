import {
  isGenericToolName,
  toolNameFromInput,
} from "../chat/chat-tool-identity";
import type {
  ConversationApprovalDecision,
  ConversationApprovalGrant,
} from "./types";

export const MAX_CONVERSATION_APPROVAL_GRANTS = 64;

const LAPIS_TOOLS_PREFIX = /^lapis-tools[-_]/iu;

export function persistentDecisionFromOption(
  optionId: string,
): ConversationApprovalDecision | undefined {
  const normalized = optionId.trim().toLowerCase().replaceAll("_", "-");
  if (normalized === "allow-always" || normalized === "deny-always") {
    return normalized;
  }
  return undefined;
}

export function canonicalizeApprovalToolName(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  let name = value.trim().replace(/^allow\s+/iu, "").replace(/\?+$/u, "").trim();
  if (!name || isGenericToolName(name)) return undefined;
  const colonParts = name
    .split(":")
    .map((part) => part.trim())
    .filter(Boolean);
  if (colonParts.length >= 2) {
    const last = colonParts[colonParts.length - 1];
    if (!last || isGenericToolName(last)) return undefined;
    name = last;
  }
  name = name.replace(LAPIS_TOOLS_PREFIX, "").trim().toLowerCase();
  if (!name || isGenericToolName(name)) return undefined;
  return name;
}

export function approvalGrantIdentity(request: {
  title?: string;
  tool?: { name?: string; input?: unknown };
}): string | undefined {
  for (const candidate of [
    toolNameFromInput(request.tool?.input),
    request.tool?.name,
    request.title,
  ]) {
    const name = canonicalizeApprovalToolName(candidate);
    if (name) return name;
  }
  return undefined;
}

export function upsertApprovalGrant(
  grants: ConversationApprovalGrant[],
  name: string,
  decision: ConversationApprovalDecision,
): ConversationApprovalGrant[] {
  const next = grants.filter((grant) => grant.name !== name);
  next.push({ name, decision });
  return next.length > MAX_CONVERSATION_APPROVAL_GRANTS
    ? next.slice(next.length - MAX_CONVERSATION_APPROVAL_GRANTS)
    : next;
}

export function persistentDecisionForRequest(
  grants: ConversationApprovalGrant[],
  request: { title?: string; tool?: { name?: string; input?: unknown } },
): ConversationApprovalDecision | undefined {
  const name = approvalGrantIdentity(request);
  if (!name) return undefined;
  return grants.find((grant) => grant.name === name)?.decision;
}

export function normalizeApprovalGrants(
  value: unknown,
): ConversationApprovalGrant[] {
  if (!Array.isArray(value)) return [];
  const seen = new Map<string, ConversationApprovalDecision>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as { name?: unknown; decision?: unknown };
    const name = canonicalizeApprovalToolName(
      typeof record.name === "string" ? record.name : undefined,
    );
    if (
      !name ||
      (record.decision !== "allow-always" && record.decision !== "deny-always")
    ) {
      continue;
    }
    seen.set(name, record.decision);
  }
  return [...seen.entries()]
    .map(([name, decision]) => ({ name, decision }))
    .slice(-MAX_CONVERSATION_APPROVAL_GRANTS);
}
