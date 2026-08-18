import {
  getNativeDesktopBridge,
  getNativeDesktopCapability,
  hasNativeDesktopBridge,
  setNativeDesktopBridge,
  type NativeDesktopBridge,
} from "@lapis-notes/api";
import {
  createAgentRuntimeBridge,
  type AgentRuntimeBridge,
} from "@lapismd/ai-host/client";
import {
  createTerminalRuntimeBridge,
  type TerminalRuntimeBridge,
} from "@lapismd/terminal-host/client";

const TERMINAL_COMMANDS = new Set([
  "desktop_terminal_session_create",
  "desktop_terminal_session_list",
  "desktop_terminal_session_write",
  "desktop_terminal_session_resize",
  "desktop_terminal_session_stop",
  "terminal_session_create",
  "terminal_session_list",
  "terminal_session_write",
  "terminal_session_resize",
  "terminal_session_stop",
]);

type DisposableBridge = { dispose?(): void };

let agentBridge: (AgentRuntimeBridge & DisposableBridge) | null = null;
let terminalBridge: (TerminalRuntimeBridge & DisposableBridge) | null = null;

function toHostTerminalCommand(command: string): string {
  return command.startsWith("desktop_")
    ? command.replace("desktop_", "")
    : command;
}

function isOwnedCompose(): boolean {
  return agentBridge !== null || terminalBridge !== null;
}

function isProtectedDesktopBridge(): boolean {
  if (!hasNativeDesktopBridge()) return false;
  if (isOwnedCompose()) return false;
  const agent = getNativeDesktopCapability("agent-runtime");
  const terminal = getNativeDesktopCapability("terminal-runtime");
  if (agent?.provider === "lapis-ai-host") return false;
  if (terminal?.provider === "lapis-terminal-host") return false;
  return true;
}

function disposeForeign(existing: DisposableBridge | null): void {
  if (!existing || isOwnedCompose()) return;
  existing.dispose?.();
}

function publish(): void {
  if (!agentBridge && !terminalBridge) {
    setNativeDesktopBridge(null);
    return;
  }
  if (agentBridge && !terminalBridge) {
    setNativeDesktopBridge(agentBridge as NativeDesktopBridge);
    return;
  }
  if (!agentBridge && terminalBridge) {
    setNativeDesktopBridge({
      runtime: "electron-desktop",
      capabilities: terminalBridge.capabilities,
      invoke: (command, payload) =>
        terminalBridge!.invoke(toHostTerminalCommand(command), payload),
      toFileUrl: (path: string) => path,
      onTerminalOutput: terminalBridge.onTerminalOutput?.bind(terminalBridge),
      onTerminalExit: terminalBridge.onTerminalExit?.bind(terminalBridge),
    } as NativeDesktopBridge);
    return;
  }
  setNativeDesktopBridge({
    runtime: "electron-desktop",
    capabilities: {
      ...agentBridge!.capabilities,
      ...terminalBridge!.capabilities,
    },
    invoke(command, payload) {
      if (TERMINAL_COMMANDS.has(command)) {
        return terminalBridge!.invoke(toHostTerminalCommand(command), payload);
      }
      return agentBridge!.invoke(command, payload);
    },
    toFileUrl: agentBridge!.toFileUrl.bind(agentBridge),
    onAgentProcessMessage: agentBridge!.onAgentProcessMessage?.bind(agentBridge),
    onAgentRuntimeEvent: agentBridge!.onAgentRuntimeEvent?.bind(agentBridge),
    onAgentToolCall: agentBridge!.onAgentToolCall?.bind(agentBridge),
    onAgentToolCancel: agentBridge!.onAgentToolCancel?.bind(agentBridge),
    onTerminalOutput: terminalBridge!.onTerminalOutput?.bind(terminalBridge),
    onTerminalExit: terminalBridge!.onTerminalExit?.bind(terminalBridge),
  } as NativeDesktopBridge);
}

export function resetWebRuntimeCompose(): void {
  agentBridge?.dispose?.();
  terminalBridge?.dispose?.();
  agentBridge = null;
  terminalBridge = null;
}

export function setWebAgentRuntimeContribution(options: {
  url?: string;
  token?: string;
}): boolean {
  if (isProtectedDesktopBridge()) return false;
  const url = options.url?.trim() ?? "";
  const token = options.token?.trim() ?? "";
  const existing = getNativeDesktopBridge() as DisposableBridge | null;
  const hadAgent = agentBridge !== null;
  const foreignAi =
    !hadAgent &&
    Boolean(existing) &&
    getNativeDesktopCapability("agent-runtime")?.provider === "lapis-ai-host";
  if (agentBridge) {
    agentBridge.dispose?.();
    agentBridge = null;
  } else if (foreignAi) {
    disposeForeign(existing);
  }
  if (!url || !token) {
    if (hadAgent || foreignAi || terminalBridge) publish();
    return false;
  }
  agentBridge = createAgentRuntimeBridge({ url, token });
  publish();
  return true;
}

export function setWebTerminalRuntimeContribution(options: {
  url?: string;
  token?: string;
}): boolean {
  if (isProtectedDesktopBridge()) return false;
  const url = options.url?.trim() ?? "";
  const token = options.token?.trim() ?? "";
  const existing = getNativeDesktopBridge() as DisposableBridge | null;
  const hadTerminal = terminalBridge !== null;
  const foreignTerminal =
    !hadTerminal &&
    Boolean(existing) &&
    getNativeDesktopCapability("terminal-runtime")?.provider ===
      "lapis-terminal-host";
  if (terminalBridge) {
    terminalBridge.dispose?.();
    terminalBridge = null;
  } else if (foreignTerminal) {
    disposeForeign(existing);
  }
  if (!url || !token) {
    if (hadTerminal || foreignTerminal || agentBridge) publish();
    return false;
  }
  terminalBridge = createTerminalRuntimeBridge({ url, token });
  publish();
  return true;
}
