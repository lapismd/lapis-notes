import { createLapisDenoServer } from "./server.ts";

const app = await createLapisDenoServer();
const abort = new AbortController();
let closing: Promise<void> | undefined;

function shutdown(): void {
  closing ??= (async () => {
    abort.abort();
    await app.close();
  })();
}

Deno.addSignalListener("SIGINT", shutdown);
Deno.addSignalListener("SIGTERM", shutdown);

const server = Deno.serve(
  {
    hostname: app.config.hostname,
    port: app.config.port,
    signal: abort.signal,
    onListen({ hostname, port }) {
      console.log(`Lapis server listening on http://${hostname}:${port}`);
    },
  },
  app.handler,
);

await server.finished;
await closing;
