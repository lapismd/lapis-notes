import { execFileSync, spawnSync } from "node:child_process";

export const LGTM_IMAGE = "grafana/otel-lgtm";
export const LGTM_PORTS = ["3000", "4317", "4318"];

function readErrorText(error) {
  return `${error?.stdout ?? ""}\n${error?.stderr ?? ""}`;
}

function inspectLgtm(runCommand) {
  try {
    const output = runCommand("docker", ["inspect", "lgtm"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const containers = JSON.parse(output);
    return containers[0] ?? null;
  } catch (error) {
    if (
      error?.status === 1 &&
      /no such (?:object|container)/iu.test(readErrorText(error))
    ) {
      return null;
    }
    throw new Error(`Unable to inspect the lgtm container: ${readErrorText(error).trim()}`);
  }
}

function validateRunningContainer(container) {
  const problems = [];
  if (container.Config?.Image !== LGTM_IMAGE) {
    problems.push(`image is ${container.Config?.Image ?? "unknown"}`);
  }
  if (!container.State?.Running) problems.push("container is not running");
  if (container.State?.Health && container.State.Health.Status !== "healthy") {
    problems.push(`health is ${container.State.Health.Status}`);
  }
  for (const port of LGTM_PORTS) {
    const bindings = container.NetworkSettings?.Ports?.[`${port}/tcp`] ?? [];
    if (!bindings.some((binding) => binding.HostPort === port)) {
      problems.push(`host port ${port} is not mapped`);
    }
  }
  if (problems.length > 0) {
    throw new Error(
      `A container named lgtm already exists but is not the expected local stack: ${problems.join(
        "; ",
      )}. Refusing to replace it.`,
    );
  }
}

export function runLgtm({
  runCommand = execFileSync,
  runForeground = spawnSync,
  log = console.log,
} = {}) {
  const existing = inspectLgtm(runCommand);
  if (existing) {
    validateRunningContainer(existing);
    log("Grafana LGTM is already running at http://localhost:3000");
    return 0;
  }

  const result = runForeground(
    "docker",
    [
      "run",
      "--name",
      "lgtm",
      "-p",
      "3000:3000",
      "-p",
      "4317:4317",
      "-p",
      "4318:4318",
      "--rm",
      LGTM_IMAGE,
    ],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  return result.status ?? 0;
}
