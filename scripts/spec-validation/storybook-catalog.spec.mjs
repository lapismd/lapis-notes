import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validate } from "./storybook-catalog.mjs";

function withStories(files, callback) {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "lapis-story-source-"));
  try {
    for (const [relativePath, source] of Object.entries(files)) {
      const absolutePath = path.join(repoRoot, relativePath);
      mkdirSync(path.dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, source);
    }
    callback(validate({ model: { repoRoot } }));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

const meta = `
import ButtonDemo from "./ButtonDemo.svelte";
const meta = { title: "API/Button", component: ButtonDemo };
export default meta;
`;

test("accepts explicit source supplied by an invoked local helper", () => {
  withStories(
    {
      "stories/Button.stories.ts": `${meta}
import { storyMeta } from "./story-meta";
export const Default = { ...storyMeta(source) };
`,
      "stories/story-meta.ts": `
export function storyMeta(source: string) {
  return { parameters: { docs: { source: {
    code: source,
    language: "svelte",
    type: "code",
  } } } };
}
`,
    },
    (findings) => assert.deepEqual(findings, []),
  );
});

test("reports an Autodocs demo boundary without explicit source", () => {
  withStories(
    { "stories/Button.stories.ts": `${meta}\nexport const Default = {};\n` },
    (findings) => {
      assert.deepEqual(
        findings.map((finding) => finding.code),
        ["SPEC-STORY-SOURCE-MISSING"],
      );
      assert.equal(findings[0].rule, "LN-GOV-023");
      assert.equal(findings[0].file, "stories/Button.stories.ts");
    },
  );
});

test("requires all explicit source fields", () => {
  withStories(
    {
      "stories/Button.stories.ts": `${meta}
export const Default = {
  parameters: { docs: { source: { code: "<Button />", language: "svelte" } } },
};
`,
    },
    (findings) => {
      assert.deepEqual(
        findings.map((finding) => finding.code),
        ["SPEC-STORY-SOURCE-FIELDS"],
      );
      assert.equal(findings[0].rule, "LN-CAT-025");
    },
  );
});

test("rejects story-only component names and args in explicit code", () => {
  withStories(
    {
      "stories/Button.stories.ts": `${meta}
export const Default = {
  parameters: { docs: { source: {
    code: "<ButtonDemo value={args.value} />",
    language: "svelte",
    type: "code",
  } } },
};
`,
    },
    (findings) => {
      assert.deepEqual(
        findings.map((finding) => finding.code),
        ["SPEC-STORY-SOURCE-BOUNDARY"],
      );
      assert.equal(findings[0].rule, "LN-CAT-024");
    },
  );
});

test("rejects story-only boundaries hidden in example-source modules", () => {
  withStories(
    {
      "stories/Button.stories.ts": `${meta}
import { storyMeta } from "./story-meta";
export const Default = { ...storyMeta(source) };
`,
      "stories/story-meta.ts": `
export function storyMeta(source: string) {
  return { parameters: { docs: { source: {
    code: source,
    language: "svelte",
    type: "code",
  } } } };
}
`,
      "stories/Button.example-sources.ts":
        'export const source = "<ButtonDemo value={args.value} />";\n',
    },
    (findings) => {
      assert.deepEqual(
        findings.map((finding) => finding.code),
        ["SPEC-STORY-SOURCE-BOUNDARY"],
      );
      assert.equal(findings[0].file, "stories/Button.example-sources.ts");
    },
  );
});

test("checks the rendered content behind raw example-source imports", () => {
  withStories(
    {
      "stories/Button.stories.ts": `${meta}
import { storyMeta } from "./story-meta";
export const Default = { ...storyMeta(source) };
`,
      "stories/story-meta.ts": `
export function storyMeta(source: string) {
  return { parameters: { docs: { source: {
    code: source,
    language: "svelte",
    type: "code",
  } } } };
}
`,
      "stories/Button.example-sources.ts":
        'import source from "./ButtonExample.svelte?raw";\nexport { source };\n',
      "stories/ButtonExample.svelte": "<ButtonHarness />\n",
    },
    (findings) => {
      assert.deepEqual(
        findings.map((finding) => finding.code),
        ["SPEC-STORY-SOURCE-BOUNDARY"],
      );
      assert.equal(findings[0].file, "stories/Button.example-sources.ts");
    },
  );
});

test("exempts stories explicitly excluded from Autodocs", () => {
  withStories(
    {
      "stories/Acceptance.stories.ts": `${meta}
const tags = ["!autodocs", "test"];
export const Default = { tags };
`,
    },
    (findings) => assert.deepEqual(findings, []),
  );
});
