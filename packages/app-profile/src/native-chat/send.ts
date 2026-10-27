import type { AgentAction } from "@lapismd/agent-ui/core";
import type { TurnTarget } from "@lapis-notes/api/native-turns";
import type { NativeChatSession } from "./session";

export function refused(error: unknown) {
  const code = (error as { code?: string }).code;
  return [
    "INVALID_REQUEST",
    "UNSUPPORTED",
    "BUSY",
    "PERMISSION_DENIED",
    "EINVAL",
    "ENOTSUP",
    "EBUSY",
    "EACCES",
  ].includes(code ?? "")
    ? {
        status: "refused" as const,
        reason:
          error instanceof Error
            ? error.message
            : "The native request was refused",
      }
    : { status: "unknown" as const };
}
export async function nativeSendTarget(
  session: NativeChatSession,
  action: AgentAction,
  fallback: string,
): Promise<TurnTarget> {
  const submission = action.submission,
    recipients = action.recipients ?? [fallback];
  if (
    !submission?.text.trim() ||
    submission.id !== action.id ||
    submission.comments.length ||
    action.attachments?.length ||
    recipients.length !== 1 ||
    !recipients[0]
  )
    throw Object.assign(
      new Error(
        "Native chat currently accepts one authored text prompt for one agent",
      ),
      { code: "UNSUPPORTED" },
    );
  const targets = await session.call({ kind: "targets" }).catch(() => null);
  const target =
    targets?.kind === "targets"
      ? targets.targets.find((row) => row.id === recipients[0])
      : undefined;
  const mode = target?.default_mode;
  if (
    typeof mode !== "string" ||
    !mode.length ||
    mode.trim() !== mode ||
    new TextEncoder().encode(mode).length > 256 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(mode)
  )
    throw Object.assign(
      new Error("The native agent's declared mode is unavailable"),
      { code: "UNSUPPORTED" },
    );
  return target!;
}
