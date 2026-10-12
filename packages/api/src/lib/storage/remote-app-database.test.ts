import { describe, expect, it } from "vitest";

import {
  REMOTE_APP_DATABASE_CONTRACT,
  REMOTE_APP_DATABASE_MAX_ARGUMENTS,
  REMOTE_APP_DATABASE_METHODS,
  isRemoteAppDatabaseMethod,
  parseRemoteAppDatabaseArgs,
} from "./remote-app-database";

describe("remote AppDatabase contract", () => {
  it("provides one contract entry for every allowlisted method", () => {
    expect(Object.keys(REMOTE_APP_DATABASE_CONTRACT)).toEqual([
      ...REMOTE_APP_DATABASE_METHODS,
    ]);
    expect(new Set(REMOTE_APP_DATABASE_METHODS).size).toBe(
      REMOTE_APP_DATABASE_METHODS.length,
    );
  });

  it("rejects unknown methods and oversized argument lists", () => {
    expect(isRemoteAppDatabaseMethod("searchDocuments")).toBe(true);
    expect(isRemoteAppDatabaseMethod("open")).toBe(false);
    expect(() =>
      parseRemoteAppDatabaseArgs(
        "getMeta",
        Array.from({ length: REMOTE_APP_DATABASE_MAX_ARGUMENTS + 1 }),
      ),
    ).toThrow("Invalid or oversized AppDatabase arguments");
  });

  it("classifies the procedure catalogue by stable domain", () => {
    expect(REMOTE_APP_DATABASE_CONTRACT.searchDocuments.domain).toBe("search");
    expect(REMOTE_APP_DATABASE_CONTRACT.queryTasks.domain).toBe("tasks");
    expect(REMOTE_APP_DATABASE_CONTRACT.queryProjection.domain).toBe(
      "projections",
    );
    expect(REMOTE_APP_DATABASE_CONTRACT.getMeta.domain).toBe("metadata");
  });
});
