import { describe, expect, it } from "vitest";
import { reservedCommandMarkdown, RESERVED_SLASH_COMMANDS } from "./reserved";
import { seedReservedCommands } from "./seed";
import { MemoryUserAgentsStore } from "./user-agents";

describe("seedReservedCommands", () => {
  it("writes reserved host files only when missing and overwrites those names on update", async () => {
    const store = new MemoryUserAgentsStore();
    await seedReservedCommands(store);
    expect(store.files.size).toBe(RESERVED_SLASH_COMMANDS.length);
    const original = store.files.get("help");
    expect(original).toContain("kind: host");
    await store.write("help", "user edited help");
    await store.write("review", "user prompt");
    await seedReservedCommands(store);
    expect(store.files.get("help")).toBe("user edited help");
    expect(store.files.get("review")).toBe("user prompt");
    await seedReservedCommands(store, { overwrite: true });
    expect(store.files.get("help")).toBe(
      reservedCommandMarkdown(RESERVED_SLASH_COMMANDS[0]!),
    );
    expect(store.files.get("review")).toBe("user prompt");
  });
});
