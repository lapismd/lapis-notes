import { readFileSync, lstatSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";
import semver from "semver";

export const policyPath = ".github/dependency-automation/canonical-intake.json";
export const expectedPolicy = {
  schemaVersion: 2,
  kind: "workspace-dependency-intake",
  repository: "lapismd/lapis-notes",
  slot: "framework-registry",
  dependencies: ["@lapismd/design-core"],
  manifests: [
    "package.json",
    "packages/api/package.json",
    "packages/app-profile/package.json",
    "packages/file-explorer/package.json",
    "packages/ui/package.json",
    "packages/web/package.json",
    "packages/workspace/package.json",
  ],
  chapters: [
    "spec/src/architecture/dependency-boundaries.md",
    "spec/src/packages/app-and-services.md",
    "spec/src/plugin-model/application-services.md",
    "spec/src/server-node-host/core-contract.md",
    "spec/src/ui-and-styling/core-contract.md",
    "spec/src/web-host/startup-and-plugins.md",
    "spec/src/workspace-shell/catalog-acceptance.md",
  ],
  lockClosure: "registry-transitives",
};
const sections = [
  "dependencies",
  "optionalDependencies",
  "devDependencies",
  "peerDependencies",
];
const fail = (reason) => {
  throw Error(`Notes canonical dependency intake: ${reason}`);
};

// Notes verifies its actual source data, without importing the shared writer.
export function verifyCanonicalIntake({ read }) {
  const policy = JSON.parse(read(policyPath));
  if (!isDeepStrictEqual(policy, expectedPolicy))
    fail("source opt-in changed or unsupported");
  const lock = YAML.parse(read("pnpm-lock.yaml"));
  const workspace = YAML.parse(read("pnpm-workspace.yaml"));
  const facts = {
    schemaVersion: 2,
    repository: policy.repository,
    manifests: {},
  };
  const rows = [];
  const identities = new Set();
  for (const [importer, entry] of Object.entries(lock.importers ?? {}))
    for (const type of sections)
      for (const name of policy.dependencies)
        if (
          entry[type]?.[name] &&
          !policy.manifests.includes(
            importer === "." ? "package.json" : `${importer}/package.json`,
          )
        )
          fail("undeclared active importer");
  for (const path of [...policy.manifests].sort()) {
    const manifest = JSON.parse(read(path));
    const importer = path === "package.json" ? "." : path.slice(0, -13);
    const selected = {};
    for (const type of sections)
      for (const name of [...policy.dependencies].sort()) {
        const declared = manifest[type]?.[name];
        if (declared === undefined) continue;
        if (typeof declared !== "string") fail("invalid declared dependency");
        const range = declared.startsWith("catalog:")
          ? (declared.slice(8)
              ? workspace.catalogs?.[declared.slice(8)]
              : workspace.catalog)?.[name]
          : declared;
        if (
          typeof range !== "string" ||
          !semver.validRange(range) ||
          /^(?:workspace|file|link|https?|git|npm):/.test(range)
        )
          fail("non-registry or invalid range");
        let version = null,
          integrity = null;
        if (type !== "peerDependencies") {
          const entry = lock.importers?.[importer]?.[type]?.[name];
          version =
            typeof entry?.version === "string"
              ? entry.version.split("(")[0]
              : null;
          const resolution = lock.packages?.[`${name}@${version}`]?.resolution;
          integrity = resolution?.integrity;
          if (
            !semver.valid(version) ||
            semver.prerelease(version) ||
            !semver.satisfies(version, range) ||
            !(
              entry.specifier === declared ||
              (declared.startsWith("catalog:") && entry.specifier === range)
            ) ||
            !/^sha512-[A-Za-z0-9+/]{86}==$/.test(integrity ?? "") ||
            Object.keys(resolution ?? {}).some((key) => key !== "integrity")
          )
            fail("manifest/lock registry coordinates disagree");
          identities.add(`${name}@${version}`);
        }
        (selected[type] ??= {})[name] = { declared, range, version, integrity };
        rows.push([
          `${path} (${type})`,
          name,
          range,
          version ?? "Peer support",
        ]);
      }
    if (!Object.keys(selected).length)
      fail("selected manifest has no Core edge");
    facts.manifests[path] = selected;
  }
  if (identities.size !== policy.dependencies.length)
    fail("multiple or missing registry identities");
  const digest = createHash("sha256")
    .update(JSON.stringify(facts))
    .digest("hex");
  const start = `<!-- dependency-intake:${policy.slot}:start -->`;
  const end = `<!-- dependency-intake:${policy.slot}:end -->`;
  for (const path of policy.chapters) {
    const text = read(path);
    if (
      text.split(start).length !== 2 ||
      text.split(end).length !== 2 ||
      text.indexOf(end) < text.indexOf(start)
    )
      fail(`missing or ambiguous slot: ${path}`);
    const body = text.slice(
      text.indexOf(start) + start.length,
      text.indexOf(end),
    );
    const lines = body.trim().split("\n");
    const fingerprints = [
      ...body.matchAll(
        /Manifest, peer and integrity facts SHA256: `([a-f0-9]{64})`\./g,
      ),
    ];
    const table = lines.filter((line) => line.startsWith("|"));
    const cells = (line) =>
      line
        .slice(1, -1)
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim().replaceAll("`", "").replaceAll("\\|", "|"));
    if (
      lines[0] !==
        "Current registry dependency coordinates; qualification remains separate." ||
      fingerprints.length !== 1 ||
      fingerprints[0][1] !== digest ||
      !isDeepStrictEqual(cells(table[0] ?? ""), [
        "Manifest",
        "Dependency",
        "Range",
        "Locked version",
      ]) ||
      !isDeepStrictEqual(cells(table[1] ?? ""), ["---", "---", "---", "---"]) ||
      !isDeepStrictEqual(table.slice(2).map(cells), rows)
    )
      fail(`stale or malformed facts: ${path}`);
    const rest = lines.filter(
      (line) =>
        line.trim() &&
        !line.startsWith("|") &&
        line !== lines[0] &&
        line !== "<!-- prettier-ignore -->" &&
        line !== fingerprints[0]?.[0],
    );
    if (rest.length) fail(`manual content inside managed slot: ${path}`);
    if (text.split("\n").length > 400 || Buffer.byteLength(text) > 32768)
      fail(`oversized chapter: ${path}`);
  }
  return { facts, digest, chapters: policy.chapters.length };
}

export function checkCanonicalIntake(root = process.cwd()) {
  return verifyCanonicalIntake({
    read(path) {
      const file = resolve(root, path);
      if (!lstatSync(file).isFile() || realpathSync(file) !== file)
        fail("non-regular source input");
      return readFileSync(file, "utf8");
    },
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = checkCanonicalIntake();
  console.log(
    `Notes dependency intake: ${result.chapters} canonical areas match current registry facts (${result.digest}).`,
  );
}
