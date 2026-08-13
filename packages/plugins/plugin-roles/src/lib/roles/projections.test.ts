import { describe, expect, it } from "vitest";
import { buildRoleActions, moveRoleAction, transitionRoleStatus } from "./actions";
import { buildRoleActivityEvents, groupRoleActivityByDay } from "./activity";
import type { RoleRecord } from "./types";

function role(patch: Partial<RoleRecord> = {}): RoleRecord {
  return {
    schemaVersion: 1,
    id: "atlas",
    company: "Atlas",
    title: "Lead",
    status: "applied",
    sortOrder: 0,
    sourcePath: "Roles/atlas/role.md",
    tags: [],
    contacts: [],
    pinned: false,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-10T09:00:00.000Z",
    reactions: [],
    prep: { version: 3, schemaVersion: 1, stages: [], comments: { items: [] } },
    description: "",
    ...patch,
  };
}

describe("role projections", () => {
  it("derives task-free action columns and a seven-day contacted window", () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    const actions = buildRoleActions(
      [
        role({ id: "late", followUpAt: "2026-08-12" }),
        role({ id: "today", followUpAt: "2026-08-13" }),
        role({ id: "waiting", followUpAt: undefined }),
        role({ id: "done", lastContactedAt: "2026-08-06T10:00:00.000Z" }),
        role({ id: "old", lastContactedAt: "2026-08-05T10:00:00.000Z" }),
      ],
      now,
    );

    expect(actions.map((action) => [action.roleId, action.kind, action.columnId])).toEqual([
      ["late", "follow_up", "overdue"],
      ["today", "follow_up", "today"],
      ["waiting", "waiting", "waiting"],
      ["done", "contacted", "done"],
      ["old", "waiting", "waiting"],
    ]);
    expect(actions.some((action) => (action.kind as string) === "task")).toBe(false);
  });

  it("maps action movement to role frontmatter patches", () => {
    const action = buildRoleActions(
      [role({ followUpAt: "2026-08-14" })],
      new Date("2026-08-13T12:00:00.000Z"),
    )[0]!;
    expect(moveRoleAction(action, "waiting", new Date("2026-08-13T12:00:00.000Z"))).toMatchObject({
      followUpAt: undefined,
      postponedBy: "roles:actions",
    });
    expect(
      transitionRoleStatus(action.role, "rejected", new Date("2026-08-13T12:00:00.000Z")),
    ).toMatchObject({
      status: "rejected",
      closedAt: "2026-08-13T12:00:00.000Z",
      closedBy: "roles:actions",
    });
    expect(moveRoleAction(action, "done", new Date("2026-08-13T12:00:00.000Z"))).toMatchObject({
      followUpAt: undefined,
      lastContactedAt: "2026-08-13T12:00:00.000Z",
    });
  });

  it("groups activity by local day and reports missing-day gaps", () => {
    const groups = groupRoleActivityByDay(
      buildRoleActivityEvents([
        role({
          createdAt: "2026-08-01T09:00:00.000Z",
          updatedAt: "2026-08-10T09:00:00.000Z",
          appliedAt: "2026-08-10T08:00:00.000Z",
        }),
      ]),
    );
    expect(groups.map((group) => [group.date, group.gapDays])).toEqual([
      ["2026-08-10", 0],
      ["2026-08-01", 8],
    ]);
    expect(groups[0]?.events.map((event) => event.kind)).toEqual(["updated", "applied"]);
  });
});
