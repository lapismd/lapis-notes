import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const packageDir = path.resolve(import.meta.dirname, "..");
const releaseDir = path.join(packageDir, "release");
const packageJson = JSON.parse(
  await readFile(path.join(packageDir, "package.json"), "utf8"),
);
const platform = process.argv[2];

if (platform !== "mac" && platform !== "linux") {
  throw new Error("Usage: write-artifact-metadata.mjs <mac|linux>");
}

const artifactPattern =
  platform === "mac"
    ? /^Lapis-Notes-.+-mac-(arm64|x64)\.(dmg|zip)$/u
    : /^Lapis-Notes-.+-linux-(x64)\.(AppImage|tar\.gz)$/u;
const releaseFiles = await readdir(releaseDir);
const files = releaseFiles.filter((file) => artifactPattern.test(file));

if (!files.length) {
  throw new Error(`No ${platform} distribution artifacts found in ${releaseDir}`);
}

async function digest(file) {
  const contents = await readFile(path.join(releaseDir, file));
  return createHash("sha256").update(contents).digest("hex");
}

const artifacts = [];
for (const file of files.sort()) {
  const match = artifactPattern.exec(file);
  if (!match) continue;
  const blockmap = `${file}.blockmap`;
  const hasBlockmap = releaseFiles.includes(blockmap);
  artifacts.push({
    file,
    arch: match[1],
    format: match[2],
    bytes: (await stat(path.join(releaseDir, file))).size,
    sha256: await digest(file),
    ...(hasBlockmap
      ? {
          blockmap: {
            file: blockmap,
            bytes: (await stat(path.join(releaseDir, blockmap))).size,
            sha256: await digest(blockmap),
          },
        }
      : {}),
  });
}

const metadata = {
  schemaVersion: 1,
  productName: packageJson.productName,
  version: packageJson.version,
  platform,
  publication: "local-only",
  artifacts,
};
const output = `Lapis-Notes-${packageJson.version}-${platform}-artifacts.json`;
await writeFile(
  path.join(releaseDir, output),
  `${JSON.stringify(metadata, null, 2)}\n`,
);
console.log(`Wrote ${output} for ${artifacts.length} artifacts.`);
