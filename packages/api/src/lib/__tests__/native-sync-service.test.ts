import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import { App } from "../context.svelte";
import NativeSyncAppHarness from "./NativeSyncAppHarness.test.svelte";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import {
  NativeSyncService,
  type NativeSyncCommand,
  type NativeSyncObservation,
  type NativeSyncPort,
  type NativeSyncReply,
} from "../native-sync";
import { MemoryAppDatabase } from "../storage/app-database";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import type { VaultSession } from "../storage/vault-session";

const command: NativeSyncCommand = {
  provider: "lapis-server",
  requestId: "request-1",
  operation: "checkpoint",
  input: { reason: "manual" },
};

function observation(
  revision = 1,
  snapshot: unknown = { status: "idle-clean" },
): NativeSyncObservation {
  return { provider: "lapis-server", revision, snapshot };
}

function reply(requestId = command.requestId): NativeSyncReply {
  return {
    provider: "lapis-server",
    requestId,
    value: { accepted: true },
  };
}

function portFixture(
  options: {
    call?: NativeSyncPort["call"];
    provider?: NativeSyncPort["provider"];
  } = {},
) {
  let current = observation();
  const listeners = new Set<(next: NativeSyncObservation) => void>();
  const errors = new Set<(error: unknown) => void>();
  const stop = vi.fn();
  const call = vi.fn<NativeSyncPort["call"]>(
    options.call ?? (async (request) => reply(request.requestId)),
  );
  const port: NativeSyncPort = {
    provider: options.provider ?? "lapis-server",
    snapshot: () => current,
    call,
    observe(listener, reportError) {
      listeners.add(listener);
      errors.add(reportError);
      return () => {
        stop();
        listeners.delete(listener);
        errors.delete(reportError);
      };
    },
  };
  return {
    call,
    port,
    stop,
    emit(next: NativeSyncObservation) {
      current = next;
      for (const listener of listeners) listener(next);
    },
    fail(error: unknown) {
      for (const report of errors) report(error);
    },
  };
}

