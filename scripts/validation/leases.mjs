import { label } from "./model.mjs";
import { docker, dockerOutput } from "./docker.mjs";

const defaults = { docker, output: dockerOutput };
const ids = (text) => text.split("\n").filter(Boolean);
export function completed(state) {
  return Boolean(
    state &&
      ["exited", "dead"].includes(state.Status) &&
      state.Running === false &&
      state.Paused === false &&
      state.Restarting === false,
  );
}
export function containerIdentity(config, id, kind, overrides = {}) {
  const io = { ...defaults, ...overrides };
  const record = JSON.parse(
    io.output(config, ["inspect", id, "--format", "{{json .}}"]),
  );
  if (
    !/^[a-f0-9]{64}$/.test(record.Id ?? "") ||
    (/^[a-f0-9]{64}$/.test(id) && id !== record.Id) ||
    record.Config?.Labels?.[label] !== kind
  )
    throw Error("Refusing an unowned validation container");
  return record;
}
function containers(config, kind, io, workspace) {
  return ids(
    io.output(config, [
      "ps",
      "-aq",
      "--no-trunc",
      "--filter",
      `label=${label}=${kind}`,
      ...(workspace
        ? ["--filter", `label=${label}.workspace=${workspace}`]
        : []),
    ]),
  );
}
function settled(config, workspace, io) {
  if (!/^[a-z0-9-]{1,64}$/.test(workspace ?? "")) return false;
  try {
    return containers(config, "run", io, workspace).every((id) => {
      const record = containerIdentity(config, id, "run", io);
      return (
        record.Config.Labels[`${label}.workspace`] === workspace &&
        completed(record.State)
      );
    });
  } catch {
    // An unreachable worker is not evidence that it stopped using the caches.
    return false;
  }
}
export async function releaseLease(config, id, overrides = {}) {
  const io = { ...defaults, ...overrides };
  let lease;
  try {
    lease = containerIdentity(config, id, "lease", io);
  } catch {
    return false;
  }
  if (!settled(config, lease.Config.Labels[`${label}.workspace`], io))
    return false;
  await io.docker(config, ["rm", lease.Id]);
  return true;
}
export async function withWorkspaceLease(
  config,
  workspace,
  image,
  operation,
  overrides = {},
) {
  const io = { ...defaults, warn: console.warn, ...overrides };
  const name = `lapis-notes-validation-lease-${workspace}`;
  const id = io.output(config, [
    "create",
    "--name",
    name,
    "--label",
    `${label}=lease`,
    "--label",
    `${label}.workspace=${workspace}`,
    image,
    "true",
  ]);
  try {
    return await operation();
  } finally {
    try {
      if (!(await releaseLease(config, id, io)))
        io.warn(
          `Lease retained: ${name}; worker state is active, prepared or unknown.`,
        );
    } catch (error) {
      io.warn(`Lease cleanup pending: ${name}: ${error.message}`);
    }
  }
}
function stopped(config, id, io) {
  try {
    const record = containerIdentity(config, id, "run", io);
    return completed(record.State) ? record : undefined;
  } catch {
    return undefined;
  }
}
export async function cleanOwned(config, args, overrides = {}) {
  const io = { ...defaults, ...overrides };
  const eligible = containers(config, "run", io).filter((id) =>
    stopped(config, id, io),
  );
  const leases = containers(config, "lease", io);
  const volumes = ids(
    io.output(config, [
      "volume",
      "ls",
      "-q",
      "--filter",
      `label=${label}=cache`,
    ]),
  );
  const result = {
    stoppedContainers: eligible,
    leaseContainers: leases,
    cacheVolumes: volumes,
    apply: args.includes("--apply"),
  };
  if (result.apply) {
    for (const id of eligible) {
      // Preview is not a continuing grant: recheck before collecting/removing.
      const record = stopped(config, id, io);
      if (!record) continue;
      await io.collect(config, record.Id);
      if (stopped(config, record.Id, io))
        await io.docker(config, ["rm", record.Id]);
    }
    for (const id of leases) await releaseLease(config, id, io);
    if (args.includes("--caches"))
      for (const volume of volumes)
        await io.docker(config, ["volume", "rm", volume]);
  }
  return result;
}
