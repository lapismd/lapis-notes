import { afterEach, expect, it, vi } from "vitest";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import {
  NativeSyncService,
  type NativeSyncCommand,
  type NativeSyncObservation,
  type NativeSyncPort,
} from "../native-sync";

const command: NativeSyncCommand = {
  provider: "lapis-server",
  requestId: "leave-test",
  operation: "apply",
  input: {},
};
const fixtures: Array<{
  service: NativeSyncService;
  writers: FileEditingSessionRegistry;
}> = [];
function fixture() {
  let listener: ((next: NativeSyncObservation) => void) | undefined;
  const writers = new FileEditingSessionRegistry();
  const port: NativeSyncPort = {
    provider: "lapis-server",
    snapshot: () => ({
      provider: "lapis-server",
      revision: 1,
      snapshot: { state: "ready" },
    }),
    call: vi.fn(async (request) => ({
      provider: request.provider,
      requestId: request.requestId,
      value: "accepted",
    })),
    observe: (next) => {
      listener = next;
      return () => {
        listener = undefined;
      };
    },
  };
  const service = new NativeSyncService(port, writers);
  fixtures.push({ service, writers });
  return {
    service,
    writers,
    port,
    observe: (next: NativeSyncObservation) => listener?.(next),
  };
}
afterEach(async () => {
  for (const { service, writers } of fixtures.splice(0).reverse()) {
    await service.dispose();
    await writers.dispose();
  }
});

it("refused App leave restores the same native Sync lease and live observation", async () => {
  const { service, port, observe } = fixture();
  const lease = service.select("lapis-server");
  const resume = await service.prepareLeave();
  expect(lease.detached).toBe(false);
  await expect(lease.call(command)).rejects.toThrow(/preparing to leave/);
  expect(port.call).not.toHaveBeenCalled();
  observe({
    provider: "lapis-server",
    revision: 2,
    snapshot: { state: "offline" },
  });
  expect(lease.snapshot().revision).toBe(2);
  resume();
  resume();
  await expect(lease.call(command)).resolves.toMatchObject({
    value: "accepted",
  });
  expect(port.call).toHaveBeenCalledOnce();
});

it("drains queued apply before teardown takes the whole-vault writer guard", async () => {
  const { service, writers, port } = fixture();
  const lease = service.select("lapis-server");
  let release!: () => void;
  const busy = writers.guard(
    undefined,
    () =>
      new Promise<void>((done) => {
        release = done;
      }),
  );
  await vi.waitFor(() => expect(release).toBeTypeOf("function"));
  const apply = lease.apply(command);
  const preparation = service.prepareLeave();
  expect(() => service.select("lapis-server")).toThrow(/preparing to leave/);
  await expect(service.prepareLeave()).rejects.toThrow(/preparing to leave/);
  await expect(lease.apply(command)).rejects.toThrow(/preparing to leave/);
  expect(port.call).not.toHaveBeenCalled();
  release();
  await busy;
  await expect(apply).resolves.toMatchObject({ value: "accepted" });
  const resume = await preparation;
  await writers.guard(undefined, () => service.dispose());
  resume();
  expect(lease.detached).toBe(true);
  expect(port.call).toHaveBeenCalledOnce();
  expect(() => service.select("lapis-server")).toThrow(/not available/);
});

it("does not revive a disposed service when an older preparation is released", async () => {
  const { service } = fixture();
  const lease = service.select("lapis-server");
  const resume = await service.prepareLeave();
  resume();
  const nextResume = await service.prepareLeave();
  resume();
  await expect(lease.call(command)).rejects.toThrow(/preparing to leave/);
  await service.dispose();
  nextResume();
  await expect(service.prepareLeave()).rejects.toThrow(/revoked/);
  await expect(lease.call(command)).rejects.toThrow(/revoked/);
});

it("keeps command failures on their original calls while leave drains", async () => {
  const { service, port } = fixture();
  let fail!: (error: Error) => void;
  vi.mocked(port.call).mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      }),
  );
  const lease = service.select("lapis-server");
  const call = expect(lease.call(command)).rejects.toThrow("Unknown outcome");
  const preparation = service.prepareLeave();
  fail(new Error("Unknown outcome"));
  await call;
  const resume = await preparation;
  expect(port.call).toHaveBeenCalledOnce();
  resume();
});
