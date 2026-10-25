#!/usr/bin/env node
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { root, localRoot, json } from "./validation/paths.mjs";
import { validationConfig, label } from "./validation/model.mjs";
import { execute } from "./validation/process.mjs";
import { image } from "./validation/images.mjs";
import { owned, collect, remoteRun } from "./validation/runs.mjs";
import {
  docker,
  dockerOutput as output,
  contextArguments,
} from "./validation/docker.mjs";
export async function runNative(lane, args = [], directory = root) {
  const lanes = await json(
    join(directory, "scripts/validation/lanes.json"),
    {},
  );
  if (!Object.hasOwn(lanes, lane))
    throw Error(`Unknown validation lane: ${lane}`);
  await execute(
    "/bin/sh",
    ["-c", lanes[lane] + ' "$@"', "validation", ...args],
    {
      cwd: directory,
      env: {
        ...process.env,
        LAPIS_NOTES_VALIDATION_RUNTIME: "native",
        PATH: join(directory, "node_modules/.bin") + ":" + process.env.PATH,
      },
    },
  );
}
export const dockerArguments = contextArguments;
export async function main(argv = process.argv.slice(2)) {
  if (argv[0] === "--") argv.shift();
  const [command, ...args] = argv;
  const config = validationConfig(
    await json(join(localRoot, "config.json"), {}),
  );
  if (command === "run") {
    const [lane, ...rest] = args;
    if (rest[0] === "--") rest.shift();
    const lanes = await json(join(root, "scripts/validation/lanes.json"), {});
    if (!Object.hasOwn(lanes, lane))
      throw Error(`Unknown validation lane: ${lane}`);
    if (
      config.runtime === "native" ||
      process.env.LAPIS_NOTES_VALIDATION_WORKER === "1"
    )
      return runNative(lane, rest);
    return remoteRun(config, lane, rest);
  }
  if (command === "images") {
    const selected = args.includes("--target")
      ? args[args.indexOf("--target") + 1]
      : "ui";
    if (!["ui", "full"].includes(selected)) throw Error("Invalid image target");
    for (const target of [selected])
      console.log(await image(config, target, args.includes("--rebuild")));
    return;
  }
  if (command === "doctor") {
    const info = JSON.parse(output(config, ["info", "--format", "{{json .}}"]));
    console.log({
      config,
      daemon: {
        name: info.Name,
        architecture: info.Architecture,
        cpus: info.NCPU,
        memory: info.MemTotal,
      },
    });
    return;
  }
  if (command === "collect") return collect(config, args[0]);
  if (command === "stop") {
    await owned(config, args[0]);
    return docker(config, ["stop", "--time", "15", args[0]]);
  }
  if (command === "clean") {
    const containers = output(config, [
      "ps",
      "-aq",
      "--filter",
      `label=${label}=run`,
    ])
      .split("\n")
      .filter(Boolean);
    const leases = output(config, [
      "ps",
      "-aq",
      "--filter",
      `label=${label}=lease`,
    ])
      .split("\n")
      .filter(Boolean);
    const eligible = containers.filter(
      (id) =>
        output(config, ["inspect", id, "--format", "{{.State.Running}}"]) ===
        "false",
    );
    const volumes = output(config, [
      "volume",
      "ls",
      "-q",
      "--filter",
      `label=${label}=cache`,
    ])
      .split("\n")
      .filter(Boolean);
    console.log({
      stoppedContainers: eligible,
      leaseContainers: leases,
      cacheVolumes: volumes,
      apply: args.includes("--apply"),
    });
    if (args.includes("--apply")) {
      for (const id of eligible) {
        await collect(
          config,
          output(config, ["inspect", id, "--format", "{{.Name}}"]).slice(1),
        );
        await docker(config, ["rm", id]);
      }
      for (const id of leases) {
        const workspace = output(config, [
          "inspect",
          id,
          "--format",
          `{{index .Config.Labels "${label}.workspace"}}`,
        ]);
        const active = output(config, [
          "ps",
          "-q",
          "--filter",
          `label=${label}=run`,
          "--filter",
          `label=${label}.workspace=${workspace}`,
        ]);
        if (!active) await docker(config, ["rm", id]);
      }
      if (args.includes("--caches"))
        for (const volume of volumes)
          await docker(config, ["volume", "rm", volume]);
    }
    return;
  }
  throw Error(
    "Use run <lane>, images [--rebuild], doctor, collect <run>, stop <run>, or clean [--apply] [--caches]",
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
