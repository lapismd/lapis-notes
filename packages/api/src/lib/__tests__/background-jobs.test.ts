import { describe, expect, it, vi } from "vitest";
import {
  BackgroundJobSession,
  type BackgroundJobSnapshot,
  type NativeBackgroundJobs,
} from "../background-jobs";
import { isBackgroundJobDescriptor } from "../background-jobs-validation";

const snapshot: BackgroundJobSnapshot = {
  revision: 0,
  vaultId: "6c9a720b-21d6-46fd-8326-5640693cd1fd",
  nativeNotificationsAvailable: false,
  runnerId: "89b52d9a-2fe1-43f1-877f-09581c5533c6",
  trusted: true,
  safeMode: false,
  transfer: null,
  jobs: [
    {
      pluginId: "example",
      fingerprint: "a".repeat(64),
      configuration: null,
      phase: "paused",
      runs: [],
      nextRunAt: null,
      unavailableReason: null,
      descriptor: {
        id: "refresh",
        title: "Refresh",
        description: "Refresh saved metadata",
        entry: "jobs/refresh.js",
        schedule: { kind: "interval", seconds: 300 },
        permissions: {
          metadataRead: true,
          frontmatterRead: false,
          notifications: true,
          frontmatterFields: [],
        },
      },
    },
  ],
};

