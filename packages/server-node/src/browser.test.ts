import { afterEach, describe, expect, it, vi } from "vitest";

import type { ServerVaultProfile } from "@lapis-notes/api/server-host";

import {
  ServerAppDatabaseProvider,
  ServerVaultAdapter,
  ServerVaultEventStream,
  createServerPluginDistributionFetch,
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

  it("maps virtual-root vault paths to managed relative server paths", async () => {
    const stat = vi.fn(async () => null);
    const list = vi.fn(async () => ({ files: [], folders: [] }));
    const mkdir = vi.fn(async () => ({ ok: true as const }));
    const remove = vi.fn(async () => ({ ok: true as const }));
    const rename = vi.fn(async () => ({ ok: true as const }));
    const copy = vi.fn(async () => ({ ok: true as const }));
    const trash = vi.fn(async () => ({ path: ".trash/plugin.json" }));
    const client = {
      filesystem: {
        stat: { query: stat },
        list: { query: list },
        mkdir: { mutate: mkdir },
        remove: { mutate: remove },
        rename: { mutate: rename },
        copy: { mutate: copy },
        trash: { mutate: trash },
      },
    } as unknown as LapisServerBrowserClient;
    const adapter = new ServerVaultAdapter({
      client,
      profile,
      csrfToken: () => undefined,
    });

    await adapter.stat("/.lapis/core-plugins.json");
    await adapter.list("/.lapis/plugins/");
    await adapter.mkdir("/.lapis/plugins/lapis-word-count", {
      recursive: true,
    });
    await adapter.remove("/.lapis/plugins/old.json");
    await adapter.rmdir("/.lapis/plugins/old", true);
    await adapter.rename("/Draft.md", "/Notes/Draft.md");
    await adapter.copy("/Notes/Draft.md", "/Notes/Copy.md");
    await adapter.trashLocal("/Notes/Copy.md");

    expect(stat).toHaveBeenCalledWith({
      vaultId: profile.id,
      path: ".lapis/core-plugins.json",
    });
    expect(list).toHaveBeenCalledWith({
      vaultId: profile.id,
      path: ".lapis/plugins",
    });
    expect(mkdir).toHaveBeenCalledWith({
      vaultId: profile.id,
      path: ".lapis/plugins/lapis-word-count",
      recursive: true,
    });
    expect(remove).toHaveBeenNthCalledWith(1, {
      vaultId: profile.id,
      path: ".lapis/plugins/old.json",
      recursive: false,
    });
    expect(remove).toHaveBeenNthCalledWith(2, {
      vaultId: profile.id,
      path: ".lapis/plugins/old",
      recursive: true,
    });
    expect(rename).toHaveBeenCalledWith({
      vaultId: profile.id,
      from: "Draft.md",
      to: "Notes/Draft.md",
    });
    expect(copy).toHaveBeenCalledWith({
      vaultId: profile.id,
      from: "Notes/Draft.md",
      to: "Notes/Copy.md",
    });
    expect(trash).toHaveBeenCalledWith({
      vaultId: profile.id,
      path: "Notes/Copy.md",
    });
  });

  it("downloads official plugin bundles through the authenticated server", async () => {
    const upstream = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response("verified bundle"),
    );
    const serverFetch = createServerPluginDistributionFetch({
      vaultId: profile.id,
      baseUrl: "https://notes.example.test",
      fetch: upstream as typeof fetch,
    });
    const source =
      "https://github.com/lapismd/lapis-plugins/releases/download/wordcount%400.1.1/wordcount-0.1.1.lapis-plugin";

    await serverFetch(source, { signal: new AbortController().signal });

    expect(upstream).toHaveBeenCalledOnce();
    const [input, init] = upstream.mock.calls[0]!;
    const requestUrl = new URL(String(input));
    expect(requestUrl.origin).toBe("https://notes.example.test");
    expect(requestUrl.pathname).toBe(
      `/api/vaults/${profile.id}/plugin-bundles/download`,
    );
    expect(requestUrl.searchParams.get("source")).toBe(source);
    expect(init).toMatchObject({
      credentials: "same-origin",
      signal: expect.any(AbortSignal),
    });
  });
});

describe("ServerVaultEventStream", () => {
  it("resyncs with a fresh cursor after the server rejects a stale epoch", async () => {
    const handlers: Array<{
      onData(value: unknown): void;
      onError(error: Error): void;
      onComplete(): void;
    }> = [];
    const subscribe = vi.fn((input, nextHandlers) => {
      handlers.push(nextHandlers);
      return { unsubscribe: vi.fn() };
    });
    const client = {
      events: { vault: { subscribe } },
    } as unknown as LapisServerBrowserClient;
    const stream = new ServerVaultEventStream(client, profile.id);
    const listener = vi.fn();

    stream.subscribe(listener);
    handlers[0]?.onData({
      id: "old-epoch:4",
      kind: "file",
      vaultId: profile.id,
      payload: { path: "Note.md" },
    });
    handlers[0]?.onError(
      Object.assign(new Error("Vault event cursor is unavailable"), {
        data: {
          code: "PRECONDITION_FAILED",
          lapisCode: "RESYNC_REQUIRED",
        },
      }),
    );
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "resync-required" }),
    );
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(subscribe).toHaveBeenLastCalledWith(
      { vaultId: profile.id, lastEventId: undefined },
      expect.any(Object),
    );
  });
});

describe("server database runtime identity", () => {
  it("selects the Node server transport without claiming local browser ownership", () => {
    const provider = new ServerAppDatabaseProvider(
      {} as LapisServerBrowserClient,
      {} as ServerVaultEventStream,
    );
    expect(
      provider.canOpen({
        runtime: "node-server",
      }),
    ).toBe(true);
    expect(
      provider.canOpen({
        runtime: "web-pwa",
      }),
    ).toBe(false);
  });
});
