import { join } from "node:path";

import { createTRPCClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "./router.ts";
import { createLapisDenoServer } from "./server.ts";

const root = await Deno.makeTempDir({ prefix: "lapis-server-smoke-" });
const dataRoot = join(root, "data");
const staticRoot = join(root, "static");
const passwordFile = join(root, "bootstrap-password");
await Deno.mkdir(staticRoot, { recursive: true });
await Deno.writeTextFile(
  join(staticRoot, "index.html"),
  "<!doctype html><title>Lapis</title>",
);
await Deno.writeTextFile(passwordFile, "correct horse battery staple\n", {
  mode: 0o600,
});

const origin = "http://localhost";
const app = await createLapisDenoServer(
  {
    dataRoot,
    staticRoot,
    hostname: "127.0.0.1",
    port: 0,
    origin,
    secureCookie: false,
    trustForwardedHeaders: false,
    buildId: "smoke",
  },
  {
    LAPIS_SERVER_BOOTSTRAP_USERNAME: "owner",
    LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE: passwordFile,
  },
);

const abort = new AbortController();
let resolveBase!: (value: string) => void;
const basePromise = new Promise<string>((resolve) => {
  resolveBase = resolve;
});
const server = Deno.serve(
  {
    hostname: "127.0.0.1",
    port: 0,
    signal: abort.signal,
    onListen({ port }) {
      resolveBase(`http://127.0.0.1:${port}`);
    },
  },
  app.handler,
);

try {
  const baseUrl = await basePromise;
  let cookie = "";
  let csrfToken = "";
  const client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        headers: () => ({
          origin,
          ...(cookie ? { cookie } : {}),
          ...(csrfToken ? { "x-lapis-csrf": csrfToken } : {}),
        }),
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          const setCookie = response.headers.get("set-cookie");
          if (setCookie) cookie = setCookie.split(";", 1)[0];
          return response;
        },
      }),
    ],
  });

  const info = await client.system.info.query();
  if (info.protocolMajor !== 1 || info.buildId !== "smoke") {
    throw new Error("System protocol response is invalid");
  }
  const login = await client.auth.login.mutate({
    username: "owner",
    password: "correct horse battery staple",
  });
  csrfToken = login.csrfToken;
  const created = await client.vault.create.mutate({ name: "Smoke vault" });
  const getMeta = client.database.metadata.getMeta as unknown as {
    query(input: { vaultId: string; args: unknown[] }): Promise<unknown>;
  };
  const missingMeta = await getMeta.query({
    vaultId: created.vaultId,
    args: ["smoke-missing"],
  });
  if (missingMeta !== undefined) {
    throw new Error("Native database worker returned unexpected metadata");
  }
  const fileUrl = `${baseUrl}/api/vaults/${created.vaultId}/files/Smoke.md`;
  const write = await fetch(fileUrl, {
    method: "PUT",
    headers: {
      cookie,
      origin,
      "x-lapis-csrf": csrfToken,
      "if-none-match": "*",
    },
    body: "# Smoke\n",
  });
  if (write.status !== 204 || !write.headers.get("etag")) {
    throw new Error(`Initial file write failed: ${write.status}`);
  }
  const read = await fetch(fileUrl, { headers: { cookie } });
  if (read.status !== 200 || (await read.text()) !== "# Smoke\n") {
    throw new Error("File read did not round-trip");
  }
  const conflict = await fetch(fileUrl, {
    method: "PUT",
    headers: {
      cookie,
      origin,
      "x-lapis-csrf": csrfToken,
      "if-match": '"stale"',
    },
    body: "conflict",
  });
  if (conflict.status !== 412) {
    throw new Error(`Conditional write returned ${conflict.status}`);
  }
  console.log("Deno server smoke passed");
} finally {
  abort.abort();
  await server.finished;
  await app.close();
  await Deno.remove(root, { recursive: true }).catch(() => undefined);
}
