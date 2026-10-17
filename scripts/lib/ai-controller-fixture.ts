import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DenoAgentRuntimeHost } from "../../packages/desktop-deno/src-deno/agent-runtime";
import { createControllerConnectionBridge } from "./controller-connection-bridge";

/** Real smoke probes use the same separate-service boundary as the desktop. */
export async function startAiSmokeController(workspace: string) {
  const dataDirectory = await mkdtemp(path.join(tmpdir(), "lapis-ai-smoke-"));
  const host = new DenoAgentRuntimeHost({ dataDirectory });
  const close = async () => {
    await host.shutdown();
    await rm(dataDirectory, { recursive: true, force: true });
  };
  try {
    const connection = await host.handle("desktop_ai_controller_connection", {
      workspace,
    });
    return {
      ...connection,
      bridge: createControllerConnectionBridge(connection),
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
