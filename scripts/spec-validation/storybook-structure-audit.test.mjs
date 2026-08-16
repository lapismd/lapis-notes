import assert from "node:assert/strict";
import test from "node:test";

import { auditPluginPanels } from "./storybook-structure-audit.mjs";

const family = {
  kind: "fixture",
  plugin: "Fixture",
  panel: "Panel",
  commandId: "fixture:open-panel",
  commandToken: 'id: "open-panel"',
  sourceFile: "src/plugin.ts",
  storyFile: "stories/plugins/fixture/panels/Panel.stories.ts",
};

const placements = [
  { exportName: "MiddleTopTabs", title: "Middle (Top Tabs)" },
  { exportName: "LeftSidebar", title: "Left Sidebar" },
];

function audit(files, families = [family]) {
  return auditPluginPanels({
    families,
    placements,
    readOptional(file) {
      return files.get(file) ?? null;
    },
  });
}

const validStory = `
export default {
  title: "Plugins/Fixture/Panels/Panel",
  tags: ["visual-pending", "test"],
};
export const MiddleTopTabs = {};
export const LeftSidebar = {};
`;

test("accepts a mapped command panel with every required placement", () => {
  const findings = audit(
    new Map([
      [family.sourceFile, 'const command = { id: "open-panel" };'],
      [family.storyFile, validStory],
    ]),
  );

  assert.deepEqual(findings, []);
});

test("rejects missing stories and stale command mappings", () => {
  const findings = audit(
    new Map([[family.sourceFile, "const commands = [];"]]),
  );

  assert.deepEqual(
    findings.map((entry) => entry.code),
    ["STORYBOOK-PANEL-COMMAND-STALE", "STORYBOOK-PANEL-SOURCE-MISSING"],
  );
});

test("rejects the wrong taxonomy, missing placements, and absent visual status", () => {
  const findings = audit(
    new Map([
      [family.sourceFile, 'const command = { id: "open-panel" };'],
      [
        family.storyFile,
        'export default { title: "Workspace/Panels/Fixture" };\nexport const MiddleTopTabs = {};',
      ],
    ]),
  );

  assert.deepEqual(
    findings.map((entry) => entry.code),
    [
      "STORYBOOK-PANEL-TITLE",
      "STORYBOOK-PANEL-PLACEMENT-MISSING",
      "STORYBOOK-PANEL-VISUAL-STATUS",
    ],
  );
});

test("rejects duplicate command and story mappings", () => {
  const duplicate = { ...family, kind: "duplicate" };
  const findings = audit(
    new Map([
      [family.sourceFile, 'const command = { id: "open-panel" };'],
      [family.storyFile, validStory],
    ]),
    [family, duplicate],
  );

  assert.deepEqual(
    findings.map((entry) => entry.code),
    ["STORYBOOK-PANEL-MAPPING-DUPLICATE", "STORYBOOK-PANEL-MAPPING-DUPLICATE"],
  );
});
