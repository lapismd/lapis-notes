import { execFileSync } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

export async function nativePins(directory = root) {
  const pins = JSON.parse(
    await readFile(
      join(directory, "scripts/validation/native-sources.json"),
      "utf8",
    ),
  );
  if (
    !Array.isArray(pins) ||
    pins.length !== 6 ||
    new Set(pins.map((pin) => pin.name)).size !== pins.length ||
    pins.some(
      (pin) =>
        !/^[a-z][a-z0-9-]+$/u.test(pin.name ?? "") ||
        !/^[a-f0-9]{40}$/u.test(pin.revision ?? ""),
    )
  )
    throw Error(
      "CI requires six distinct native sources with immutable commit pins",
    );
  return pins;
}

export async function outputs(directory = root, environment = process.env) {
  if (!environment.GITHUB_OUTPUT)
    throw Error("CI pin outputs require GITHUB_OUTPUT");
  const pins = await nativePins(directory);
  await appendFile(
    environment.GITHUB_OUTPUT,
    pins
      .map((pin) => `${pin.name.replaceAll("-", "_")}=${pin.revision}\n`)
      .join(""),
  );
}

/** actions/checkout acquires commits; JJ exports only their tracked source. */
export async function initialize(
  directory = root,
  environment = process.env,
  run = execFileSync,
) {
  if (!/^[a-f0-9]{40}$/u.test(environment.GITHUB_SHA ?? ""))
    throw Error("Native CI requires the exact checked-out GITHUB_SHA");
  const sources = [
    { name: "lapis-notes", revision: environment.GITHUB_SHA, path: directory },
    ...(await nativePins(directory)).map((pin) => ({
      ...pin,
      path: join(dirname(directory), pin.name),
    })),
  ];
  for (const source of sources) {
    const actual = run("git", ["rev-parse", "HEAD"], {
      cwd: source.path,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (actual !== source.revision)
      throw Error(
        `CI source ${source.name} must be checked out at ${source.revision}; push the pinned commit and grant sibling-repository read access`,
      );
  }
  for (const source of sources)
    run(
      "jj",
      [
        "--no-pager",
        "--config",
        "signing.behavior=drop",
        "git",
        "init",
        "--colocate",
      ],
      { cwd: source.path, stdio: "inherit" },
    );
  const local = join(directory, ".local/validation");
  await mkdir(local, { recursive: true });
  await writeFile(
    join(local, "config.json"),
    JSON.stringify({ cpus: 4, memoryGiB: 12, shmGiB: 2 }) + "\n",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv[2] === "pins") await outputs();
  else if (process.argv[2] === "init") await initialize();
  else
    throw Error("Use node scripts/server-container/ci-sources.mjs pins|init");
}
