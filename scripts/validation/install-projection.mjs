import { execFileSync } from "node:child_process";

/** Preserve pnpm's effective policy before adding private archive selections. */
export function projectPackage(
  root,
  pkg,
  archives,
  read = (directory) =>
    execFileSync("pnpm", ["config", "get", "overrides", "--json"], {
      cwd: directory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
) {
  const output = read(root).trim();
  let policy;
  try {
    policy = output === "undefined" ? {} : JSON.parse(output);
  } catch {
    throw Error("Cannot read effective dependency override policy");
  }
  if (
    !policy ||
    Array.isArray(policy) ||
    typeof policy !== "object" ||
    Object.values(policy).some((value) => typeof value !== "string")
  )
    throw Error("Invalid effective dependency override policy");
  return {
    ...pkg,
    devDependencies: { ...pkg.devDependencies, ...archives },
    pnpm: {
      ...pkg.pnpm,
      overrides: { ...policy, ...archives },
    },
  };
}
