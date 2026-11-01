const isolation = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
};

export function createAssetWorker(compressedAssets: Record<string, string>) {
  return {
    async fetch(request, env): Promise<Response> {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { ...isolation, Allow: "GET, HEAD" },
        });
      }
      const url = new URL(request.url);
      const compressed = Object.hasOwn(compressedAssets, url.pathname)
        ? compressedAssets[url.pathname]
        : undefined;
      const headers = new Headers(request.headers);
      if (compressed) {
        headers.delete("Range");
        headers.delete("If-Range");
        url.pathname = compressed;
      }
      const response = await env.ASSETS.fetch(
        new Request(url, { method: request.method, headers }),
      );
      if (response.headers.get("Content-Type")?.includes("text/html")) {
        return new Response("Not found", {
          status: 404,
          headers: {
            ...isolation,
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }
      const result = new Headers(response.headers);
      for (const [key, value] of Object.entries(isolation))
        result.set(key, value);
      if (compressed && (response.status === 200 || response.status === 304)) {
        result.set("Content-Type", "application/wasm");
        result.append("Vary", "Accept-Encoding");
        if (response.status === 200) result.set("Content-Encoding", "gzip");
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: result,
        encodeBody: "manual",
      });
    },
  } satisfies ExportedHandler<Env>;
}
