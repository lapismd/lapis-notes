import assert from "node:assert/strict";
import { test } from "node:test";
import {
  completed,
  releaseLease,
  cleanOwned,
  withWorkspaceLease,
} from "./validation/leases.mjs";
import { label } from "./validation/model.mjs";

const runId = "a".repeat(64),
  leaseId = "b".repeat(64);
const terminal = {
  Status: "exited",
  Running: false,
  Paused: false,
  Restarting: false,
};
function fixture(state = terminal) {
  const commands = [],
    collected = [];
  const records = new Map([
    [
      runId,
      {
        Id: runId,
        Name: "/lapis-notes-validation-test",
        State: state,
        Config: {
          Labels: { [label]: "run", [`${label}.workspace`]: "workspace" },
        },
      },
    ],
    [
      leaseId,
      {
        Id: leaseId,
        Name: "/lapis-notes-validation-lease-test",
        Config: {
          Labels: { [label]: "lease", [`${label}.workspace`]: "workspace" },
        },
      },
    ],
  ]);
  const io = {
    output(_config, args) {
      commands.push(args);
      if (args[0] === "create") return leaseId;
      if (args[0] === "inspect") {
        const record = records.get(args[1]);
        if (!record) throw Error("No such container");
        return JSON.stringify(record);
      }
      if (args[0] === "volume") return "";
      if (args[0] === "ps")
        return [...records.values()]
          .filter((record) =>
            args.includes(`label=${label}=${record.Config.Labels[label]}`),
          )
          .map((record) => record.Id)
          .join("\n");
      throw Error("Unexpected Docker command");
    },
    async docker(_config, args) {
      commands.push(args);
      assert.equal(args[0], "rm");
      assert.ok(
        /^[a-f0-9]{64}$/.test(args[1]),
        "delete by immutable container ID",
      );
      records.delete(args[1]);
    },
    async collect(_config, id) {
      collected.push(id);
    },
    warn() {},
  };
  return { io, commands, records, collected };
}

test("only completed workers qualify for lease release and cleanup", () => {
  assert.equal(completed(terminal), true);
  assert.equal(completed({ ...terminal, Status: "dead" }), true);
  for (const state of [
    null,
    {},
    { Running: false },
    ...["created", "running", "paused", "restarting", "removing"].map(
      (Status) => ({ ...terminal, Status }),
    ),
    { ...terminal, Running: true },
    { ...terminal, Paused: true },
    { ...terminal, Restarting: true },
  ])
    assert.equal(completed(state), false, JSON.stringify(state));
});

test("release uses the exact owned lease ID after observing terminal workers", async () => {
  const f = fixture();
  assert.equal(await releaseLease({}, leaseId, f.io), true);
  assert.equal(f.records.has(leaseId), false);
  assert.equal(
    f.records.has(runId),
    true,
    "failed worker remains for collection",
  );
});

test("created, active, paused and unknown workers retain the lease", async () => {
  for (const Status of [
    "created",
    "running",
    "paused",
    "restarting",
    "unexpected",
  ]) {
    const f = fixture({ ...terminal, Status });
    assert.equal(await releaseLease({}, leaseId, f.io), false);
    assert.equal(f.records.has(leaseId), true);
  }
});

test("a failed SSH state query retains the lease and cleanup remains read-only", async () => {
  const f = fixture();
  const output = f.io.output;
  f.io.output = (config, args) => {
    if (args[0] === "inspect" && args[1] === runId)
      throw Error("SSH disconnected");
    return output(config, args);
  };
  assert.equal(await releaseLease({}, leaseId, f.io), false);
  const result = await cleanOwned({}, ["--apply"], f.io);
  assert.deepEqual(result.stoppedContainers, []);
  assert.equal(f.records.has(leaseId), true);
  assert.equal(f.records.has(runId), true);
  assert.deepEqual(f.collected, []);
});

test("cleanup preview preserves workers, leases and caches", async () => {
  const f = fixture();
  const result = await cleanOwned({}, [], f.io);
  assert.deepEqual(result.stoppedContainers, [runId]);
  assert.equal(f.records.size, 2);
  assert.deepEqual(f.collected, []);
});

test("cleanup collects completed workers before removing their exact IDs and lease", async () => {
  const f = fixture();
  await cleanOwned({}, ["--apply"], f.io);
  assert.deepEqual(f.collected, [runId]);
  assert.equal(f.records.size, 0);
});

test("cleanup rechecks state immediately before collection and retains a restarted worker", async () => {
  const f = fixture();
  const output = f.io.output;
  let reads = 0;
  f.io.output = (config, args) => {
    if (args[0] === "inspect" && args[1] === runId && ++reads >= 2)
      f.records.get(runId).State = {
        ...terminal,
        Status: "running",
        Running: true,
      };
    return output(config, args);
  };
  await cleanOwned({}, ["--apply"], f.io);
  assert.equal(f.records.size, 2);
  assert.deepEqual(f.collected, []);
});

test("missing or changed ownership never grants cleanup authority", async () => {
  const f = fixture();
  f.records.get(leaseId).Config.Labels[label] = "unowned";
  assert.equal(await releaseLease({}, leaseId, f.io), false);
  assert.equal(f.records.size, 2);
});

test("a lost operation response preserves both the original error and live-worker lease", async () => {
  const f = fixture({ ...terminal, Status: "running", Running: true });
  const error = Error("SSH attach disconnected");
  await assert.rejects(
    withWorkspaceLease(
      {},
      "workspace",
      "image",
      async () => {
        throw error;
      },
      f.io,
    ),
    (actual) => actual === error,
  );
  assert.equal(f.records.size, 2);
});

test("a completed failed operation releases its exact lease while retaining reports", async () => {
  const f = fixture();
  await assert.rejects(
    withWorkspaceLease(
      {},
      "workspace",
      "image",
      async () => {
        throw Error("test failed");
      },
      f.io,
    ),
    /test failed/,
  );
  assert.equal(f.records.has(leaseId), false);
  assert.equal(f.records.has(runId), true);
});

test("a successful operation returns its result and releases a worker-free lease", async () => {
  const f = fixture();
  const result = await withWorkspaceLease(
    {},
    "workspace",
    "image",
    async () => {
      f.records.delete(runId);
      return "receipt";
    },
    f.io,
  );
  assert.equal(result, "receipt");
  assert.equal(f.records.size, 0);
});
