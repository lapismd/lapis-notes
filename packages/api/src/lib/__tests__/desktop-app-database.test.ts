import { describe, expect, it, vi } from "vitest";
import { NativeDesktopTursoAppDatabase } from "../storage/desktop-app-database";
import type { NativeDesktopBridge } from "../storage/desktop-native";

describe("NativeDesktopTursoAppDatabase", () => {
  it("forwards source-provider allowlists through bounded desktop RPC", async () => {
    const invoke = vi.fn(async (channel: string) =>
      channel === "desktop_db_open"
        ? {
            providerId: "test",
            engine: "turso",
            transport: "native",
            role: "direct",
            storageMode: "local",
            capabilities: {},
          }
        : [],
    );
    const database = new NativeDesktopTursoAppDatabase("vault", {
      invoke,
    } as unknown as NativeDesktopBridge);
    await database.open();

    await database.searchDocuments("parser", {
      sourceProviderIds: ["ai-conversations"],
      pathPrefix: "Projects/Alpha",
    });

    expect(invoke).toHaveBeenLastCalledWith("desktop_db_call", {
      vaultId: "vault",
      method: "searchDocuments",
      args: [
        "parser",
        {
          sourceProviderIds: ["ai-conversations"],
          pathPrefix: "Projects/Alpha",
        },
      ],
    });
  });
});
