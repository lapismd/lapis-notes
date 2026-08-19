import { beforeAll, describe, expect, it } from "vitest";
import { CommandDiscovery } from "./discovery";
import { MemoryUserAgentsStore } from "./user-agents";

let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;

beforeAll(async () => {
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
});

describe("CommandDiscovery", () => {
  it("lets folder prompts override vault and user-global files", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await vault.mkpath("Notes/.agents/commands");
    await vault.mkpath(".agents/commands");
    await vault.create(
      "Notes/.agents/commands/review.md",
      `---
description: Folder review
---
Folder $ARGUMENTS
`,
    );
    await vault.create(
      ".agents/commands/review.md",
      `---
description: Vault review
---
Vault $ARGUMENTS
`,
    );
    const userAgents = new MemoryUserAgentsStore();
    await userAgents.write(
      "review",
      `---
description: User review
---
User $ARGUMENTS
`,
    );
    const discovered = await new CommandDiscovery({ vault, userAgents }).discover(
      "Notes",
    );
    expect(discovered.commands).toHaveLength(1);
    expect(discovered.commands[0]).toMatchObject({
      name: "review",
      description: "Folder review",
      source: "folder",
      path: "Notes/.agents/commands/review.md",
    });
  });

  it("treats reserved-name prompt files as diagnostics and overlays host files", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await vault.mkpath(".agents/commands");
    await vault.create(
      ".agents/commands/help.md",
      `---
description: Custom help docs
kind: host
---
Docs only.
`,
    );
    await vault.create(
      ".agents/commands/new.md",
      `---
description: Should not win
---
Nope $ARGUMENTS
`,
    );
    const discovered = await new CommandDiscovery({ vault }).discover("");
    expect(discovered.commands).toEqual([]);
    expect(discovered.overlays[0]).toMatchObject({
      name: "help",
      description: "Custom help docs",
      kind: "host",
    });
    expect(
      discovered.diagnostics.some((item) =>
        /Reserved command name/u.test(item.message),
      ),
    ).toBe(true);
  });

  it("rejects kind host on a non-reserved name", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    await vault.load();
    await vault.mkpath(".agents/commands");
    await vault.create(
      ".agents/commands/custom.md",
      `---
description: Invalid host
kind: host
---
Docs.
`,
    );
    const discovered = await new CommandDiscovery({ vault }).discover("");
    expect(discovered.commands).toEqual([]);
    expect(
      discovered.diagnostics.some((item) =>
        /kind: host requires a reserved command name/u.test(item.message),
      ),
    ).toBe(true);
  });
});
