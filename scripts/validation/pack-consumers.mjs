import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { hash } from "./model.mjs";
import { execute } from "./process.mjs";
const root = process.cwd();
const directories = [
  "api",
  "ui",
  "workspace",
  "file-explorer",
  "language-service",
  "app-profile",
];
const output = resolve(root, ".release/validation-packages");
await mkdir(output, { recursive: true });
const revision =
  process.env.LAPIS_NOTES_CHECK_REVISION ??
  execFileSync("jj", ["log", "-r", "@", "--no-graph", "-T", "commit_id"], {
    encoding: "utf8",
  }).trim();
const packages = await Promise.all(
  directories.map(async (directory) => ({
    directory,
    ...JSON.parse(
      await readFile(join(root, "packages", directory, "package.json"), "utf8"),
    ),
  })),
);
await execute(
  "pnpm",
  [
    "exec",
    "turbo",
    "run",
    "build",
    ...packages.map((pkg) => `--filter=${pkg.name}`),
    "--concurrency=2",
  ],
  { cwd: root },
);
const archives = [];
for (const pkg of packages) {
  await execute(
    "pnpm",
    [
      "--dir",
      join(root, "packages", pkg.directory),
      "pack",
      "--config.ignore-scripts=true",
      "--pack-destination",
      output,
    ],
    { cwd: root },
  );
  const path = `${pkg.name.replace(/^@/, "").replace("/", "-")}-${pkg.version}.tgz`;
  const bytes = await readFile(join(output, path));
  const identity = JSON.parse(
    execFileSync("tar", ["-xOf", join(output, path), "package/package.json"], {
      encoding: "utf8",
    }),
  );
  if (identity.name !== pkg.name || identity.version !== pkg.version)
    throw Error("Consumer archive identity mismatch");
  archives.push({
    name: pkg.name,
    version: pkg.version,
    path,
    sha256: hash(bytes),
  });
}
await writeFile(
  join(output, "archives.json"),
  JSON.stringify(archives, null, 2) + "\n",
);
await writeFile(
  join(output, "provenance.json"),
  JSON.stringify(
    { purpose: "local-consumer-qualification", revision, archives },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${archives.length} local qualification archives from ${revision}.`,
);
