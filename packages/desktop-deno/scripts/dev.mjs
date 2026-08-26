import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import {
  createDenoDesktopDevHostBuildArgs,
  createDenoDesktopDevArgs,
  createMacosDesktopDevHostSignArgs,
  createMacosDesktopDevHostVerifyArgs,
  ensureDesktopDevSiblingLinks,
  isMacosDesktopDevHostIdentityCurrent,
  isMacosDesktopDevHostCurrent,
  resolveMacosDesktopDevHost,
  resolveDesktopDevIcon,
  resolveDenoDesktopInspector,
} from "./dev-command.mjs";
import {
  createDesktopRendererTelemetryDefines,
  createDesktopTelemetryEnvironment,
  isDesktopTelemetryRequested,
} from "./telemetry-env.mjs";
import packageManifest from "../package.json" with { type: "json" };

const homeDeno = path.join(process.env.HOME ?? "", ".deno", "bin", "deno");
const denoBin = process.env.DENO ?? (existsSync(homeDeno) ? homeDeno : "deno");
const execFileAsync = promisify(execFile);

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const desktopConfig = JSON.parse(
  await readFile(path.join(packageRoot, "deno.json"), "utf8"),
);
const telemetryEnabled = isDesktopTelemetryRequested(process.argv.slice(2));
const nativeInspectorEnabled = resolveDenoDesktopInspector(
  process.env.LAPIS_DENO_INSPECT,
  telemetryEnabled,
);
const desktopEnvironment = createDesktopTelemetryEnvironment(process.env, {
  enabled: telemetryEnabled,
  version: packageManifest.version,
});
await ensureDesktopDevSiblingLinks(packageRoot);

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: packageRoot,
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed (${signal ?? code})`));
    });
  });
}

async function replaceOrInsertPlistString(plist, key, value) {
  try {
    await execFileAsync("plutil", ["-replace", key, "-string", value, plist]);
  } catch {
    await execFileAsync("plutil", ["-insert", key, "-string", value, plist]);
  }
}

async function signAndVerifyMacosDesktopDevHost(layout) {
  await execFileAsync(
    "codesign",
    createMacosDesktopDevHostSignArgs(layout.bundle),
  );
  await execFileAsync(
    "codesign",
    createMacosDesktopDevHostVerifyArgs(layout.bundle),
  );
}

async function fileModifiedAt(pathname) {
  try {
    return (await stat(pathname)).mtimeMs;
  } catch {
    return null;
  }
}

async function resignMacosDesktopDevHostAfterRuntimeUpdate(
  layout,
  previousModifiedAt,
) {
  const deadline = Date.now() + 10_000;
  let observedModifiedAt = null;
  let stableObservations = 0;
  while (Date.now() < deadline) {
    const modifiedAt = await fileModifiedAt(layout.runtimeLibrary);
    const changed =
      modifiedAt !== null &&
      (previousModifiedAt === null || modifiedAt !== previousModifiedAt);
    if (changed && modifiedAt === observedModifiedAt) {
      stableObservations += 1;
    } else {
      observedModifiedAt = modifiedAt;
      stableObservations = changed ? 1 : 0;
    }
    if (stableObservations >= 3) {
      await signAndVerifyMacosDesktopDevHost(layout);
      console.log("Verified Lapis Notes macOS development host signature");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `Timed out waiting for Deno to update ${layout.runtimeLibrary}`,
  );
}

async function ensureMacosDesktopDevHost(backend, icon) {
  if (process.platform !== "darwin") return undefined;

  const layout = resolveMacosDesktopDevHost(packageRoot, backend);
  const denoVersion = (await execFileAsync(denoBin, ["--version"])).stdout
    .split("\n", 1)[0]
    .trim();
  const expected = {
    denoVersion,
    backend: layout.backend,
    name: desktopConfig.desktop.app.name,
    identifier: desktopConfig.desktop.app.identifier,
  };

  try {
    const marker = JSON.parse(await readFile(layout.marker, "utf8"));
    const executable = await stat(layout.executable);
    const { stdout: bundleName } = await execFileAsync("plutil", [
      "-extract",
      "CFBundleName",
      "raw",
      "-o",
      "-",
      layout.plist,
    ]);
    const signatureValid = await execFileAsync(
      "codesign",
      createMacosDesktopDevHostVerifyArgs(layout.bundle),
    )
      .then(() => true)
      .catch(() => false);
    const identityCurrent = isMacosDesktopDevHostIdentityCurrent({
      expected,
      marker,
      executable: executable.isFile(),
      bundleName: bundleName.trim(),
    });
    if (
      isMacosDesktopDevHostCurrent({
        expected,
        marker,
        executable: executable.isFile(),
        signatureValid,
        bundleName: bundleName.trim(),
      })
    ) {
      return layout;
    }
    if (identityCurrent) {
      await signAndVerifyMacosDesktopDevHost(layout);
      return layout;
    }
  } catch {
    // Missing or stale generated host; rebuild it below.
  }

  await rm(layout.bundle, { force: true, recursive: true });
  await mkdir(path.dirname(layout.bundle), { recursive: true });
  console.log(`Preparing ${expected.name} macOS ${layout.backend} host…`);
  await run(
    denoBin,
    createDenoDesktopDevHostBuildArgs({
      backend: layout.backend,
      output: layout.bundle,
      icon,
    }),
  );
  await replaceOrInsertPlistString(layout.plist, "CFBundleName", expected.name);
  await replaceOrInsertPlistString(
    layout.plist,
    "CFBundleDisplayName",
    expected.name,
  );
  await replaceOrInsertPlistString(
    layout.plist,
    "CFBundleIdentifier",
    expected.identifier,
  );
  await signAndVerifyMacosDesktopDevHost(layout);
  await writeFile(layout.marker, `${JSON.stringify(expected, null, 2)}\n`);
  return layout;
}

const backend = process.env.LAPIS_DENO_BACKEND?.trim();
const desktopIcon = resolveDesktopDevIcon(packageRoot, process.platform);
const macosDesktopDevHost = await ensureMacosDesktopDevHost(
  backend,
  desktopIcon,
);
const macosRuntimeModifiedAt = macosDesktopDevHost
  ? await fileModifiedAt(macosDesktopDevHost.runtimeLibrary)
  : null;

const server = await createServer({
  configFile: path.join(packageRoot, "vite.config.ts"),
  define: createDesktopRendererTelemetryDefines(
    desktopEnvironment,
    telemetryEnabled,
  ),
  root: packageRoot,
});
await server.listen();
const address = "http://127.0.0.1:1422";
console.log(`Deno desktop renderer: ${address}`);
if (telemetryEnabled) {
  console.log(
    `Deno desktop telemetry: Grafana http://localhost:3000, OTLP ${desktopEnvironment.OTEL_EXPORTER_OTLP_ENDPOINT}`,
  );
}

