import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rename, rm, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeDocsManifest } from "./docs-artifact.mjs";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repositoryRoot = path.resolve(packageRoot, "../..");
const args = process.argv.slice(2).filter((arg) => arg !== "--");
if (args.length !== 2 || args[0] !== "--output")
  throw new Error("Usage: pnpm docs:export --output <new artifact directory>");
const destination = path.resolve(args[1]);
const revisionResult = spawnSync(
  "jj",
  [
    "--no-pager",
    "log",
    "-r",
    "heads(::@ & ~empty())",
    "--no-graph",
    "-T",
    "commit_id",
  ],
  { cwd: repositoryRoot, encoding: "utf8" },
);
if (
  revisionResult.status !== 0 ||
  !/^[a-f0-9]{40}$/.test(revisionResult.stdout.trim())
)
  throw new Error("A Jujutsu source revision is required");
const revision = revisionResult.stdout.trim();
const manifest = JSON.parse(
  await readFile(path.join(packageRoot, "package.json"), "utf8"),
);
const temporary = await mkdtemp(path.join(os.tmpdir(), "lapis-api-export-"));
try {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "typedoc",
      "--options",
      "typedoc.json",
      "--out",
      temporary,
      "--gitRevision",
      revision,
    ],
    { cwd: packageRoot, stdio: "inherit" },
  );
  if (result.status !== 0)
    throw new Error(`TypeDoc export failed (${result.status})`);
  await writeDocsManifest(temporary, {
    packageName: manifest.name,
    version: manifest.version,
    repository: "https://github.com/lapismd/lapis-notes",
    revision,
  });
  await mkdir(path.dirname(destination), { recursive: true });
  // Never remove an existing reviewed artifact or partially replace it on failure.
  await rename(temporary, destination);
  process.stdout.write(
    `Exported ${manifest.name}@${manifest.version} (${revision}) to ${destination}\n`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