const databases: MemoryAppDatabase[] = [];
const apps: Array<{
  app: App;
  component: ReturnType<typeof mount>;
  target: HTMLElement;
}> = [];
beforeEach(() =>
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    media: "",
    addEventListener() {},
    removeEventListener() {},
  })),
);
afterEach(async () => {
  for (const { app, component, target } of apps.splice(0).reverse()) {
    await app.metadataCache.dispose({ persist: false }).catch(() => undefined);
    await app.fileEditingSessions.dispose().catch(() => undefined);
    await unmount(component);
    target.remove();
  }
  vi.unstubAllGlobals();
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function appFixture(
  nativeSync?: NativeSyncPort,
  sessionNativeSync?: NativeSyncPort,
) {
  const database = new MemoryAppDatabase("native-sync-service");
  databases.push(database);
  await database.open();
  const adapter = new MemoryVaultAdapter();
  const session = sessionNativeSync
    ? ({
        runtime: "test",
        vaultAdapter: adapter,
        appDatabase: database,
        nativeSync: sessionNativeSync,
        appDatabaseState: {
          status: "ready",
          mode: "memory-test",
          providerId: database.descriptor.providerId,
          role: database.descriptor.role,
          transport: database.descriptor.transport,
          capabilities: database.descriptor.capabilities,
          lockSupported: false,
        },
        close: async () => {},
      } satisfies VaultSession)
    : undefined;
  let app!: App;
  const target = document.createElement("div");
  document.body.append(target);
  const component = mount(NativeSyncAppHarness, {
    target,
    props: {
      options: {
        version: "test",
        adapter,
        session,
        appDatabase: database,
        nativeSync,
        markdownRenderer: async () => {},
      },
      onApp: (value) => (app = value),
    },
  });
  flushSync();
  apps.push({ app, component, target });
  return app;
}

it("keeps native Sync absent unless the host explicitly supplies it", async () => {
  const app = await appFixture();
  expect(app.nativeSync).toBeUndefined();
  await app.metadataCache.dispose({ persist: false });
  await app.fileEditingSessions.dispose();
});

it("prefers the admitted VaultSession port over a direct App port", async () => {
  const direct = portFixture();
  const admitted = portFixture();
  const app = await appFixture(direct.port, admitted.port);
  const lease = app.nativeSync!.select("lapis-server");
  await lease.call(command);
  expect(admitted.call).toHaveBeenCalledExactlyOnceWith(command);
  expect(direct.call).not.toHaveBeenCalled();
  await lease.detach();
});

it("selects only the exact admitted provider without fallback", async () => {
  const fixture = portFixture();
  const service = new NativeSyncService(
    fixture.port,
    new FileEditingSessionRegistry(),
  );
  expect(service.select("lapis-server").snapshot()).toEqual(observation());
  expect(() => service.select("nostr" as "lapis-server")).toThrow(
    /not available/,
  );
  expect(fixture.call).not.toHaveBeenCalled();
  await service.dispose();
});

it("forwards snapshots, commands and observation failures without replay", async () => {
  const fixture = portFixture();
  const service = new NativeSyncService(
    fixture.port,
    new FileEditingSessionRegistry(),
  );
  const lease = service.select("lapis-server");
  const changed = vi.fn();
  const failed = vi.fn();
  const unsubscribe = lease.subscribe(changed, failed);
  fixture.emit(observation(2, { status: "offline" }));
  expect(changed).toHaveBeenCalledOnce();
  expect(lease.snapshot()).toEqual(observation(2, { status: "offline" }));
  const failure = new Error("native observation unavailable");
  fixture.fail(failure);
  expect(failed).toHaveBeenCalledExactlyOnceWith(failure);
  await expect(lease.call(command)).resolves.toEqual(reply());
  expect(fixture.call).toHaveBeenCalledExactlyOnceWith(command);
  unsubscribe();
  await lease.detach();
  await service.dispose();
});

it("revokes synchronously, drains accepted work and rejects late results", async () => {
  const accepted = Promise.withResolvers<NativeSyncReply>();
  const fixture = portFixture({ call: () => accepted.promise });
  const service = new NativeSyncService(
    fixture.port,
    new FileEditingSessionRegistry(),
  );
  const lease = service.select("lapis-server");
  const pending = lease.call(command);
  await Promise.resolve();
  const drained = lease.detach();
  expect(lease.detached).toBe(true);
  expect(fixture.stop).toHaveBeenCalledOnce();
  await expect(lease.call(command)).rejects.toThrow(/revoked/);
  accepted.resolve(reply());
  await expect(pending).rejects.toThrow(/revoked/);
  await expect(drained).resolves.toBeUndefined();
  expect(fixture.call).toHaveBeenCalledTimes(1);
  await service.dispose();
});

it("propagates provider failure without selecting another implementation", async () => {
  const failure = new Error("native repository is locked");
  const fixture = portFixture({
    call: async () => {
      throw failure;
    },
  });
  const service = new NativeSyncService(
    fixture.port,
    new FileEditingSessionRegistry(),
  );
  const lease = service.select("lapis-server");
  await expect(lease.call(command)).rejects.toBe(failure);
  expect(fixture.call).toHaveBeenCalledTimes(1);
  await lease.detach();
  await service.dispose();
});

it("holds the whole-vault writer guard across native apply", async () => {
  const order: string[] = [];
  const fixture = portFixture({
    call: async (request) => {
      order.push("native");
      return reply(request.requestId);
    },
  });
  const registry = new FileEditingSessionRegistry();
  for (const path of ["note.md", "attachment.bin"]) {
    registry.register(path, {
      dirty: false,
      async flush() {
        order.push(`flush:${path}`);
      },
      async protect() {
        order.push(`protect:${path}`);
        return () => order.push(`release:${path}`);
      },
    });
  }
  const service = new NativeSyncService(fixture.port, registry);
  const lease = service.select("lapis-server");
  await expect(lease.apply(command)).resolves.toEqual(reply());
  expect(order).toEqual([
    "protect:note.md",
    "protect:attachment.bin",
    "flush:note.md",
    "flush:attachment.bin",
    "native",
    "release:note.md",
    "release:attachment.bin",
  ]);
  await lease.detach();
  await service.dispose();
  await registry.dispose();
});

it("App disposal invalidates native Sync and drains accepted calls", async () => {
  const accepted = Promise.withResolvers<NativeSyncReply>();
  const fixture = portFixture({ call: () => accepted.promise });
  const app = await appFixture(fixture.port);
  const lease = app.nativeSync!.select("lapis-server");
  const pending = lease.call(command);
  await Promise.resolve();
  const disposing = app.metadataCache.dispose({ persist: false });
  expect(lease.detached).toBe(true);
  accepted.resolve(reply());
  await expect(pending).rejects.toThrow(/revoked/);
  await expect(disposing).resolves.toBeUndefined();
  await app.fileEditingSessions.dispose();
});
