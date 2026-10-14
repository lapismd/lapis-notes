import type { DenoDesktopBridge } from "./main";

/** Acceptance-only probe: verify the packaged PTY library can run a shell. */
export async function collectTerminalAcceptance(
  bridge: Pick<DenoDesktopBridge, "invoke" | "onTerminalOutput">,
  workspace: string,
): Promise<boolean> {
  if (!bridge.onTerminalOutput)
    throw new Error("Native terminal output is unavailable");
  let sessionId: string | undefined;
  let output = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ready: () => void = () => {};
  const stopListening = bridge.onTerminalOutput((event) => {
    if (event.sessionId !== sessionId) return;
    output += atob(event.data);
    if (output.includes("lapis-terminal-ready")) ready();
  });
  try {
    const created = await bridge.invoke<{ sessionId: string }>(
      "desktop_terminal_session_create",
      { workspace, shell: "/bin/sh", cols: 80, rows: 24 },
    );
    sessionId = created.sessionId;
    const completed = new Promise<void>((resolve, reject) => {
      ready = resolve;
      timer = setTimeout(
        () => reject(new Error("Native terminal acceptance timed out")),
        10_000,
      );
    });
    // Attach rejection handling before the write, which can fail before waiting.
    void completed.catch(() => undefined);
    const written = await bridge.invoke<{ ok: boolean }>(
      "desktop_terminal_session_write",
      { sessionId, data: btoa("printf 'lapis-%s\\n' terminal-ready\n") },
    );
    if (!written.ok) throw new Error("Native terminal acceptance write failed");
    await completed;
    return true;
  } finally {
    if (timer) clearTimeout(timer);
    stopListening();
    if (sessionId)
      await bridge.invoke("desktop_terminal_session_stop", { sessionId });
  }
}
