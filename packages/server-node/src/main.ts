import { startLapisNodeServer } from "./http.ts";
import { createLapisNodeServer } from "./server.ts";

const app = await createLapisNodeServer();
const running = await startLapisNodeServer(app);
console.log(`Lapis server listening on ${running.url}`);
await new Promise<void>((resolve, reject) => {
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    console.log("Lapis server shutdown requested");
    void running.close().then(() => {
      process.removeListener("SIGINT", shutdown);
      process.removeListener("SIGTERM", shutdown);
      console.log("Lapis server stopped");
      resolve();
    }, reject);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});
