import {
  getNativeDesktopBridge,
  getNativeDesktopCapability,
  hasNativeDesktopBridge,
  setNativeDesktopBridge,
  type NativeDesktopBridge,
} from "@lapis-notes/api";
import {
  createAgentRuntimeBridge,
  maybeRegisterAgentRuntimeBridge,
} from "@lapismd/ai-host/client";

export function registerWebAgentRuntimeBridge(options?: {
  url?: string;
  token?: string;
}): boolean {
  const url = options?.url ?? import.meta.env.LAPIS_AGENT_RUNTIME_URL;
  const token = options?.token ?? import.meta.env.LAPIS_AGENT_RUNTIME_TOKEN;
  if (hasNativeDesktopBridge()) {
    const capability = getNativeDesktopCapability("agent-runtime");
    if (capability?.provider !== "lapis-ai-host") return false;
    const existing = getNativeDesktopBridge() as
      | (NativeDesktopBridge & { dispose?(): void })
      | null;
    if (!url?.trim() || !token?.trim()) {
      existing?.dispose?.();
      setNativeDesktopBridge(null);
      return false;
    }
    existing?.dispose?.();
    setNativeDesktopBridge(
      createAgentRuntimeBridge({
        url: url.trim(),
        token: token.trim(),
      }) as NativeDesktopBridge,
    );
    return true;
  }
  return maybeRegisterAgentRuntimeBridge({
    url,
    token,
    hasBridge: hasNativeDesktopBridge,
    register: (bridge) => setNativeDesktopBridge(bridge as NativeDesktopBridge),
  });
}
