import { describe, expect, it, vi } from "vitest";
import { FileEditingNativeIssues } from "../file-editing-native-issues";
import type {
  NativeEditingIssue,
  NativeRegisteredEditingSession,
} from "../native-editing-session";

const issue = (
  overrides: Partial<NativeEditingIssue> = {},
): NativeEditingIssue => ({
  id: "captured-issue",
  path: "Note.md",
  phase: "admission",
  status: "failed",
  message: "Offline",
  ...overrides,
});

function fixture(initial: NativeEditingIssue | undefined = issue()) {
  let current = initial;
  const listeners = new Set<() => void>();
  const session = {
    get issue() {
      return current;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } as NativeRegisteredEditingSession;
  const registry = new FileEditingNativeIssues();
  return {
    registry,
    session,
    set issue(value: NativeEditingIssue | undefined) {
      current = value;
      for (const listener of listeners) listener();
    },
  };
}

describe("local native editing issues", () => {
  it("observes pending, failed and cleared admission without retrying", () => {
    const f = fixture(issue({ status: "pending" }));
    const retry = vi.fn();
    const changed = vi.fn();
    const stop = f.registry.register("Note.md", f.session, retry);
    const unsubscribe = f.registry.subscribe(changed);
    expect(f.registry.entries[0]?.status).toBe("pending");
    f.issue = issue();
    expect(f.registry.entries[0]?.status).toBe("failed");
    f.issue = undefined;
    expect(f.registry.entries).toEqual([]);
    expect(changed).toHaveBeenCalledTimes(3);
    expect(retry).not.toHaveBeenCalled();
    stop();
    unsubscribe();
  });

  it("refuses retry while admission remains pending", async () => {
    const f = fixture(issue({ status: "pending" }));
    const retry = vi.fn();
    f.registry.register("Note.md", f.session, retry);
    await expect(f.registry.retry(f.registry.entries[0]!)).rejects.toThrow(
      "changed",
    );
    expect(retry).not.toHaveBeenCalled();
  });

  it("does not turn a cached pending action into a later failed retry", async () => {
    const f = fixture(issue({ status: "pending" }));
    const retry = vi.fn();
    f.registry.register("Note.md", f.session, retry);
    const pending = f.registry.entries[0]!;
    f.issue = issue();
    await expect(f.registry.retry(pending)).rejects.toThrow("changed");
    expect(retry).not.toHaveBeenCalled();
  });

  it("revalidates the captured issue when its guarded queue starts", async () => {
    const f = fixture();
    let start!: () => Promise<void>;
    f.registry.register(
      "Note.md",
      f.session,
      (check) =>
        new Promise<void>((resolve, reject) => {
          start = async () => {
            try {
              check();
              resolve();
            } catch (error) {
              reject(error);
            }
          };
        }),
    );
    const retry = f.registry.retry(f.registry.entries[0]!);
    f.issue = issue({ id: "newer-issue" });
    await start();
    await expect(retry).rejects.toThrow("changed");
  });

  it("joins the registration-owned guarded retry for an exact failed issue", async () => {
    const f = fixture();
    const retry = vi.fn(async (check: () => void) => {
      check();
      f.issue = undefined;
    });
    f.registry.register("Note.md", f.session, retry);
    await f.registry.retry(f.registry.entries[0]!);
    expect(retry).toHaveBeenCalledOnce();
    expect(f.registry.entries).toEqual([]);
  });

  it("cannot reuse a removed registration's cached action", async () => {
    const f = fixture();
    const retry = vi.fn(async () => {});
    const remove = f.registry.register("Note.md", f.session, retry);
    const captured = f.registry.entries[0]!;
    remove();
    f.registry.register("Note.md", f.session, retry);
    await expect(f.registry.retry(captured)).rejects.toThrow("changed");
    expect(retry).not.toHaveBeenCalled();
    expect(f.registry.entries[0]?.registration).not.toBe(captured.registration);
  });
});