describe("native background job observation", () => {
  it("drains accepted transport on detach while preserving the native job owner", async () => {
    let release!: (value: BackgroundJobSnapshot) => void;
    const call = vi.fn(
      () =>
        new Promise<BackgroundJobSnapshot>((resolve) => {
          release = resolve;
        }),
    );
    const jobs = new BackgroundJobSession({ call });
    const pending = jobs.call({
      kind: "runNow",
      pluginId: "example",
      jobId: "refresh",
    });
    await Promise.resolve();
    const detached = jobs.detach();
    await expect(jobs.call({ kind: "list" })).rejects.toThrow(/detached/);
    release(snapshot);
    await pending;
    await detached;
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith({
      kind: "runNow",
      pluginId: "example",
      jobId: "refresh",
    });
  });

  it("retains an uncertain control failure without replaying it", async () => {
    const call = vi
      .fn<NativeBackgroundJobs["call"]>()
      .mockRejectedValue(new Error("Connection lost"));
    const jobs = new BackgroundJobSession({ call });
    await expect(
      jobs.call({ kind: "runNow", pluginId: "example", jobId: "refresh" }),
    ).rejects.toThrow("Connection lost");
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("pauses only the selected plugin and drains its accepted invocation", async () => {
    const running = structuredClone(snapshot);
    running.jobs[0].configuration = {
      fingerprint: running.jobs[0].fingerprint,
      schedule: running.jobs[0].descriptor.schedule,
      permissions: running.jobs[0].descriptor.permissions,
      enabled: true,
      nativeNotifications: false,
    };
    running.jobs[0].phase = "running";
    running.jobs.push({
      ...structuredClone(running.jobs[0]),
      pluginId: "other",
    });
    const paused = structuredClone(running);
    paused.jobs[0].configuration!.enabled = false;
    paused.jobs[0].phase = "paused";
    const call = vi
      .fn<NativeBackgroundJobs["call"]>()
      .mockResolvedValueOnce(running)
      .mockResolvedValueOnce(running)
      .mockResolvedValueOnce(running)
      .mockResolvedValue(paused);
    const jobs = new BackgroundJobSession({ call });
    await jobs.pausePlugin("example");
    expect(
      call.mock.calls.filter(([command]) => command.kind !== "list"),
    ).toEqual([[{ kind: "pause", pluginId: "example", jobId: "refresh" }]]);
    expect(jobs.snapshot?.jobs[0].phase).toBe("paused");
  });

  it("startup preserves native revocation and safe mode", async () => {
    const blocked = { ...snapshot, trusted: false, safeMode: true };
    const call = vi
      .fn<NativeBackgroundJobs["call"]>()
      .mockResolvedValue(blocked);
    const jobs = new BackgroundJobSession({ call });
    await jobs.initialize({ trusted: true, safeMode: false });
    expect(call.mock.calls).toEqual([[{ kind: "list" }]]);
    expect(jobs.snapshot?.trusted).toBe(false);
  });

  it("narrows native admission before loading an untrusted or safe-mode workspace", async () => {
    const call = vi
      .fn<NativeBackgroundJobs["call"]>()
      .mockResolvedValue(snapshot);
    const jobs = new BackgroundJobSession({ call });
    await jobs.initialize({ trusted: false, safeMode: true });
    expect(call).toHaveBeenLastCalledWith({
      kind: "fence",
      trusted: false,
      safeMode: true,
    });
  });

  it("preserves the latest native revision when responses arrive out of order", async () => {
    const releases: Array<(value: BackgroundJobSnapshot) => void> = [];
    const jobs = new BackgroundJobSession({
      call: () => new Promise((resolve) => releases.push(resolve)),
    });
    const first = jobs.call({ kind: "list" });
    const second = jobs.call({ kind: "list" });
    await Promise.resolve();
    releases[1]({ ...snapshot, revision: 2 });
    await second;
    releases[0]({ ...snapshot, revision: 1 });
    await first;
    expect(jobs.snapshot?.revision).toBe(2);
  });

  it.each([
    { ...snapshot, runnerId: "foreign" },
    { ...snapshot, revision: Number.POSITIVE_INFINITY },
    { ...snapshot, jobs: Array(65).fill(snapshot.jobs[0]) },
    { ...snapshot, jobs: [{ ...snapshot.jobs[0], phase: "unknown" }] },
  ])("rejects a malformed native response", async (value) => {
    const jobs = new BackgroundJobSession({
      call: async () => value as BackgroundJobSnapshot,
    });
    await expect(jobs.call({ kind: "list" })).rejects.toThrow(/Invalid native/);
  });

  it("validates headless declarations without evaluating plugin code", () => {
    const descriptor = snapshot.jobs[0].descriptor;
    expect(isBackgroundJobDescriptor(descriptor)).toBe(true);
    for (const entry of [
      "../job.js",
      "/job.js",
      "jobs//job.js",
      "file:job.js",
      "job.js?query",
    ]) {
      expect(isBackgroundJobDescriptor({ ...descriptor, entry })).toBe(false);
    }
    expect(
      isBackgroundJobDescriptor({
        ...descriptor,
        schedule: { kind: "interval", seconds: 1 },
      }),
    ).toBe(false);
  });

  it("validates explicit network origins and opaque bindings while preserving v1 declarations", () => {
    const descriptor = structuredClone(snapshot.jobs[0].descriptor);
    descriptor.permissions.network = [
      {
        origin: "https://bank.example",
        methods: ["GET"],
        allowPrivateNetwork: false,
        credentials: [
          { id: "bank", header: "authorization", prefix: "Bearer " },
        ],
      },
    ];
    expect(isBackgroundJobDescriptor(descriptor)).toBe(true);
    for (const origin of [
      "https://bank.example/",
      "https://bank.example/path",
      "https://user:secret@bank.example",
      "http://bank.example",
      "file:///tmp/a",
    ]) {
      expect(
        isBackgroundJobDescriptor({
          ...descriptor,
          permissions: {
            ...descriptor.permissions,
            network: [{ ...descriptor.permissions.network[0], origin }],
          },
        }),
      ).toBe(false);
    }
    expect(isBackgroundJobDescriptor(snapshot.jobs[0].descriptor)).toBe(true);
  });

  it("observes configured credential status without accepting stored values in snapshots", async () => {
    const value = structuredClone(snapshot);
    value.jobs[0].credentials = [
      { id: "bank", configured: true, unavailableReason: null },
    ];
    const jobs = new BackgroundJobSession({ call: async () => value });
    await expect(jobs.call({ kind: "list" })).resolves.toEqual(value);
    const leaked = structuredClone(value) as unknown as {
      jobs: Array<{ credentials: unknown[] }>;
    };
    leaked.jobs[0].credentials = [
      {
        id: "bank",
        configured: true,
        value: "must-not-be-returned",
        unavailableReason: null,
      },
    ];
    const invalid = new BackgroundJobSession({
      call: async () => leaked as BackgroundJobSnapshot,
    });
    await expect(invalid.call({ kind: "list" })).rejects.toThrow(
      /Invalid native/,
    );
  });
});
