import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  CROSS_ORIGIN_HEADERS,
  createUpstreamHeaders,
  isWebSocketUpgrade,
  rewriteUpstreamUrl,
  withIsolationHeaders,
} from "./renderer-http";

describe("Deno desktop renderer proxy", () => {
  it("removes encoded representation headers from a decoded upstream body", async () => {
    const response = new Response("<!doctype html><title>Lapis Notes</title>", {
      status: 200,
      headers: {
        "Content-Encoding": "gzip",
        "Content-Length": "71",
        "Content-Type": "text/html",
        ETag: 'W/"upstream"',
      },
    });
    const proxied = withIsolationHeaders(response, { decodedUpstream: true });
    expect(proxied.headers.get("Content-Encoding")).toBeNull();
    expect(proxied.headers.get("Content-Length")).toBeNull();
    expect(proxied.headers.get("Content-Type")).toBe("text/html");
    expect(proxied.headers.get("ETag")).toBe('W/"upstream"');
    expect(proxied.status).toBe(200);
    expect(await proxied.text()).toBe(
      "<!doctype html><title>Lapis Notes</title>",
    );
  });

  it("preserves representation headers for raw asset responses", async () => {
    const bytes = new Uint8Array([0x1f, 0x8b, 0x08]);
    const response = withIsolationHeaders(
      new Response(bytes, {
        headers: { "Content-Encoding": "gzip", "Content-Length": "3" },
      }),
    );
    expect(response.headers.get("Content-Encoding")).toBe("gzip");
    expect(response.headers.get("Content-Length")).toBe("3");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("serves verified plugin assets before falling through to Vite", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    const pluginAssets = source.indexOf(
      "await pluginAssets.respond(request.url)",
    );
    const viteFallback = source.indexOf(
      "if (devUrl) return await proxyVite(request, devUrl)",
    );

    expect(pluginAssets).toBeGreaterThan(-1);
    expect(viteFallback).toBeGreaterThan(pluginAssets);
  });

  it("rewrites the incoming path onto the Vite origin", () => {
    const rewritten = rewriteUpstreamUrl(
      "http://127.0.0.1:4567/src/main.ts?t=1",
      "http://127.0.0.1:1422",
    );
    expect(rewritten.href).toBe("http://127.0.0.1:1422/src/main.ts?t=1");
  });

  it("detects websocket upgrades and copies isolation headers", () => {
    expect(
      isWebSocketUpgrade(
        new Request("http://127.0.0.1/", {
          headers: { upgrade: "websocket" },
        }),
      ),
    ).toBe(true);
    const isolated = withIsolationHeaders(new Response("ok"));
    expect(isolated.headers.get("Cross-Origin-Opener-Policy")).toBe(
      CROSS_ORIGIN_HEADERS["Cross-Origin-Opener-Policy"],
    );
    const headers = createUpstreamHeaders(
      new Request("http://127.0.0.1/", {
        headers: { upgrade: "websocket", accept: "text/html" },
      }),
      new URL("http://127.0.0.1:1422"),
    );
    expect(headers.get("upgrade")).toBeNull();
    expect(headers.get("host")).toBe("127.0.0.1:1422");
    expect(headers.get("accept")).toBe("text/html");
  });
});
