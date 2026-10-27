import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { projectPackage } from "../validation/install-projection.mjs";
import { hash, validateArchives } from "../validation/model.mjs";

export function install(folder, root = process.cwd(), run = execFileSync) {
  if (!folder)
    throw Error("An explicit container qualification folder is required");
  const archives = validateArchives(
    JSON.parse(readFileSync(join(folder, "archives.json"), "utf8")),
  );
  const original = readFileSync(join(root, "package.json")),
    lock = readFileSync(join(root, "pnpm-lock.yaml"));
  const overrides = {};
  for (const entry of archives) {
    if (
      !/^package-\d+\.tgz$/u.test(entry.path) ||
      hash(readFileSync(join(folder, entry.path))) !== entry.sha256
    )
      throw Error("Invalid qualified container archive");
    const identity = JSON.parse(
      execFileSync(
        "tar",
        ["-xOf", join(folder, entry.path), "package/package.json"],
        { encoding: "utf8" },
      ),
    );
    if (identity.name !== entry.name || identity.version !== entry.version)
      throw Error("Invalid qualified container package identity");
    overrides[entry.name] = "file:" + join(folder, entry.path);
  }
  try {
    if (archives.length)
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify(projectPackage(root, JSON.parse(original), overrides)),
      );
    run(
      "pnpm",
      [
        "install",
        archives.length ? "--no-frozen-lockfile" : "--frozen-lockfile",
        "--ignore-pnpmfile",
        "--ignore-scripts",
        "--store-dir",
        "/cache/pnpm",
      ],
      { cwd: root, stdio: "inherit" },
    );
  } finally {
    writeFileSync(join(root, "package.json"), original);
    writeFileSync(join(root, "pnpm-lock.yaml"), lock);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  install(process.argv[2]);
