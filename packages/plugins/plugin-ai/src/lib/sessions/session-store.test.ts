import { describe, expect, it } from "vitest";
import {
  createMemorySessionStore,
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
});
