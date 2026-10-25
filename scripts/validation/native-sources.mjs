import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { hash } from "./model.mjs";

export async function exportNativeSources(root, directory, roots = {}, pins) {
  pins ??= JSON.parse(
    await readFile(
      join(root, "scripts/validation/native-sources.json"),
      "utf8",
    ),
  );
  const git = execFileSync("jj", ["git", "root"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const siblingRoot = dirname(dirname(git));
  const sources = [];
  for (const pin of pins) {
    if (
      !/^[a-z][a-z0-9-]+$/.test(pin.name) ||
      !/^[a-f0-9]{40}$/.test(pin.revision)
    )
      throw Error("Native source requires a safe name and exact commit");
    const repository = roots[pin.name] ?? join(siblingRoot, pin.name);
    const actual = execFileSync(
      "jj",
      [
        "--no-pager",
        "log",
        "-r",
        pin.revision,
        "--no-graph",
        "-T",
        "commit_id",
      ],
      { cwd: repository, encoding: "utf8" },
    ).trim();
    if (actual !== pin.revision) throw Error("Native source revision mismatch");
    const store = execFileSync("jj", ["git", "root"], {
      cwd: repository,
      encoding: "utf8",
    }).trim();
    const bytes = execFileSync(
      "git",
      ["--git-dir", store, "archive", "--format=tar", actual],
      { maxBuffer: 256 * 1024 * 1024 },
    );
    const path = `${pin.name}.tar`;
    await writeFile(join(directory, path), bytes);
    sources.push({ ...pin, path, sha256: hash(bytes) });
  }
  return sources;
}

export async function restoreNativeSources(sources, input, parent) {
  const seen = new Set();
  for (const source of sources) {
    if (
      !/^[a-z][a-z0-9-]+$/.test(source.name) ||
      source.path !== `${source.name}.tar` ||
      seen.has(source.name)
    )
      throw Error("Invalid native source destination");
    seen.add(source.name);
    const archive = join(input, source.path);
    if (hash(await readFile(archive)) !== source.sha256)
      throw Error("Native source archive checksum mismatch");
    const entries = execFileSync("tar", ["-tf", archive], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    })
      .trim()
      .split("\n");
    if (
      entries.some(
        (entry) => entry.startsWith("/") || entry.split("/").includes(".."),
      )
    )
      throw Error("Unsafe native source archive path");
    const target = resolve(parent, source.name);
    await mkdir(target, { recursive: true });
    execFileSync("tar", ["-C", target, "-xf", archive]);
  }
}
