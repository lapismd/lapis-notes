import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import semver from "semver";
import { classifySpecFirstChanges } from "@lapismd/spec-validator";
import config from "../spec-validator.config.mjs";
import {
  assertValidPublicVersion,
  readPublicPackages,
} from "./public-packages.mjs";

export const versionVerificationPage = "spec/src/verification/pkg-02.md";
export const versionSpecChapters = [
  "spec/src/packages/release-canonical-intake.md",
  "spec/src/architecture/dependency-boundaries.md",
  "spec/src/plugin-model/application-services.md",
  "spec/src/web-host/startup-and-plugins.md",
  "spec/src/ui-and-styling/core-contract.md",
  "spec/src/workspace-shell/view-lifecycle.md",
  "spec/src/workspace-shell/panels/problems/core-contract.md",
  "spec/src/editor-demo/core-contract-01.md",
  "spec/src/plugins/explorer/index.md",
  versionVerificationPage,
];
const start = "<!-- notes-release-versions:start -->";
const end = "<!-- notes-release-versions:end -->";
const fail = (
  reason,
  path = "scripts/release-spec-versions.mjs",
  rule = "LN-PKG-198",
) => {
  throw Error(
    `RELEASE-SPEC-VERSIONS ${rule} ${path}:1 — Canonical release versions held: ${reason}; repair the declared source facts before preparing versions.`,
  );
};

export function renderVersionFacts(facts) {
  return `${start}\n\n\`\`\`json\n${JSON.stringify(facts, null, 2)}\n\`\`\`\n\n${end}`;
}

export function sourceVersionFacts(root = process.cwd()) {
  const result = Object.fromEntries(
    versionSpecChapters.map((path) => [
      path,
      { schemaVersion: 1, packages: {} },
    ]),
  );
  for (const entry of readPublicPackages(root)) {
    const manifestPath = `packages/${entry.directory}/package.json`;
    if (entry.manifest.name !== entry.name || entry.manifest.private === true)
      fail("unexpected public package identity", manifestPath, "LN-PKG-197");
    try {
      assertValidPublicVersion(entry.name, entry.version);
    } catch {
      fail("invalid public source version", manifestPath, "LN-PKG-197");
    }
    result[versionVerificationPage].packages[entry.name] = entry.version;
    const classification = classifySpecFirstChanges(
      [
        `packages/${entry.directory}/package.json`,
        `packages/${entry.directory}/CHANGELOG.md`,
      ],
      config.validators.specFirst,
    );
    if (
      classification.unmappedProductionFiles.length ||
      !classification.requiredChapters.length
    )
      fail(
        "unmapped public package",
        "spec-validator.config.mjs",
        "LN-PKG-197",
      );
    for (const required of classification.requiredChapters) {
      const matches = versionSpecChapters.filter((path) =>
        required.startsWith("pattern:")
          ? new RegExp(required.slice(8)).test(path)
          : required === path,
      );
      if (matches.length !== 1)
        fail(
          "missing or ambiguous canonical topic coverage",
          "spec-validator.config.mjs",
          "LN-PKG-197",
        );
      result[matches[0]].packages[entry.name] = entry.version;
    }
  }
  for (const [path, facts] of Object.entries(result)) {
    if (!Object.keys(facts.packages).length)
      fail("unused canonical topic", path, "LN-PKG-197");
    facts.packages = Object.fromEntries(
      Object.entries(facts.packages).sort(([a], [b]) => a.localeCompare(b)),
    );
  }
  return result;
}

function currentFacts(section, expected, path) {
  const match = section.match(
    /^<!-- notes-release-versions:start -->\n\n```json\n([\s\S]+)\n```\n\n<!-- notes-release-versions:end -->$/,
  );
  if (!match) fail("malformed managed section", path);
  let facts;
  try {
    facts = JSON.parse(match[1]);
  } catch {
    fail("invalid managed JSON", path);
  }
  if (
    !facts ||
    typeof facts !== "object" ||
    Array.isArray(facts) ||
    !isDeepStrictEqual(Object.keys(facts).sort(), [
      "packages",
      "schemaVersion",
    ]) ||
    facts.schemaVersion !== 1 ||
    !facts.packages ||
    typeof facts.packages !== "object" ||
    Array.isArray(facts.packages) ||
    !isDeepStrictEqual(
      Object.keys(facts.packages).sort(),
      Object.keys(expected.packages).sort(),
    ) ||
    Object.values(facts.packages).some(
      (v) => typeof v !== "string" || !semver.valid(v),
    ) ||
    renderVersionFacts(facts) !== section
  )
    fail("unknown managed shape or authored content", path);
  return facts;
}

export async function syncVersionSpec({
  root = process.cwd(),
  write = false,
} = {}) {
  root = await realpath(root);
  const expected = sourceVersionFacts(root),
    outputs = [];
  for (const [path, facts] of Object.entries(expected)) {
    const file = resolve(root, path);
    if (!(await lstat(file)).isFile() || (await realpath(file)) !== file)
      fail("canonical topic must be a regular owned file", path);
    const source = await readFile(file, "utf8");
    if (
      source.split(start).length !== 2 ||
      source.split(end).length !== 2 ||
      source.indexOf(end) < source.indexOf(start)
    )
      fail("missing or ambiguous managed markers", path);
    const begin = source.indexOf(start),
      finish = source.indexOf(end) + end.length;
    const current = currentFacts(source.slice(begin, finish), facts, path);
    if (
      Object.entries(facts.packages).some(([name, version]) =>
        semver.lt(version, current.packages[name]),
      )
    )
      fail("source version regression", path);
    const output =
      source.slice(0, begin) + renderVersionFacts(facts) + source.slice(finish);
    const lines = output.split("\n").length - Number(output.endsWith("\n"));
    if (lines > 400 || Buffer.byteLength(output) > 32768)
      fail("canonical topic exceeds line or byte limits", path);
    if (output !== source) outputs.push({ path, file, source: output });
  }
  if (!write && outputs.length)
    fail("stale canonical source versions", outputs[0].path, "LN-PKG-197");
  // Validate every source and output before the first bounded write.
  if (write)
    for (const output of outputs) await writeFile(output.file, output.source);
  return outputs.map(({ path }) => path);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !["--check", "--write"].includes(args[0]))
      fail("use --check or --write");
    const changed = await syncVersionSpec({ write: args[0] === "--write" });
    console.log(
      `Canonical source versions verified; ${changed.length} page(s) updated.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
