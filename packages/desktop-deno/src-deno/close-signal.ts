export const DESKTOP_CLOSE_SIGNAL_PATH = "/__lapis/desktop-close-signal";

type PendingCloseResponse = {
  resolve(response: Response): void;
};

function closeSignalResponse(requested: boolean): Response {
  return new Response(requested ? "close" : null, {
    status: requested ? 200 : 204,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export function createDesktopCloseSignal() {
  const pending = new Set<PendingCloseResponse>();
  let requested = false;
  let closed = false;

  const settle = (isCloseRequest: boolean) => {
    for (const waiter of [...pending]) {
      pending.delete(waiter);
      waiter.resolve(closeSignalResponse(isCloseRequest));
    }
  };

  return {
    respond(request: Request): Promise<Response> | Response | null {
      const url = new URL(request.url);
      if (url.pathname !== DESKTOP_CLOSE_SIGNAL_PATH) return null;
      if (request.method !== "GET") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { allow: "GET" },
        });
      }
      if (requested || closed) return closeSignalResponse(requested);
      return new Promise<Response>((resolve) => {
        pending.add({ resolve });
      });
    },
    requestClose(): void {
      if (requested || closed) return;
      requested = true;
      settle(true);
    },
    close(): void {
      if (closed) return;
      closed = true;
      settle(requested);
    },
  };
}
