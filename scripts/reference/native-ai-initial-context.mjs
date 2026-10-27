// SPDX-License-Identifier: Apache-2.0
// Freeze complete results from unchanged Desktop exports, never another engine.
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const revision = "6c6243202e05b04e57de0a737829ca3a48e3ed3e";
const root = process.cwd();
const git = execFileSync("jj", ["git", "root"], { encoding: "utf8" }).trim();
const desktop =
  process.env.LAPIS_CONTEXT_REFERENCE_ROOT ??
  join(dirname(dirname(git)), "lapis-desktop");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const sources = [];
for (const path of [
  "src/lib/ai/runtimes/acp/initial-context.ts",
  "src/lib/ai/skills/manifest.ts",
]) {
  const pinned = execFileSync("jj", ["file", "show", "-r", revision, path], {
    cwd: desktop,
  });
  const current = await readFile(join(desktop, path));
  if (!pinned.equals(current)) throw Error(`Reference changed: ${path}`);
  sources.push({ path, sha256: hash(pinned) });
}
const { initialAcpContext } = await import(
  pathToFileURL(join(desktop, sources[0].path))
);
const { buildAvailableSkillsManifest } = await import(
  pathToFileURL(join(desktop, sources[1].path))
);
const skill = (values = {}) => ({
  skillId: "vault:research",
  name: "research",
  description: "Find related notes.",
  version: "fnv1a:01234567",
  userInvocable: true,
  modelInvocable: true,
  ...values,
});
const activation = (values = {}) => ({
  skillId: "vault:research",
  skillName: "research",
  version: "fnv1a:01234567",
  source: "user",
  instructions: "Read only the selected notes.",
  ...values,
});
const snapshot = (skills) => ({
  id: "fixed-snapshot",
  createdAt: "2026-10-27T00:00:00.000Z",
  skills,
});
const outcome = (call) => {
  try {
    return { ok: true, value: call() };
  } catch (error) {
    return { ok: false, error: { name: error.name, message: error.message } };
  }
};
const manifestInputs = [
  [],
  [skill()],
  [skill({ modelInvocable: false })],
  [skill({ name: "zeta" }), skill({ name: "alpha" })],
  [
    skill({
      name: '<&" café 📝',
      description: '\r\nEvidence & <reference> "quoted"',
      skillId: 'id<&"',
      version: 'v<&"',
    }),
  ],
  [
    skill({ modelInvocable: false, name: "hidden" }),
    skill({ name: "visible" }),
  ],
];
const emptyDescription = skill({ description: "" });
const overhead = buildAvailableSkillsManifest(
  snapshot([emptyDescription]),
).length;
manifestInputs.push(
  [skill({ description: "x".repeat(8000 - overhead) })],
  [skill({ description: "x".repeat(8001 - overhead) })],
  [skill({ description: "📝".repeat(4000) })],
);
const manifest = manifestInputs.map((skills) => ({
  input: { skills },
  expected: outcome(() => buildAvailableSkillsManifest(snapshot(skills))),
}));
const initialInputs = [
  {},
  { metadata: { sessionBootstrap: "" } },
  { metadata: { sessionBootstrap: "  \r\n" } },
  { metadata: { sessionBootstrap: 'Exact café 📝\r\n<lapis> & "reference"' } },
  { skillSnapshot: snapshot([]) },
  { skillSnapshot: snapshot([skill()]) },
  { skillSnapshot: snapshot([skill({ modelInvocable: false })]) },
  { skillActivations: [] },
  { skillActivations: [activation()] },
  { skillActivations: [activation({ arguments: "" })] },
  {
    skillActivations: [
      activation({
        arguments: 'a<&>"\n\t\u2028📝',
        instructions: 'Use <notes> & evidence\r\n"quoted"',
      }),
    ],
  },
  {
    metadata: { sessionBootstrap: "Bootstrap" },
    skillSnapshot: snapshot([skill()]),
    skillActivations: [
      activation(),
      activation({ skillId: "other", arguments: "second" }),
    ],
  },
  { metadata: { sessionBootstrap: "x".repeat(65536) } },
  { metadata: { sessionBootstrap: "x".repeat(65537) } },
  { metadata: { sessionBootstrap: "📝".repeat(32768) } },
  { metadata: { sessionBootstrap: "📝".repeat(32769) } },
  { metadata: { sessionBootstrap: "€".repeat(50000) } },
  {
    skillSnapshot: snapshot(
      Array.from({ length: 128 }, () => skill({ modelInvocable: false })),
    ),
  },
  {
    skillSnapshot: snapshot(
      Array.from({ length: 129 }, () => skill({ modelInvocable: false })),
    ),
  },
  {
    skillActivations: Array.from({ length: 16 }, () =>
      activation({ instructions: "" }),
    ),
  },
  {
    skillActivations: Array.from({ length: 17 }, () =>
      activation({ instructions: "" }),
    ),
  },
  { skillActivations: [activation({ instructions: "x".repeat(65536) })] },
  { skillActivations: [activation({ instructions: "x".repeat(65537) })] },
  { skillActivations: [activation({ instructions: "📝".repeat(32768) })] },
  { skillActivations: [activation({ instructions: "📝".repeat(32769) })] },
  {
    skillSnapshot: snapshot([
      skill({ description: "x".repeat(8001 - overhead) }),
    ]),
  },
];
const aggregateBase = {
  skillActivations: [activation({ instructions: "", arguments: "" })],
};
const aggregateOverhead = Buffer.byteLength(initialAcpContext(aggregateBase));
for (const size of [131072 - aggregateOverhead, 131073 - aggregateOverhead]) {
  initialInputs.push({
    skillActivations: [
      activation({ instructions: "", arguments: "x".repeat(size) }),
    ],
  });
}
const initial = initialInputs.map((input) => ({
  input,
  expected: outcome(() => initialAcpContext(input)),
}));
const directory = join(root, "crates/lapis-app-core/tests/fixtures/ai-context");
await mkdir(directory, { recursive: true });
await writeFile(
  join(directory, "initial.json"),
  JSON.stringify(
    {
      schema: 1,
      reference: { repository: "lapis-desktop", revision, sources },
      manifest,
      initial,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    manifest: manifest.length,
    initial: initial.length,
    sources,
  }),
);
