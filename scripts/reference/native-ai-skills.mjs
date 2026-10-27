// Freeze original unchanged Desktop exports through explicit read-only ports.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { parseCases, discoveryCases } from "./native-skill-cases.mjs";
import { registryCases } from "./native-skill-registry-cases.mjs";
const revision = "6c6243202e05b04e57de0a737829ca3a48e3ed3e";
const git = execFileSync("jj", ["git", "root"], { encoding: "utf8" }).trim();
const desktop =
  process.env.LAPIS_CONTEXT_REFERENCE_ROOT ??
  join(dirname(dirname(git)), "lapis-desktop");
const sources = [];
for (const path of [
  "src/lib/ai/skills/parser.ts",
  "src/lib/ai/skills/discovery.ts",
  "src/lib/ai/skills/registry.ts",
  "src/lib/ai/skills/types.ts",
]) {
  const pinned = execFileSync("jj", ["file", "show", "-r", revision, path], {
    cwd: desktop,
  });
  if (!pinned.equals(await readFile(join(desktop, path))))
    throw Error(`Reference changed: ${path}`);
  sources.push({
    path,
    sha256: createHash("sha256").update(pinned).digest("hex"),
  });
}
const parser = await import(pathToFileURL(join(desktop, sources[0].path)));
const { SkillDiscovery } = await import(
  pathToFileURL(join(desktop, sources[1].path))
);
const { SkillRegistry } = await import(
  pathToFileURL(join(desktop, sources[2].path))
);
const apiPath = createRequire(join(desktop, "package.json")).resolve(
  "@lapis-notes/api/agent-skills",
);
const { SKILL_NAME_PATTERN } = await import(pathToFileURL(apiPath));
const undefinedValue = { $undefined: true };
async function outcome(call) {
  try {
    const value = await call();
    return { ok: true, value: value === undefined ? undefinedValue : value };
  } catch (error) {
    return {
      ok: false,
      error: {
        name: error.name,
        message: error.message,
        ...(error.path === undefined ? {} : { path: error.path }),
      },
    };
  }
}
function options(input, reads) {
  const files = new Map(input.files),
    lists = new Map(input.lists),
    values = input.sources;
  return {
    files,
    options: {
      vault: {
        getFilesByGlob(glob) {
          reads.push({ glob });
          return (lists.get(glob.replace(/\/\*\*\/SKILL\.md$/u, "")) ?? []).map(
            (path) => ({ path }),
          );
        },
        async cachedRead(file) {
          reads.push({ read: file.path });
          if (!files.has(file.path)) throw Error("Missing fixture file");
          return files.get(file.path);
        },
      },
      bundled: values.bundled,
      appSkills: { list: () => values.registered ?? [] },
      extensionFiles: new Map(
        (values.extensionFiles ?? []).map(([key, pairs]) => [
          key,
          Object.fromEntries(pairs),
        ]),
      ),
      extensionRootFor: (owner) =>
        new Map(values.extensionRoots ?? []).get(owner),
      userPrefix: values.userPrefix,
    },
  };
}
const parse = [];
for (const content of parseCases) {
  const input = {
    path: ".agents/skills/example/SKILL.md",
    source: "folder",
    root: ".agents/skills/example",
  };
  parse.push({
    content,
    input,
    version: parser.skillContentVersion(content),
    expected: await outcome(() => parser.parseSkillMarkdown(content, input)),
  });
}
const discovery = [];
for (const input of discoveryCases) {
  const reads = [],
    port = options(input, reads);
  discovery.push({
    input,
    expected: await outcome(() =>
      new SkillDiscovery(port.options).discover(input.context),
    ),
    reads,
  });
}
const OriginalDate = Date,
  createdAt = "2026-10-27T00:00:00.000Z";
globalThis.Date = class extends OriginalDate {
  constructor(...args) {
    super(...(args.length ? args : [createdAt]));
  }
};
let nonce = 0;
Object.defineProperty(globalThis.crypto, "randomUUID", {
  value: () => `00000000-0000-4000-8000-${String(++nonce).padStart(12, "0")}`,
});
const registryResults = [];
for (const input of registryCases) {
  nonce = 0;
  const reads = [],
    port = options(input.seed, reads),
    registry = new SkillRegistry(port.options),
    snapshots = [],
    outcomes = [];
  for (const step of input.steps) {
    outcomes.push(
      await outcome(async () => {
        switch (step.op) {
          case "snapshot": {
            const snapshot = await registry.snapshot(input.seed.context);
            snapshots.push(snapshot);
            return snapshot;
          }
          case "discover":
            return registry.discover(input.seed.context);
          case "modify":
            port.files.set(step.path, step.content);
            return;
          case "invalidate":
            registry.invalidate();
            return;
          case "diagnostics":
            return registry.diagnostics;
          case "getLoaded":
            return registry.getLoaded(step.name);
          case "loadSaved": {
            const entry = snapshots[step.snapshot].skills[0];
            return registry.load(entry.skillId, entry.version);
          }
          case "load":
            return registry.load(
              step.id,
              step.version ?? snapshots[step.versionFrom].skills[0].version,
            );
          case "activate":
            return registry.activate(
              step.name,
              input.seed.context,
              step.source,
              step.arguments,
            );
          default:
            throw Error("Unknown fixture operation");
        }
      }),
    );
  }
  registryResults.push({ input, expected: outcomes, reads });
}
const destination =
  "crates/lapis-app-core/tests/fixtures/ai-context/skills.json";
await writeFile(
  destination,
  JSON.stringify(
    {
      schema: 1,
      reference: {
        repository: "lapis-desktop",
        revision,
        sources,
        namePattern: SKILL_NAME_PATTERN.source,
        apiExportSha256: createHash("sha256")
          .update(await readFile(apiPath))
          .digest("hex"),
      },
      parse,
      discovery,
      registry: registryResults,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    parse: parse.length,
    discovery: discovery.length,
    registry: registryResults.length,
    sources,
  }),
);
