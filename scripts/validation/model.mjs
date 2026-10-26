import { createHash } from "node:crypto";
export const label = "dev.lapismd.lapis-notes.validation";
export function validationConfig(local = {}, environment = process.env) {
  const config = {
    runtime: "docker",
    cpus: 8,
    memoryGiB: 24,
    shmGiB: 2,
    ...local,
  };
  config.runtime = environment.LAPIS_NOTES_VALIDATION_RUNTIME ?? config.runtime;
  config.context = environment.LAPIS_NOTES_VALIDATION_CONTEXT ?? config.context;
  config.archives =
    environment.LAPIS_NOTES_VALIDATION_ARCHIVES ?? config.archives;
  if (
    config.transport !== undefined &&
    !["docker", "ssh-cli"].includes(config.transport)
  )
    throw Error("Invalid Docker transport");
  if (!["docker", "native"].includes(config.runtime))
    throw Error("Invalid validation runtime");
  for (const key of ["cpus", "memoryGiB", "shmGiB"])
    if (!Number.isFinite(config[key]) || config[key] <= 0)
      throw Error(`Invalid ${key}`);
  if (
    config.context !== undefined &&
    (typeof config.context !== "string" || !config.context.trim())
  )
    throw Error("Invalid Docker context");
  return config;
}
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function imageKey(inputs) {
  return hash(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b)),
      ),
    ),
  ).slice(0, 20);
}
export function validateArchives(entries) {
  if (!Array.isArray(entries)) throw Error("Package archives must be an array");
  const seen = new Set();
  for (const entry of entries) {
    if (
      !/^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(entry.name ?? "") ||
      !/^\d+\.\d+\.\d+[-+\w.]*$/.test(entry.version ?? "") ||
      typeof entry.path !== "string" ||
      !entry.path.endsWith(".tgz") ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
    )
      throw Error("Invalid package archive identity, version, path or sha256");
    if (seen.has(entry.name)) throw Error(`Duplicate archive: ${entry.name}`);
    seen.add(entry.name);
  }
  return entries;
}
const nativeLanes = new Set([
  "validation:rust",
  "check",
  "check:all",
  "test",
  "build",
  "spec:check",
  "ci:release",
  "check:rust-core",
  "check:rust-boundaries",
  "check:protocol",
  "test:rust-core",
  "build:rust-core",
  "test:server:native",
  "test:server:tasks",
  "test:server:tasks:recovery",
  "test:server:tasks:references",
  "test:server:tasks:editors",
  "test:server:tasks:leave",
]);
export const laneImage = (lane) => (nativeLanes.has(lane) ? "full" : "ui");

/** Bound full-suite browser lifetime; explicit targets and caller shards stay exact. */
export function laneInvocations(lane, args) {
  return lane === "test:storybook" && args.length === 0
    ? Array.from({ length: 4 }, (_, index) => [`--shard=${index + 1}/4`])
    : [[...args]];
}
