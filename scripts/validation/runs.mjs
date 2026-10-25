import { readFile, writeFile, mkdir, rm, open } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { root, localRoot, json } from "./paths.mjs";
import { hash, imageKey, laneImage, label } from "./model.mjs";
import { image } from "./images.mjs";
import { containerIdentity, completed, withWorkspaceLease } from "./leases.mjs";
import { snapshot, snapshotFile } from "./source.mjs";
import { execute } from "./process.mjs";
import {
  docker,
  dockerCommand,
  dockerOutput as output,
  sendDirectory,
  receiveDirectory,
} from "./docker.mjs";
export async function owned(config, name) {
  return containerIdentity(config, name, "run");
}
export async function collect(config, name) {
  const record = await owned(config, name);
  name = record.Name?.replace(/^\//, "");
  if (!/^lapis-notes-validation-[a-z0-9-]+$/.test(name))
    throw Error("Invalid run identity");
  const directory = join(localRoot, "runs", name);
  await mkdir(directory, { recursive: true });
  await receiveDirectory(
    config,
    ["cp", `${record.Id}:/results/.`, "-"],
    directory,
  );
  const log = await open(join(directory, "container.log"), "w");
  try {
    const [command, args] = dockerCommand(config, ["logs", record.Id]);
    await execute(command, args, { stdio: ["ignore", log.fd, log.fd] });
  } finally {
    await log.close();
  }
  console.log(`Reports: ${directory}`);
  return directory;
}
async function performRun(config, lane, args, selected, workspace) {
  const lanes = await json(join(root, "scripts/validation/lanes.json"), {});
  if (!Object.hasOwn(lanes, lane))
    throw Error(`Unknown validation lane: ${lane}`);
  const name = `lapis-notes-validation-${randomUUID()}`;
  const directory = join(localRoot, "runs", name),
    input = join(directory, "input");
  await mkdir(input, { recursive: true });
  const source = await snapshot(root, input, config.archives, {
    native: selected.target === "full",
    sourceRoots: config.sourceRoots,
  });
  const request = {
    run: name,
    lane,
    args,
    image: selected.id,
    imageTarget: selected.target,
    workspace,
    resources: {
      cpus: config.cpus,
      memoryGiB: config.memoryGiB,
      shmGiB: config.shmGiB,
    },
  };
  await writeFile(
    join(input, "request.json"),
    JSON.stringify(request, null, 2),
  );
  for (const file of [
    "worker.mjs",
    "model.mjs",
    "process.mjs",
    "native-sources.mjs",
  ])
    await writeFile(
      join(input, file),
      snapshotFile(root, source.revision, `scripts/validation/${file}`),
    );
  const dependencies = imageKey({
    image: selected.id,
    lock: hash(await readFile(join(root, "pnpm-lock.yaml"))),
    archives: JSON.stringify(source.archives),
    nativeSources: JSON.stringify(source.nativeSources),
  });
  const volumes = [
    ["pnpm", "/cache/pnpm"],
    ["deno", "/cache/deno"],
    ["turbo", "/work/lapis-notes/.turbo"],
  ];
  if (selected.target === "full")
    volumes.push(
      ["cargo", "/cache/cargo"],
      ["rust", "/work/lapis-notes/.local/rust-core-target"],
      ["native", "/work/lapis-notes/packages/server-native/target"],
    );
  const mountArgs = [];
  for (const [key, destination] of volumes) {
    const volume = `lapis-notes-validation-${workspace}-${dependencies}-${key}`;
    await docker(config, [
      "volume",
      "create",
      "--label",
      `${label}=cache`,
      volume,
    ]);
    mountArgs.push(
      "--mount",
      `type=volume,source=${volume},target=${destination}`,
    );
  }
  const runId = output(config, [
    "create",
    "--name",
    name,
    "--init",
    "--cap-drop=ALL",
    "--label",
    `${label}=run`,
    "--label",
    `${label}.workspace=${workspace}`,
    "--cpus",
    String(config.cpus),
    "--memory",
    `${config.memoryGiB}g`,
    "--shm-size",
    `${config.shmGiB}g`,
    "-e",
    "npm_config_store_dir=/cache/pnpm",
    ...mountArgs,
    selected.tag,
    "node",
    "/input/worker.mjs",
  ]);
  let interrupted = false;
  const cancel = () => {
    interrupted = true;
    void docker(config, ["stop", "--time", "15", runId]).catch((error) =>
      console.error(error.message),
    );
  };
  process.on("SIGINT", cancel);
  process.on("SIGTERM", cancel);
  try {
    await sendDirectory(config, ["cp", "-", `${runId}:/input`], input);
    let collected = false;
    try {
      await docker(config, ["start", "--attach", runId]);
    } finally {
      try {
        await collect(config, runId);
        collected = true;
      } catch (error) {
        console.error(`Collection pending for ${name}: ${error.message}`);
      }
    }
    const state = JSON.parse(
      output(config, ["inspect", runId, "--format", "{{json .State}}"]),
    );
    if (interrupted || !completed(state) || state.ExitCode !== 0)
      throw Error(
        `${lane} ${interrupted ? "interrupted" : `failed (${state.ExitCode})`}; run ${name}`,
      );
    if (!collected) throw Error(`Reports not collected; retained run ${name}`);
    await docker(config, ["rm", runId]);
  } finally {
    process.off("SIGINT", cancel);
    process.off("SIGTERM", cancel);
    await rm(input, { recursive: true, force: true });
  }
}
export async function remoteRun(config, lane, args) {
  const selected = await image(config, laneImage(lane));
  const workspace = hash(root).slice(0, 16);
  if (
    output(config, [
      "ps",
      "-q",
      "--filter",
      `${"label=" + label}=run`,
      "--filter",
      `${"label=" + label}.workspace=${workspace}`,
    ])
  )
    throw Error("This workspace already has an active remote validation run");
  return withWorkspaceLease(config, workspace, selected.tag, () =>
    performRun(config, lane, args, selected, workspace),
  );
}
