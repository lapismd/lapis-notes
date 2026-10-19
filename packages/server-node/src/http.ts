import { getRequestListener } from "@hono/node-server";
import { createServer } from "node:http";
import type { LapisNodeServer } from "./server.ts";

/** The Fetch adapter owns HTTP streams; application policy stays in the host. */
export async function startLapisNodeServer(
  app: LapisNodeServer,
  graceMs = 10_000,
) {
  let shutdown: Promise<void> | undefined;
  const server = createServer(
    getRequestListener(
      (request, bindings) =>
        app.handler(request, bindings.incoming.socket.remoteAddress),
      {
        overrideGlobalObjects: false,
        errorHandler: () => {
          console.error("server request failed", { code: "INTERNAL" });
          return new Response("Internal server error", { status: 500 });
        },
      },
    ),
  );
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(app.config.port, app.config.hostname, resolve);
    });
  } catch (error) {
    await app.close();
    throw error;
  }
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Node HTTP listener has no TCP address");
  const host = address.address.includes(":")
    ? `[${address.address}]`
    : address.address;
  return {
    url: `http://${host}:${address.port}`,
    close(): Promise<void> {
      return (shutdown ??= (async () => {
        app.stop();
        const timeout = setTimeout(() => server.closeAllConnections(), graceMs);
        timeout.unref();
        try {
          await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
        } finally {
          clearTimeout(timeout);
          await app.close();
        }
      })());
    },
  };
}
