import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

export async function startCloudflarePreview(config) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  // The pinned local workerd supports 2026-10-23. Production retains the
  // requested 2026-11-01 compatibility date in the unmodified artifact.
  const child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/wrangler/bin/wrangler.js"),
      "dev",
      "--config",
      config,
      "--port",
      String(port),
      "--ip",
      "127.0.0.1",
      "--local",
      "--compatibility-date",
      "2026-10-23",
    ],
    {
      env: { ...process.env, CI: "true", WRANGLER_SEND_METRICS: "false" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const closed = once(child, "exit");
  let log = "";
  child.stdout.on("data", (bytes) => {
    log += bytes;
  });
  child.stderr.on("data", (bytes) => {
    log += bytes;
  });
  const close = async () => {
    if (child.exitCode !== null) return;
    child.kill("SIGTERM");
    const kill = setTimeout(() => child.kill("SIGKILL"), 8000);
    try {
      await closed;
    } finally {
      clearTimeout(kill);
    }
  };
  const origin = `http://127.0.0.1:${port}`;
  try {
    for (let attempt = 0; attempt < 300; attempt++) {
      if (child.exitCode !== null) throw new Error(log);
      try {
        if ((await fetch(`${origin}/version.json`)).ok)
          return { origin, close };
      } catch {
        /* Local server start-up. */
      }
      await delay(100);
    }
    throw new Error(`Cloudflare preview did not start:\n${log}`);
  } catch (error) {
    await close();
    throw error;
  }
}
