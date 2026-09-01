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
} from "./direct-routes.ts";
import { VaultEventHub } from "./events.ts";
import { ManagedVaultStore } from "./managed-vaults.ts";
import { appRouter } from "./router.ts";
import { VaultRuntimeManager } from "./vault-runtimes.ts";
import { handleTransferRoute } from "./transfers.ts";

export type LapisDenoServer = {
  config: ServerConfig;
  services: ServerServices;
  handler: Deno.ServeHandler;
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
  let stat = await Deno.stat(path).catch(() => undefined);
  if (!stat?.isFile && !relative.includes(".")) {
    path = join(config.staticRoot, "index.html");
    stat = await Deno.stat(path).catch(() => undefined);
  }
  if (!stat?.isFile) return new Response("Not found", { status: 404 });
  const file = await Deno.open(path, { read: true });
  return new Response(request.method === "HEAD" ? null : file.readable, {
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

export async function createLapisDenoServer(
  config = loadServerConfig(),
  env: Record<string, string | undefined> = readServerEnvironment(),
): Promise<LapisDenoServer> {
  const events = new VaultEventHub();
  const store = new ManagedVaultStore(config.dataRoot, events);
  await store.initialize();
  const readinessProbe = join(config.dataRoot, ".ready-probe");
  await Deno.writeTextFile(readinessProbe, "ready", { create: true });
  await Deno.remove(readinessProbe);
  const index = await Deno.stat(join(config.staticRoot, "index.html"));
  if (!index.isFile) throw new Error("Server static index is unavailable");
  const control = await ControlDatabase.open(
    join(config.dataRoot, "control", "control.turso"),
  );
  await bootstrapFirstUser(control, env);
  const runtimes = new VaultRuntimeManager(config.dataRoot, events);
  const services = {
    config,
    control,
    events,
    store,
    runtimes,
  } satisfies ServerServices;
  let ready = true;
  let closed = false;
  const idleCleanup = setInterval(() => {
    void runtimes
      .closeIdle()
      .catch((error) => console.error("idle vault cleanup failed", { error }));
  }, 60_000);

  const handler: Deno.ServeHandler = async (request, info) => {
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
      : info.remoteAddr.transport === "tcp"
        ? info.remoteAddr.hostname
        : "local";
    const headers = new Headers(request.headers);
    headers.set("x-lapis-remote-address", remoteAddress || "unknown");
    request = new Request(request, { headers });
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

  return {
    config,
    services,
    handler,
    ready: () => ready,
    async close() {
      if (closed) return;
      closed = true;
      ready = false;
      clearInterval(idleCleanup);
      events.close();
      console.log("Closing vault database runtimes");
      await runtimes.closeAll();
      console.log("Closing the server control database");
      await control.close();
    },
  };
}
