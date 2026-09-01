import { afterEach, describe, expect, it, vi } from "vitest";

import type { ServerVaultProfile } from "@lapis-notes/api/server-host";

import {
  ServerVaultAdapter,
  type LapisServerBrowserClient,
} from "./browser.ts";

const profile: ServerVaultProfile = {
  id: "5b6ca180-f54b-4e31-a39d-ce85ebf13387",
  name: "Browser vault",
  kind: "server-hosted",
  role: "owner",
  archived: false,
  createdAt: 0,
  updatedAt: 0,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ServerVaultAdapter browser transport", () => {
  it("invokes the default fetch with its global receiver", async () => {
    const browserFetch = vi.fn(function (this: unknown) {
      if (this !== globalThis) throw new TypeError("Illegal invocation");
      return Promise.resolve(new Response("# Browser-safe fetch\n"));
    });
    vi.stubGlobal("fetch", browserFetch);
    const adapter = new ServerVaultAdapter({
      client: {} as LapisServerBrowserClient,
      profile,
      csrfToken: () => undefined,
    });

    await expect(adapter.read("Note.md")).resolves.toBe(
      "# Browser-safe fetch\n",
    );
    expect(browserFetch).toHaveBeenCalledOnce();
  });
});
