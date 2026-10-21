import { Readable } from "node:stream";
import * as fs from "node:fs/promises";
import { join, normalize } from "node:path";

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { bootstrapFirstUser, resolveRequestSession } from "./auth.ts";
import {
  loadServerConfig,
  readServerEnvironment,
  type ServerConfig,
} from "./config.ts";
import { ControlDatabase } from "./control-database.ts";
import type { ServerContext, ServerServices } from "./context.ts";
import {
  contentType,
  directRouteError,
  handleDirectRoute,
  handlePluginAssetRoute,
  handlePluginBundleDownloadRoute,
} from "./direct-routes.ts";
import { VaultEventHub } from "./events.ts";
import { ManagedVaultStore } from "./managed-vaults.ts";
import { appRouter } from "./router.ts";
import { VaultRuntimeManager } from "./vault-runtimes.ts";
import { handleTransferRoute } from "./transfers.ts";

export type LapisNodeServer = {
  config: ServerConfig;
  services: ServerServices;
  handler(request: Request, remoteAddress?: string): Promise<Response>;
  stop(): void;
  ready(): boolean;
  close(): Promise<void>;
};

async function staticResponse(
  request: Request,
  config: ServerConfig,
): Promise<Response> {
  const url = new URL(request.url);
  let requested: string;
  try {
    requested = decodeURIComponent(url.pathname);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const relative = normalize(requested).replace(/^[/\\]+/u, "");
  if (relative.startsWith("..") || relative.includes("\0")) {
    return new Response("Not found", { status: 404 });
  }
  let path = join(config.staticRoot, relative || "index.html");
  let stat = await fs.stat(path).catch(() => undefined);
  if (!stat?.isFile() && !relative.includes(".")) {
    path = join(config.staticRoot, "index.html");
    stat = await fs.stat(path).catch(() => undefined);
  }
  if (!stat?.isFile()) return new Response("Not found", { status: 404 });
  const body =
    request.method === "HEAD"
      ? null
      : (Readable.toWeb(
          (await fs.open(path, "r")).createReadStream(),
        ) as ReadableStream<Uint8Array>);
  return new Response(body, {
    headers: {
      "Cache-Control": /\.[a-f0-9]{8,}\./iu.test(relative)
        ? "public, max-age=31536000, immutable"
        : "no-cache",
      "Content-Length": String(stat.size),
      "Content-Type": contentType(path),
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function createLapisNodeServer(
  config = loadServerConfig(),
  env: Record<string, string | undefined> = readServerEnvironment(),
): Promise<LapisNodeServer> {
  const events = new VaultEventHub();
  const store = new ManagedVaultStore(config.dataRoot, events);
  await store.initialize();
  const readinessProbe = join(config.dataRoot, ".ready-probe");
  await fs.writeFile(readinessProbe, "ready");
  await fs.rm(readinessProbe);
  const index = await fs.stat(join(config.staticRoot, "index.html"));
  if (!index.isFile()) throw new Error("Server static index is unavailable");
  const control = await ControlDatabase.open(
    join(config.dataRoot, "control", "control.turso"),
  );
  try {
    await bootstrapFirstUser(control, env);
  } catch (error) {
    await control.close();
    throw error;
  }
  const runtimes = new VaultRuntimeManager(config.dataRoot, events);
  const services = {
    config,
    control,
    events,
    store,
    runtimes,
  } satisfies ServerServices;
  let ready = true;
  let closing: Promise<void> | undefined;
  const active = new Set<Promise<Response>>();
  const idleCleanup = setInterval(() => {
    void runtimes
      .closeIdle()
      .catch((error) => console.error("idle vault cleanup failed", { error }));
  }, 60_000);

  const dispatch = async (
    request: Request,
    peerAddress?: string,
  ): Promise<Response> => {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") return Response.json({ status: "ok" });
    if (url.pathname === "/readyz") {
      return Response.json(
        { status: ready ? "ready" : "unavailable" },
        { status: ready ? 200 : 503 },
      );
    }
    const remoteAddress = config.trustForwardedHeaders
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      : (peerAddress ?? "local");
    // The Node Fetch adapter supplies a lazy Request. Preserve its body and
    // abort signal instead of cloning it through a different Request class.
    request.headers.set("x-lapis-remote-address", remoteAddress || "unknown");
    const session = await resolveRequestSession(
      request,
      control,
      Date.now(),
      config.secureCookie,
    );
    if (url.pathname.startsWith("/__lapis/plugins/")) {
      try {
        return (
          (await handlePluginAssetRoute(request, services, session)) ??
          new Response("Not found", { status: 404 })
        );
      } catch (error) {
        return directRouteError(error);
      }
    }
    if (url.pathname.startsWith("/api/vaults/")) {
      try {
        return (
          (await handlePluginBundleDownloadRoute(request, services, session)) ??
          (await handleTransferRoute(request, services, session)) ??
          (await handleDirectRoute(request, services, session)) ??
          new Response("Not found", { status: 404 })
        );
      } catch (error) {
        return directRouteError(error);
      }
    }
    if (url.pathname.startsWith("/api/trpc")) {
      const responseHeaders = new Headers();
      return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: (): ServerContext => ({
          ...services,
          request,
          responseHeaders,
          ...(session ? { session } : {}),
        }),
        responseMeta() {
          return { headers: responseHeaders };
        },
        onError({ error, path }) {
          console.error("server request failed", { path, code: error.code });
        },
      });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }
    return staticResponse(request, config);
  };

  const stop = () => {
    ready = false;
    clearInterval(idleCleanup);
    events.close();
  };
  const handler = (
    request: Request,
    peerAddress?: string,
  ): Promise<Response> => {
    const path = new URL(request.url).pathname;
    if (!ready && path !== "/healthz" && path !== "/readyz")
      return Promise.resolve(
        new Response("Server is shutting down", { status: 503 }),
      );
    const pending = dispatch(request, peerAddress);
    active.add(pending);
    void pending.then(
      () => active.delete(pending),
      () => active.delete(pending),
    );
    return pending;
  };
  return {
    config,
    services,
    handler,
    stop,
    ready: () => ready,
    close() {
      return (closing ??= (async () => {
        stop();
        while (active.size) await Promise.allSettled([...active]);
        await store.drain();
        console.log("Closing vault database runtimes");
        await runtimes.closeAll();
        console.log("Closing the server control database");
        await control.close();
      })());
    },
  };
}
