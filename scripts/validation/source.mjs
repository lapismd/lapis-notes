import { execFileSync, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  realpath,
} from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { pipeline } from "node:stream/promises";
import { hash, validateArchives } from "./model.mjs";
import { exportNativeSources } from "./native-sources.mjs";
const jj = (root, args) =>
  execFileSync("jj", ["--no-pager", "--color=never", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
export function snapshotFile(root, revision, path) {
  return execFileSync(
    "jj",
    ["--no-pager", "file", "show", "-r", revision, "--", path],
    {
      cwd: root,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
}
export async function snapshot(root, directory, archiveManifest, options = {}) {
  await mkdir(directory, { recursive: true });
  const revision = jj(root, [
    "log",
    "-r",
    "@",
    "--no-graph",
    "-T",
    "commit_id",
  ]);
  const parents = jj(root, [
    "log",
    "-r",
    `${revision}-`,
    "--no-graph",
    "-T",
    'commit_id ++ "\\n"',
  ])
    .split("\n")
    .filter(Boolean);
  const base = process.env.LAPIS_NOTES_CHECK_BASE;
  if (base && !/^[a-f0-9]{40,64}$/.test(base))
    throw Error("Validation base must be an exact commit");
  const files = jj(root, ["file", "list", "-r", revision]).split("\n");
  if (
    files.some((file) =>
      /^(?:\.local|\.env|node_modules|target)(?:\/|$)/.test(file),
    )
  )
    throw Error(
      "Private/local files must not be tracked in the source snapshot",
    );
  const gitDirectory = jj(root, ["git", "root"]);
  const pack = spawn(
    "git",
    ["--git-dir", gitDirectory, "pack-objects", "--revs", "--stdout"],
    {
      cwd: root,
      stdio: ["pipe", "pipe", "inherit"],
    },
  );
  const done = new Promise((accept, reject) => {
    pack.once("error", reject);
    pack.once("exit", (code) =>
      code === 0 ? accept() : reject(Error("Source object export failed")),
    );
  });
  pack.stdin.end([revision, ...(base ? [base] : [])].join("\n") + "\n");
  await Promise.all([
    pipeline(pack.stdout, createWriteStream(join(directory, "source.pack"))),
    done,
  ]);
  const archives = [];
  if (archiveManifest) {
    const manifest = await realpath(resolve(root, archiveManifest));
    const entries = validateArchives(
      JSON.parse(await readFile(manifest, "utf8")),
    );
    for (const [index, entry] of entries.entries()) {
      const source = resolve(dirname(manifest), entry.path);
      const bytes = await readFile(source);
      if (hash(bytes) !== entry.sha256)
        throw Error(`Archive checksum mismatch: ${entry.name}`);
      const path = `package-${index}.tgz`;
      await copyFile(source, join(directory, path));
      archives.push({ ...entry, path });
    }
  }
  const manifest = {
    schema: 1,
    nativeSources: options.native
      ? await exportNativeSources(root, directory, options.sourceRoots)
      : [],
    revision,
    parents,
    base,
    fileCount: files.length,
    archives,
    packSha256: hash(await readFile(join(directory, "source.pack"))),
  };
  await writeFile(
    join(directory, "source.json"),
    JSON.stringify(manifest, null, 2),
  );
  return manifest;
}
