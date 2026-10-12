import { describe, expect, it, vi } from "vitest";

import { REMOTE_APP_DATABASE_METHODS } from "@lapis-notes/api/app-database";

import type { ServerContext } from "./context.ts";
import { appRouter, remoteDatabaseMethodsForDomain } from "./router.ts";

function context(
  role: "owner" | "editor" | "viewer" = "viewer",
): ServerContext {
  return {
    config: {
      dataRoot: "/data",
      staticRoot: "/static",
      hostname: "127.0.0.1",
      port: 8787,
      origin: "https://lapis.example",
      secureCookie: true,
      trustForwardedHeaders: false,
      buildId: "test-build",
    },
    request: new Request("https://lapis.example/api/trpc", {
      method: "POST",
      headers: {
        origin: "https://lapis.example",
        "x-lapis-csrf": "csrf",
      },
    }),
    responseHeaders: new Headers(),
    session: {
      id: "session",
      userId: "user",
      username: "user",
      csrfToken: "csrf",
      createdAt: 1,
      lastSeenAt: 1,
      expiresAt: Number.MAX_SAFE_INTEGER,
    },
    control: {
      membership: vi.fn(async () => role),
    } as never,
    store: {
      mkdir: vi.fn(),
    } as never,
    runtimes: {
      invoke: vi.fn(),
    } as never,
    events: {} as never,
  };
}

describe("server tRPC router", () => {
  it("exposes protocol and explicit remote capabilities without a session", async () => {
    const ctx = context();
    delete ctx.session;
    const info = await appRouter.createCaller(ctx).system.info();
    expect(info).toMatchObject({
      buildId: "test-build",
      protocolMajor: 1,
      capabilities: { ai: false, terminal: false, appDatabase: true },
    });
  });

  it("enforces viewer membership on filesystem mutations", async () => {
    const ctx = context("viewer");
    await expect(
      appRouter.createCaller(ctx).filesystem.mkdir({
        vaultId: "123e4567-e89b-42d3-a456-426614174000",
        path: "Folder",
        recursive: false,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(ctx.store.mkdir).not.toHaveBeenCalled();
  });

  it("generates one database procedure for every shared contract method", () => {
    const procedures = [
      "lifecycle",
      "metadata",
      "search",
      "history",
      "notifications",
      "memory",
      "tasks",
      "projections",
    ].flatMap(remoteDatabaseMethodsForDomain);
    expect(procedures.sort()).toEqual([...REMOTE_APP_DATABASE_METHODS].sort());
  });
});
