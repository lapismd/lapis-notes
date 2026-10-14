import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { NativeVaultLease } from "./sync-vault-lease";

it("enforces cross-process ownership and releases it after process death", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lapis-native-owner-"));
  const script = join(directory, "owner.mjs");
  await writeFile(
    script,
    `import { NativeVaultLease } from ${JSON.stringify(new URL("./sync-vault-lease.ts", import.meta.url).href)};
await NativeVaultLease.open(process.argv[2]);
process.stdout.write("ready\\n");
setInterval(() => {}, 1000);
`,
  );
  const child = spawn(
    process.execPath,
    ["--import", "tsx", script, directory],
    {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stderr = "";
  child.stderr.on("data", (bytes) => {
    stderr += bytes;
  });
  const exited = once(child, "exit");
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const ready = await Promise.race([
      once(child.stdout, "data").then(([bytes]) => String(bytes)),
      exited.then(() => {
        throw new Error(`Owner process exited before readiness: ${stderr}`);
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(new Error(`Owner process readiness timed out: ${stderr}`)),
          5000,
        );
      }),
    ]);
    expect(ready).toBe("ready\n");
    await expect(NativeVaultLease.open(directory)).rejects.toThrow(
      "Another native apply owner",
    );
    child.kill("SIGKILL");
    await exited;
    const next = await NativeVaultLease.open(directory);
    await next.close();
  } finally {
    clearTimeout(timeout);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  }
}, 15_000);
