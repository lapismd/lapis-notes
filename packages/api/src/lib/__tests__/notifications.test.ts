import { describe, expect, it } from "vitest";
import { NotificationManager } from "../notifications";
import type { AppDatabaseNotificationRecord } from "../storage/app-database";

class TestNotificationDatabase {
  private records: AppDatabaseNotificationRecord[] = [];

  async listNotifications(): Promise<AppDatabaseNotificationRecord[]> {
    return this.records
      .filter((record) => !record.cleared)
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((record) => ({ ...record }));
  }

  async upsertNotification(
    record: AppDatabaseNotificationRecord,
  ): Promise<void> {
    this.records = [
      { ...record },
      ...this.records.filter((entry) => entry.id !== record.id),
    ];
  }

  async markNotificationRead(id: string): Promise<void> {
    this.records = this.records.map((record) =>
      record.id === id
        ? { ...record, read: true, updatedAt: Date.now() }
        : record,
    );
  }

  async clearNotification(id: string): Promise<void> {
    this.records = this.records.map((record) =>
      record.id === id
        ? { ...record, cleared: true, updatedAt: Date.now() }
        : record,
    );
  }

  async clearAllNotifications(): Promise<void> {
    this.records = this.records.map((record) => ({
      ...record,
      cleared: true,
      updatedAt: Date.now(),
    }));
  }
}

function createManager() {
  const database = new TestNotificationDatabase();
  return {
    database,
    manager: new NotificationManager(database),
  };
}

describe("NotificationManager", () => {
  it("persists durable notifications and can mark or clear them", async () => {
    const { database, manager } = createManager();

    const record = manager.notify({
      title: "Index failed",
      message: "Could not update embeddings",
      severity: "error",
      source: "Search",
      persist: true,
    });

    await manager.markRead(record.id);
    expect(manager.list()).toMatchObject([{ id: record.id, read: true }]);

    const restored = new NotificationManager(database);
    await restored.loadPersisted();
    expect(restored.list()).toMatchObject([{ id: record.id, read: true }]);

    await restored.clear(record.id);
    expect(restored.list()).toEqual([]);
  });

  it("tracks accumulated and determinate progress", () => {
    const { manager } = createManager();
    const progress = manager.createProgress({
      title: "Refreshing metadata",
      cancellable: true,
    });

    progress.report({ increment: 25, message: "Scanning" });
    expect(manager.activeProgress[0]).toMatchObject({
      id: progress.id,
      current: 25,
      total: 100,
      percent: 25,
      message: "Scanning",
      indeterminate: false,
    });

    progress.report({ current: 4, total: 8 });
    expect(manager.activeProgress[0]).toMatchObject({
      current: 4,
      total: 8,
      percent: 50,
    });

    progress.complete();
    expect(manager.activeProgress).toEqual([]);
  });

  it("aborts cancellable progress handles cooperatively", () => {
    const { manager } = createManager();
    const progress = manager.createProgress({
      title: "Running notebook",
      cancellable: true,
    });

    manager.cancel(progress.id);

    expect(progress.signal.aborted).toBe(true);
    expect(manager.activeProgress[0]).toMatchObject({
      status: "cancelling",
      cancelRequested: true,
    });
    expect(() => progress.throwIfCancellationRequested()).toThrow(
      "Operation cancelled",
    );
  });

  it("withProgress completes successful work and removes active state", async () => {
    const { manager } = createManager();

    const result = await manager.withProgress(
      { title: "Rebuilding search" },
      async (progress) => {
        progress.report({ current: 1, total: 2 });
        return "done";
      },
    );

    expect(result).toBe("done");
    expect(manager.activeProgress).toEqual([]);
  });

  it("withProgress persists failed work as an error notification", async () => {
    const { manager } = createManager();

    await expect(
      manager.withProgress({ title: "Refresh", source: "Metadata" }, () => {
        throw new Error("bad cache");
      }),
    ).rejects.toThrow("bad cache");

    expect(manager.activeProgress).toEqual([]);
    expect(manager.list()).toMatchObject([
      {
        title: "Refresh",
        message: "bad cache",
        severity: "error",
        source: "Metadata",
        read: false,
      },
    ]);
  });
});
