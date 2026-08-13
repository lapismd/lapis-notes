import { describe, expect, it } from "vitest";
import {
  createRoleDocument,
  parseRoleDocument,
  patchRoleDocument,
} from "./role-document";

describe("role documents", () => {
  it("keeps the description in the Markdown body and normalizes role fields", () => {
    const content = createRoleDocument({
      id: "atlas-platform",
      company: "Atlas",
      title: "Platform Lead",
      description: "# Role\n\nBuild the platform.\n",
      now: new Date("2026-08-13T09:00:00.000Z"),
    });
    const parsed = parseRoleDocument("Roles/atlas-platform/role.md", content);

    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.role).toMatchObject({
      id: "atlas-platform",
      company: "Atlas",
      title: "Platform Lead",
      status: "saved",
      description: "# Role\n\nBuild the platform.\n",
      tags: [],
      contacts: [],
    });
    expect(parsed.role?.prep.comments.items).toEqual([]);
  });

  it("preserves unknown fields and an untouched body while patching", () => {
    const content = `---
schemaVersion: 1
id: atlas
company: Atlas
title: Lead
status: saved
sortOrder: 10
createdAt: 2026-08-01T00:00:00.000Z
updatedAt: 2026-08-01T00:00:00.000Z
custom:
  owner: steve
taskRefs:
  - task-legacy
prep:
  version: 3
  schemaVersion: 1
  stages: []
  comments:
    items: []
---
# Exact body

Keep **all** Markdown.
`;
    const next = patchRoleDocument(
      "Roles/atlas/role.md",
      content,
      { status: "applied", followUpAt: "2026-08-20" },
      undefined,
    );
    const parsed = parseRoleDocument("Roles/atlas/role.md", next);

    expect(parsed.role?.status).toBe("applied");
    expect(parsed.role?.followUpAt).toBe("2026-08-20");
    expect(parsed.frontmatter?.custom).toEqual({ owner: "steve" });
    expect(parsed.frontmatter?.taskRefs).toEqual(["task-legacy"]);
    expect(parsed.body).toBe("# Exact body\n\nKeep **all** Markdown.\n");
  });

  it("keeps malformed and incomplete source recoverable", () => {
    expect(parseRoleDocument("Roles/a/role.md", "# no frontmatter")).toMatchObject({
      role: null,
      diagnostics: [{ code: "missing-frontmatter" }],
    });
    expect(
      parseRoleDocument(
        "Roles/a/role.md",
        "---\nid: a\ncompany: Atlas\ntitle: Lead\nstatus: unknown\n---\nBody",
      ),
    ).toMatchObject({ role: null, diagnostics: [{ code: "invalid-status" }] });
  });
});

