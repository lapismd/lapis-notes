import { execFileSync, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { execute } from "./process.mjs";
export function contextArguments(config, args) {
  return [...(config.context ? ["--context", config.context] : []), ...args];
}
export function sshDockerCommand(
  endpoint,
  args,
  { multiplexing = true, controlPath } = {},
) {
  const url = new URL(endpoint);
  if (
    url.protocol !== "ssh:" ||
    !url.hostname ||
    !/^[a-zA-Z0-9_.-]+$/.test(decodeURIComponent(url.username)) ||
    url.password
  )
    throw Error("SSH CLI transport requires an SSH Docker context");
  const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'";
  return [
    "ssh",
    [
      "-T",
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=10",
      "-o",
      "ConnectionAttempts=5",
      ...(multiplexing
        ? [
            "-o",
            "ControlMaster=auto",
            "-o",
            "ControlPersist=60",
            "-o",
            "ControlPath=" +
              (controlPath ?? "/tmp/lapis-notes-validation-ssh-%C"),
          ]
        : [
            "-o",
            "ControlMaster=no",
            "-o",
            "ControlPath=" + (controlPath ?? "none"),
          ]),
      ...(url.port ? ["-p", url.port] : []),
      `${decodeURIComponent(url.username)}@${url.hostname}`,
      ["docker", ...args].map(quote).join(" "),
    ],
  ];
}
export function dockerCommand(config, args) {
  if (config.transport !== "ssh-cli")
    return ["docker", contextArguments(config, args)];
  const endpoint = execFileSync(
    "docker",
    contextArguments(config, [
      "context",
      "inspect",
      ...(config.context ? [config.context] : []),
      "--format",
      "{{.Endpoints.docker.Host}}",
    ]),
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
  return sshDockerCommand(endpoint, args, {
    multiplexing: config.sshMultiplexing !== false,
    controlPath: config.sshControlPath,
  });
}
export function dockerOutput(config, args) {
  const [cmd, argv] = dockerCommand(config, args);
  return execFileSync(cmd, argv, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}
export function docker(config, args) {
  const [cmd, argv] = dockerCommand(config, args);
  return execute(cmd, argv);
}
export async function sendDirectory(config, args, directory) {
  const [cmd, argv] = dockerCommand(config, args);
  const tar = spawn(
    "tar",
    [
      "--format=ustar",
      "--no-xattrs",
      "--no-acls",
      "-C",
      directory,
      "-cf",
      "-",
      ".",
    ],
    {
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
  const child = spawn(cmd, argv, { stdio: ["pipe", "inherit", "inherit"] });
  await Promise.all([
    pipeline(tar.stdout, child.stdin),
    finished(tar),
    finished(child),
  ]);
}
export async function receiveDirectory(config, args, directory) {
  const [cmd, argv] = dockerCommand(config, args);
  const temporary = await mkdtemp(
    join(tmpdir(), "lapis-notes-validation-report-"),
  );
  try {
    const archive = join(temporary, "reports.tar");
    const child = spawn(cmd, argv, { stdio: ["ignore", "pipe", "inherit"] });
    // BSD tar can exit at the end marker before Docker finishes archive padding.
    // Drain and validate the complete transfer before asking tar to extract it.
    await Promise.all([
      pipeline(child.stdout, createWriteStream(archive)),
      finished(child),
    ]);
    await execute("tar", ["-C", directory, "-xf", archive]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
function finished(child) {
  return new Promise((accept, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? accept() : reject(Error(`Docker transfer exited ${code}`)),
    );
  });
}
