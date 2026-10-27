import { spawn } from "node:child_process";
import { constants } from "node:fs";
import {
  access,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const profile = Object.freeze({
  schema: 1,
  runtime: "rust-server",
  nativeMetadata: true,
  nativeHistory: true,
  nativeTasks: true,
});
const certificate = "lapis-host-profile.json";
const root = fileURLToPath(new URL("../", import.meta.url));
const staticOutput = (directory) =>
  join(directory, "packages/web/dist-rust-server");
const binaryOutput = (directory) =>
  join(
    directory,
    ".local/rust-core-target/release",
    process.platform === "win32" ? "lapis-server.exe" : "lapis-server",
  );

class ProcessExit extends Error {
  constructor(code) {
    super(`Native delivery command exited ${code}`);
    this.code = code;
  }
}

function execute(command, args, options) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: "inherit",
      shell: false,
    });
    const interrupt = () => child.kill("SIGINT");
    const terminate = () => child.kill("SIGTERM");
    process.on("SIGINT", interrupt);
    process.on("SIGTERM", terminate);
    const cleanup = () => {
      process.off("SIGINT", interrupt);
      process.off("SIGTERM", terminate);
    };
    child.once("error", (error) => {
      cleanup();
      reject(error);
    });
    child.once("exit", (code, signal) => {
      cleanup();
      const status =
        code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1);
      if (status === 0) accept();
      else reject(new ProcessExit(status));
    });
  });
}

async function regularFile(path, label, executable = false) {
  try {
    if (!(await stat(path)).isFile()) throw Error("Not a regular file");
    await access(path, executable ? constants.X_OK : constants.R_OK);
    return await realpath(path);
  } catch {
    throw Error(
      `Missing or inaccessible ${label}; run pnpm build:server:rust first`,
    );
  }
}

export async function build(
  directory = root,
  environment = process.env,
  run = execute,
) {
  const output = staticOutput(directory);
  await rm(join(output, certificate), { force: true });
  const env = {
    ...environment,
    VITE_LAPIS_NATIVE_METADATA: "1",
    VITE_LAPIS_NATIVE_HISTORY: "1",
    VITE_LAPIS_NATIVE_TASKS: "1",
  };
  const options = { cwd: directory, env };
  await run(
    "pnpm",
    ["rust:core", "--", "build", "-p", "lapis-server", "--release", "--locked"],
    options,
  );
  await run(
    "pnpm",
    [
      "exec",
      "turbo",
      "run",
      "build",
      "--filter=@lapis-notes/app-profile...",
      "--concurrency=2",
    ],
    options,
  );
  await run(
    "pnpm",
    ["--filter", "@lapis-notes/web", "build:rust-server"],
    options,
  );
  await regularFile(binaryOutput(directory), "native server binary", true);
  await regularFile(join(output, "index.html"), "native Web entrypoint");
  await writeFile(join(output, certificate), JSON.stringify(profile) + "\n");
}

export async function start(
  directory = root,
  environment = process.env,
  run = execute,
) {
  for (const name of ["LAPIS_SERVER_CONFIG", "LAPIS_SERVER_DATA_ROOT"])
    if (!environment[name]?.trim())
      throw Error(`Set ${name} explicitly before native startup`);
  const config = await regularFile(
    resolve(environment.LAPIS_SERVER_CONFIG),
    "operator configuration",
  );
  const binary = await regularFile(
    environment.LAPIS_SERVER_BINARY ?? binaryOutput(directory),
    "native server binary",
    true,
  );
  const output = await realpath(
    environment.LAPIS_SERVER_STATIC_ROOT ?? staticOutput(directory),
  );
  await regularFile(join(output, "index.html"), "native Web entrypoint");
  let selected;
  try {
    selected = JSON.parse(await readFile(join(output, certificate), "utf8"));
  } catch {
    throw Error(
      "Missing native renderer profile; run pnpm build:server:rust first",
    );
  }
  if (Object.entries(profile).some(([key, value]) => selected?.[key] !== value))
    throw Error(
      "Incompatible native renderer profile; run pnpm build:server:rust first",
    );
  await run(
    binary,
    [config, environment.LAPIS_SERVER_LISTEN ?? "127.0.0.1:8787"],
    {
      cwd: directory,
      env: {
        ...environment,
        LAPIS_SERVER_STATIC_ROOT: output,
        LAPIS_SERVER_NATIVE_HISTORY: "1",
      },
    },
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    if (
      process.argv.length !== 3 ||
      !["build", "start"].includes(process.argv[2])
    )
      throw Error("Use node scripts/server-runtime.mjs build|start");
    await (process.argv[2] === "build" ? build() : start());
  } catch (error) {
    if (!(error instanceof ProcessExit)) console.error(error.message);
    process.exitCode = error instanceof ProcessExit ? error.code : 1;
  }
}
