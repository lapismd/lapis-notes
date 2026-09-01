import { createLapisDenoServer } from "./server.ts";

const app = await createLapisDenoServer();
const abort = new AbortController();
let closing: Promise<void> | undefined;

function shutdown(): void {
  closing ??= (async () => {
    console.log("Lapis server shutdown requested");
    abort.abort();
    await app.close();
    console.log("Lapis server services closed");
  })();
}

const shutdownSignals = ["SIGINT", "SIGTERM"] as const;
for (const signal of shutdownSignals) Deno.addSignalListener(signal, shutdown);

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

try {
  await server.finished;
  console.log("Lapis HTTP server closed");
  await closing;
} finally {
  for (const signal of shutdownSignals) {
    Deno.removeSignalListener(signal, shutdown);
  }
}
console.log("Lapis server stopped");
