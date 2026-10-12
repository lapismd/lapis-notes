export const CROSS_ORIGIN_HEADERS = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
} as const;

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

export function rewriteUpstreamUrl(
  requestUrl: string,
  upstreamOrigin: string,
): URL {
  const incoming = new URL(requestUrl);
  return new URL(`${incoming.pathname}${incoming.search}`, upstreamOrigin);
}

export function isWebSocketUpgrade(request: Request): boolean {
  return request.headers.get("upgrade")?.toLowerCase() === "websocket";
}

export function withIsolationHeaders(
  response: Response,
  options: { decodedUpstream?: boolean } = {},
): Response {
  const headers = new Headers(response.headers);
  if (options.decodedUpstream) {
    // Fetch exposes the decoded body but can retain its wire representation
    // headers. Forwarding those headers makes the renderer decode it again.
    headers.delete("Content-Encoding");
    headers.delete("Content-Length");
  }
  for (const [name, value] of Object.entries(CROSS_ORIGIN_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function createUpstreamHeaders(
  request: Request,
  upstream: URL,
): Headers {
  const headers = new Headers();
  for (const [name, value] of request.headers) {
    if (!HOP_BY_HOP.has(name.toLowerCase())) headers.set(name, value);
  }
  headers.set("host", upstream.host);
  return headers;
}
