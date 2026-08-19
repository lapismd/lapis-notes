import { describe, expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import {
  FILE_EXPLORER_REVEAL_PATH_COMMAND,
  revealConversationScope,
} from "./reveal-scope";

function fakeApp(executeCommand: App["commands"]["executeCommand"]): App {
  return {
    commands: { executeCommand },
  } as App;
}

describe("revealConversationScope", () => {
  it("reveals a stored folder through the public Explorer command", async () => {
    const executeCommand = vi.fn().mockResolvedValue(undefined);
    revealConversationScope(fakeApp(executeCommand), "Projects/Atlas");
    await vi.waitFor(() => {
      expect(executeCommand).toHaveBeenCalledWith(
        FILE_EXPLORER_REVEAL_PATH_COMMAND,
        "Projects/Atlas",
      );
    });
  });

  it("uses a root marker for vault-root chats and ignores a missing command", async () => {
    const executeCommand = vi
      .fn()
      .mockRejectedValue(new Error("Command unavailable"));
    revealConversationScope(fakeApp(executeCommand), "");
    await vi.waitFor(() => {
      expect(executeCommand).toHaveBeenCalledWith(
        FILE_EXPLORER_REVEAL_PATH_COMMAND,
        "/",
      );
    });
  });
});