if (backend === "cef") {
  console.log(
    "Deno desktop backend: cef. Use View → Toggle Developer Tools for the Chromium DevTools window.",
  );
} else if (backend && backend !== "webview") {
  console.warn(
    `Ignoring unsupported LAPIS_DENO_BACKEND=${JSON.stringify(backend)}; using deno.json default backend.`,
  );
}
const deno = spawn(
  denoBin,
  createDenoDesktopDevArgs(backend, {
    inspect: nativeInspectorEnabled,
    icon: desktopIcon,
  }),
  {
    cwd: packageRoot,
    env: {
      ...desktopEnvironment,
      LAPIS_DESKTOP_DEV_SERVER_URL: address.replace(/\/$/u, ""),
      ...(macosDesktopDevHost
        ? { LAUFEY_DEV_DIR: macosDesktopDevHost.root }
        : {}),
    },
    stdio: "inherit",
  },
);

if (macosDesktopDevHost) {
  void resignMacosDesktopDevHostAfterRuntimeUpdate(
    macosDesktopDevHost,
    macosRuntimeModifiedAt,
  ).catch((error) => {
    console.error("Failed to finalize macOS development host signature", error);
    deno.kill("SIGTERM");
  });
}

const shutdown = async () => {
  deno.kill("SIGTERM");
  await server.close();
};

process.on("SIGINT", () => {
  void shutdown().then(() => process.exit(130));
});
process.on("SIGTERM", () => {
  void shutdown().then(() => process.exit(143));
});

deno.on("exit", (code) => {
  void server.close().then(() => process.exit(code ?? 0));
});
