import { describe, expect, it } from "vitest";
import {
  createMemorySessionStore,
  createPersistedSessionStore,
  createStoredAgentSession,
} from "./session-store";

describe("session store", () => {
  it("persists runtime-neutral metadata and chat items", async () => {
    const store = createMemorySessionStore();
    const session = createStoredAgentSession({
      id: "s1",
      runtime: "fake",
      runtimeSessionId: "fake-1",
      workspace: "/vault",
      items: [{ id: "m1", type: "message", role: "user", text: "hi" }],
    });
    await store.save(session);
    expect(await store.get("s1")).toMatchObject({
      runtime: "fake",
      runtimeSessionId: "fake-1",
      workspace: "/vault",
    });
    expect((await store.list())[0]?.items[0]).toMatchObject({ text: "hi" });
    await store.remove("s1");
    expect(await store.get("s1")).toBeUndefined();
  });

  it("writes runtime-neutral sessions through a plugin-data backend", async () => {
    let persisted: ReturnType<typeof createStoredAgentSession>[] = [];
    const store = createPersistedSessionStore({
      async read() {
        return persisted;
      },
      async write(sessions) {
        persisted = sessions;
      },
    });
    await store.save(
      createStoredAgentSession({
        id: "ai:default",
        runtime: "fake",
        runtimeSessionId: "fake-1",
        pendingApprovalId: "p1",
        items: [{ id: "m1", type: "message", role: "user", text: "hi" }],
      }),
    );
    expect(persisted[0]).toMatchObject({
      id: "ai:default",
      pendingApprovalId: "p1",
    });
    expect((await store.get("ai:default"))?.items[0]).toMatchObject({
      text: "hi",
    });
  });
});
