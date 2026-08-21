import { describe, expect, it } from "vitest";
import {
  matchesTaskQuery,
  TASK_OCCURRENCE_PROJECTION_FIELDS,
  TASK_PROJECTION_VERSION,
  type AppDatabaseTaskRecord,
} from "./task-projection";

function task(
  overrides: Partial<AppDatabaseTaskRecord> = {},
): AppDatabaseTaskRecord {
  return {
    documentPath: "tasks/example.md",
    documentId: "task-1",
    kind: "task",
    title: "Example",
    status: "open",
    inbox: false,
    startKind: "anytime",
    checklistTotal: 0,
    checklistCompleted: 0,
    commentCount: 0,
    projectionVersion: TASK_PROJECTION_VERSION,
    ...overrides,
  };
}

describe("task projection recurrence fields", () => {
  it("keeps only carried overdue occurrences in Review", () => {
    expect(
      matchesTaskQuery(
        task({
          effectiveOccurrenceDate: "2026-08-19",
          effectiveOccurrenceState: "overdue",
          effectiveForDate: "2026-08-21",
        }),
        { view: "review", today: "2026-08-21" },
      ),
    ).toBe(true);
    expect(
      matchesTaskQuery(
        task({
          effectiveOccurrenceDate: "2026-08-22",
          effectiveOccurrenceState: "future",
          effectiveForDate: "2026-08-21",
        }),
        { view: "review", today: "2026-08-21" },
      ),
    ).toBe(false);
  });

  it("shows one future effective occurrence in Upcoming", () => {
    const recurring = task({
      planDate: "2026-08-01",
      effectiveOccurrenceDate: "2026-08-24",
      effectiveOccurrenceState: "future",
      effectiveForDate: "2026-08-21",
    });
    expect(
      matchesTaskQuery(recurring, { view: "upcoming", today: "2026-08-21" }),
    ).toBe(true);
    expect(
      matchesTaskQuery(recurring, { view: "today", today: "2026-08-21" }),
    ).toBe(false);
  });

  it("defines disposable daily observation fields", () => {
    expect(TASK_OCCURRENCE_PROJECTION_FIELDS).toMatchObject({
      taskId: { type: "string", indexed: true },
      occurrenceDate: { type: "date", indexed: true },
      outcome: { type: "string", indexed: true },
      sourceStart: { type: "number" },
      sourceEnd: { type: "number" },
    });
  });
});
