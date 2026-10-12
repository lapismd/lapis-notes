import { describe, expect, it, vi } from "vitest";

import type { ControlSession } from "./control-database.ts";
import type { ServerServices } from "./context.ts";
import { handlePluginBundleDownloadRoute } from "./direct-routes.ts";

const session: ControlSession = {
  id: "session-1",
  userId: "user-1",
  username: "owner",
  csrfToken: "csrf-token",
  createdAt: 0,
  lastSeenAt: 0,
  expiresAt: Number.MAX_SAFE_INTEGER,
};

function services(role: "owner" | "editor" | "viewer" = "owner") {
  return {
    control: { membership: vi.fn(async () => role) },
  } as unknown as ServerServices;
}

describe("hosted plugin bundle downloads", () => {
  it("streams a bounded official release through an editor-authorized route", async () => {
    const source =
      "https://github.com/lapismd/lapis-plugins/releases/download/wordcount%400.1.1/wordcount-0.1.1.lapis-plugin";
    const upstream = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "Content-Length": "3" },
        }),
    );
    const request = new Request(
      `https://notes.example.test/api/vaults/vault-1/plugin-bundles/download?source=${encodeURIComponent(source)}`,
    );

    const response = await handlePluginBundleDownloadRoute(
      request,
      services("editor"),
      session,
      upstream as typeof fetch,
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get("cache-control")).toBe("private, no-store");
    expect(new Uint8Array(await response!.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(upstream).toHaveBeenCalledWith(
      source,
      expect.objectContaining({
        method: "GET",
        redirect: "follow",
        headers: { Accept: "application/octet-stream" },
      }),
    );
  });

  it("rejects arbitrary outbound sources and viewer downloads", async () => {
    const unsafe = new Request(
      "https://notes.example.test/api/vaults/vault-1/plugin-bundles/download?source=https%3A%2F%2Fexample.test%2Fbundle.lapis-plugin",
    );
    await expect(
      handlePluginBundleDownloadRoute(unsafe, services(), session),
    ).rejects.toThrow("not permitted");

    const official = new Request(
      "https://notes.example.test/api/vaults/vault-1/plugin-bundles/download?source=https%3A%2F%2Fgithub.com%2Flapismd%2Flapis-plugins%2Freleases%2Fdownload%2Fwordcount%25400.1.1%2Fwordcount-0.1.1.lapis-plugin",
    );
    await expect(
      handlePluginBundleDownloadRoute(official, services("viewer"), session),
    ).rejects.toThrow("Vault access denied");
  });
});
