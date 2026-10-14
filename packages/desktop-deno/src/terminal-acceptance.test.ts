import { describe, expect, it } from "vitest";
import { collectTerminalAcceptance } from "./terminal-acceptance";

describe("installed native terminal acceptance", () => {
  it("requires output from the owned PTY and detaches after stopping it", async () => {
    let listener:
      | ((event: { sessionId: string; data: string }) => void)
      | undefined;
    const calls: string[] = [];
    let detached = false;
    const bridge = {
      onTerminalOutput(next: typeof listener) {
        listener = next;
        return () => {
          detached = true;
        };
      },
      async invoke(command: string) {
        calls.push(command);
        if (command.endsWith("_create")) return { sessionId: "owned" };
        if (command.endsWith("_write")) {
          listener?.({
            sessionId: "other",
            data: btoa("lapis-terminal-ready\n"),
          });
          listener?.({ sessionId: "owned", data: btoa("lapis-terminal-") });
          listener?.({ sessionId: "owned", data: btoa("ready\r\n") });
          return { ok: true };
        }
        return { ok: true };
      },
    };
    expect(await collectTerminalAcceptance(bridge as never, "/vault")).toBe(
      true,
    );
    expect(calls).toEqual([
      "desktop_terminal_session_create",
      "desktop_terminal_session_write",
      "desktop_terminal_session_stop",
    ]);
    expect(detached).toBe(true);
  });
  it("fails a rejected write and still closes the session and listener", async () => {
    const calls: string[] = [];
    let detached = false;
    const bridge = {
      onTerminalOutput() {
        return () => {
          detached = true;
        };
      },
      async invoke(command: string) {
        calls.push(command);
        return command.endsWith("_create")
          ? { sessionId: "owned" }
          : { ok: false };
      },
    };
    await expect(
      collectTerminalAcceptance(bridge as never, "/vault"),
    ).rejects.toThrow(/write/);
    expect(calls.at(-1)).toBe("desktop_terminal_session_stop");
    expect(detached).toBe(true);
  });
});
