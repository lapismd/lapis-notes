import { describe, expect, it } from "vitest";

import {
  CROSS_ORIGIN_HEADERS,
  createUpstreamHeaders,
  isWebSocketUpgrade,
  rewriteUpstreamUrl,
  withIsolationHeaders,
} from "./renderer-http";

describe("Deno desktop renderer proxy", () => {
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
