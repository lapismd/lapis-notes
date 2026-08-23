import { describe, expect, it, vi } from "vitest";
import { NativeDesktopTursoAppDatabase } from "../storage/desktop-app-database";
import type { NativeDesktopBridge } from "../storage/desktop-native";

describe("NativeDesktopTursoAppDatabase", () => {
  it("relays native change events and resets after a renderer revision gap", async () => {
    let emit: ((event: any) => void) | undefined;
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
        : undefined,
    );
    const database = new NativeDesktopTursoAppDatabase("vault", {
      invoke,
      onAppDatabaseChange(listener: (event: any) => void) {
        emit = listener;
        return () => undefined;
      },
    } as unknown as NativeDesktopBridge);
    await database.open();
    const changes: any[] = [];
    database.subscribeToChanges((change) => changes.push(change));

    emit?.({
      vaultId: "vault",
      change: {
        revision: 1,
        domains: ["metadata"],
        paths: ["one.md"],
        committedAt: 1,
      },
    });
    emit?.({
      vaultId: "vault",
      change: {
        revision: 3,
        domains: ["metadata"],
        paths: ["three.md"],
        committedAt: 3,
      },
    });

    expect(changes).toMatchObject([
      { revision: 1, paths: ["one.md"] },
      { revision: 3, reset: true, paths: [] },
    ]);
  });

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
