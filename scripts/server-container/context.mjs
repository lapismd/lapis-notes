import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, rm, readdir, rename } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  exportNativeSources,
  restoreNativeSources,
} from "../validation/native-sources.mjs";
import { hash, validateArchives } from "../validation/model.mjs";

/** Stage a Notes-checkout build context. Pinned siblings stay path dependencies. */
export async function repositoryBuildContext(output) {
  const notes = join(output, "lapis-notes");
  const inputs = join(notes, ".image-inputs");
  await mkdir(join(inputs, "siblings"), { recursive: true });
  for (const entry of await readdir(output)) {
    if (entry === "lapis-notes") continue;
    const target =
      entry === ".qualification"
        ? join(inputs, "qualification")
        : join(inputs, "siblings", entry);
    await rename(join(output, entry), target);
  }
  return notes;
}

/** Export tracked, exact inputs; never copy mutable sibling checkouts or secrets. */
export async function context(root, destination, manifest, options = {}) {
  const jj = (args) =>
    execFileSync("jj", ["--no-pager", ...args], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  const revision = jj(["log", "-r", "@", "--no-graph", "-T", "commit_id"]);
  const privateFile = (file) =>
    /^(?:\.local|\.env|node_modules|target)(?:\/|$)/u.test(file);
  if (jj(["file", "list", "-r", revision]).split("\n").some(privateFile))
    throw Error(
      "Private/local files must not be tracked in the container source",
    );
  const store = jj(["git", "root"]);
  const archive = execFileSync(
    "git",
    ["--git-dir", store, "archive", "--format=tar", revision],
    { maxBuffer: 256 * 1024 * 1024 },
  );
  const input = join(destination, ".qualification");
  await mkdir(input, { recursive: true });
  const source = {
    name: "lapis-notes",
    revision,
    path: "lapis-notes.tar",
    sha256: hash(archive),
  };
  await writeFile(join(input, source.path), archive);
  const native = await exportNativeSources(
    root,
    input,
    options.sourceRoots,
    options.nativePins,
  );
  const sources = [source, ...native];
  for (const entry of sources) {
    const files = execFileSync("tar", ["-tf", join(input, entry.path)], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    }).split("\n");
    if (files.some(privateFile))
      throw Error(
        "Private/local files must not be tracked in native container sources",
      );
  }
  await restoreNativeSources(sources, input, destination);
  for (const entry of sources) await rm(join(input, entry.path));
  const archives = [];
  if (manifest) {
    const path = resolve(root, manifest);
    for (const entry of validateArchives(
      JSON.parse(await readFile(path, "utf8")),
    )) {
      const original = resolve(dirname(path), entry.path);
      const bytes = await readFile(original);
      if (hash(bytes) !== entry.sha256)
        throw Error("Container public archive checksum mismatch");
      const target = `package-${archives.length}.tgz`;
      await writeFile(join(input, target), bytes);
      const identity = JSON.parse(
        execFileSync(
          "tar",
          ["-xOf", join(input, target), "package/package.json"],
          { encoding: "utf8" },
        ),
      );
      if (identity.name !== entry.name || identity.version !== entry.version)
        throw Error("Container public archive identity mismatch");
      archives.push({
        name: entry.name,
        version: entry.version,
        path: target,
        sha256: entry.sha256,
      });
    }
  }
  await writeFile(
    join(input, "archives.json"),
    JSON.stringify(archives, null, 2) + "\n",
  );
  return { schema: 1, source, native, archives };
}
