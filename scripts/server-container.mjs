import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { context, repositoryBuildContext } from "./server-container/context.mjs";
import { validationConfig } from "./validation/model.mjs";
import { docker, dockerOutput, sendDirectory } from "./validation/docker.mjs";
import { json } from "./validation/paths.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
if (process.argv.slice(2).join(" ") !== "build")
  throw Error("Use node scripts/server-container.mjs build");
const run = join(root, ".local/server-container", randomUUID());
const output = join(run, "context");
await mkdir(output, { recursive: true });
const config = validationConfig(
  await json(join(root, ".local/validation/config.json"), {}),
);
const image = "lapis-server:rust-local";
const builder =
  `lapis-server-native-${config.cpus}-${config.memoryGiB}`.replaceAll(".", "-");
const receipt = {
  image,
  builder,
  resources: { cpus: config.cpus, memoryGiB: config.memoryGiB },
  started: new Date().toISOString(),
  status: "preparing",
};
try {
  receipt.inputs = await context(
    root,
    output,
    process.env.LAPIS_SERVER_ARCHIVES,
  );
  const buildContext = await repositoryBuildContext(output);
  receipt.status = "building";
  await writeFile(join(run, "receipt.json"), JSON.stringify(receipt, null, 2));
  try {
    dockerOutput(config, ["buildx", "inspect", builder]);
  } catch {
    await docker(config, [
      "buildx",
      "create",
      "--name",
      builder,
      "--driver",
      "docker-container",
      "--driver-opt",
      `memory=${config.memoryGiB}g,cpu-period=100000,cpu-quota=${Math.floor(config.cpus * 100000)}`,
    ]);
  }
  await sendDirectory(
    config,
    [
      "buildx",
      "build",
      "--builder",
      builder,
      "--load",
      "--progress=plain",
      "-f",
      "crates/lapis-server/Dockerfile",
      "-t",
      image,
      "-",
    ],
    buildContext,
  );
  receipt.status = "built";
  receipt.imageId = dockerOutput(config, [
    "image",
    "inspect",
    image,
    "--format",
    "{{.Id}}",
  ]);
} catch (error) {
  receipt.status = "failed";
  receipt.error = error.message;
  process.exitCode = 1;
} finally {
  try {
    await docker(config, ["buildx", "stop", builder]);
  } catch {
    /* Keep the original build failure in the receipt. */
  }
  receipt.finished = new Date().toISOString();
  await writeFile(
    join(run, "receipt.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  await rm(output, { recursive: true, force: true });
  console.log(`Native image receipt: ${join(run, "receipt.json")}`);
}
