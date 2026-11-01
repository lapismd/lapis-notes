import { spawn } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startCloudflarePreview } from "./lib/cloudflare-preview.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = await mkdtemp(path.join(os.tmpdir(), "lapis-pwa-acceptance-"));
await cp(path.join(root, ".cloudflare"), fixture, { recursive: true });
const preview = await startCloudflarePreview(
  path.join(fixture, "wrangler.json"),
);
try {
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(root, "scripts/smoke-cloudflare-web.mjs"), preview.origin],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          LAPIS_PWA_UPDATE_TEST_SW: path.join(fixture, "assets/sw.js"),
        },
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Cloudflare artifact acceptance failed (${code})`)),
    );
  });
} finally {
  await preview.close();
  await rm(fixture, { recursive: true, force: true });
}
