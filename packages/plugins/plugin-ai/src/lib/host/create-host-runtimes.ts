import { hasNativeDesktopCapability } from "@lapis-notes/api/desktop-native";
import type { AgentRuntime } from "../core/types";
import { AcpAgentRuntime } from "../runtimes/acp/acp-runtime";
import { DesktopAcpRuntimeBackend } from "../runtimes/acp/desktop-acp-backend";
import { CodexNativeRuntime } from "../runtimes/codex/codex-runtime";
import { createAgentProcessHost } from "./desktop-process-host";
import { hostLiveRuntimesEnabled } from "./host-runtime-availability";

export function createHostAgentRuntimes(): AgentRuntime[] {
  if (!hostLiveRuntimesEnabled(hasNativeDesktopCapability)) return [];
  return [
    new AcpAgentRuntime(new DesktopAcpRuntimeBackend()),
    new CodexNativeRuntime(createAgentProcessHost()),
  ];
}
