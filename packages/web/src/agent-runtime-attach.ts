import {
  hasNativeDesktopBridge,
  setNativeDesktopBridge,
  type NativeDesktopBridge,
} from "@lapis-notes/api";
import { maybeRegisterAgentRuntimeBridge } from "@lapis-notes/ai-host/client";

export function registerWebAgentRuntimeBridge(): boolean {
  return maybeRegisterAgentRuntimeBridge({
    url: import.meta.env.LAPIS_AGENT_RUNTIME_URL,
    token: import.meta.env.LAPIS_AGENT_RUNTIME_TOKEN,
    hasBridge: hasNativeDesktopBridge,
    register: (bridge) => setNativeDesktopBridge(bridge as NativeDesktopBridge),
  });
}
