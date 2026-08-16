import assert from "node:assert/strict";
import test from "node:test";

import { auditSource } from "./view-command-audit.mjs";

test("rejects an unclassified view registration", () => {
  const findings = auditSource(
    'class Plugin { onload() { this.registerView("fixture", createView); } }',
  );

  assert.deepEqual(
    findings.map((entry) => entry.code),
    ["VIEW-COMMAND-ACCESS-MISSING"],
  );
});

test("rejects malformed command metadata", () => {
  const findings = auditSource(
    'class Plugin { onload() { this.registerView("fixture", createView, { kind: "command", command: { id: "show-fixture", name: "Show fixture", callback() {} } }); } }',
  );

  assert.deepEqual(
    findings.map((entry) => entry.code),
    ["VIEW-COMMAND-OPEN-SHAPE", "VIEW-COMMAND-OPEN-SHAPE"],
  );
});

test("accepts file, internal, and alias exceptions in Svelte scripts", () => {
  const findings = auditSource(
    `<script lang="ts">
      class Plugin {
        onload() {
          this.registerView("file", createView, { kind: "file" });
          this.registerView("landing", createView, { kind: "internal" });
          this.registerSidebarView("alias", createView, {}, { kind: "alias", canonicalViewType: "canonical" });
        }
      }
    </script>`,
    "fixture.svelte",
  );

  assert.deepEqual(findings, []);
});
