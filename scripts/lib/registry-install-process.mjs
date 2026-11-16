import { spawn } from "node:child_process";

export function registryFailure(code, message, details = {}) {
  return Object.assign(new Error(`${code}: ${message}`), { code, ...details });
}

export function assertRegistryInstallPlatform(platform = process.platform) {
  if (!["linux", "darwin"].includes(platform))
    throw registryFailure(
      "REGISTRY_INSTALL_PLATFORM",
      "Private registry verification requires Linux or macOS owned-process cancellation",
    );
}

export async function runRegistryInstall(
  consumerDir,
  metadataCache,
  timeoutMs,
  registry,
) {
  assertRegistryInstallPlatform();
  return new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        "install",
        "--cache-dir",
        metadataCache,
        "--strict-peer-dependencies=false",
        "--reporter=ndjson",
        "--registry",
        registry,
      ],
      {
        cwd: consumerDir,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      },
    );
    let output = "",
      stopped;
    const stop = (error) => {
      stopped ??= error;
      if (!child.pid) return;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch (error) {
        if (error.code !== "ESRCH") stopped = error;
      }
    };
    const timer = setTimeout(
      () =>
        stop(
          registryFailure(
            "REGISTRY_INSTALL_TIMEOUT",
            "Consumer installation exhausted its remaining readiness budget",
          ),
        ),
      timeoutMs,
    );
    const collect = (chunk) => {
      if (stopped) return;
      output += chunk;
      if (Buffer.byteLength(output) > 8 * 1024 * 1024)
        stop(
          registryFailure(
            "REGISTRY_INSTALL_OUTPUT_LIMIT",
            "Consumer installation exceeded its diagnostic limit",
          ),
        );
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", (error) => {
      stopped ??= error;
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (stopped) return reject(stopped);
      if (code === 0) return resolve();
      const errors = output.split("\n").flatMap((line) => {
        try {
          const entry = JSON.parse(line);
          return entry.level === "error" ? [entry] : [];
        } catch {
          return [];
        }
      });
      reject(
        registryFailure(
          "REGISTRY_INSTALL_FAILED",
          `pnpm install failed (${code})\n${output}`,
          { errors },
        ),
      );
    });
  });
}
