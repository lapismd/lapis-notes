import { describe, expect, it } from "vitest";
import { MemoryVaultAdapter } from "./storage/memory-vault-adapter";
import { manageSkills, type PackagedSkill } from "./skill-management";
const skill = (body = "one"): PackagedSkill => ({
  name: "lapis-example",
  source: "example",
  version: body,
  files: {
    "SKILL.md":
      "---\nname: lapis-example\ndescription: Example workflow.\n---\n" + body,
    "references/example.md": body,
  },
});
const path = ".agents/skills/lapis-example/";
describe("protected skill installation", () => {
  it("installs explicitly, is repeatable, and updates a clean directory", async () => {
    const adapter = new MemoryVaultAdapter();
    expect((await manageSkills(adapter, [skill()], "install"))[0].status).toBe(
      "installed",
    );
    expect((await manageSkills(adapter, [skill()], "install"))[0].status).toBe(
      "unchanged",
    );
    expect(
      (await manageSkills(adapter, [skill("two")], "update"))[0].status,
    ).toBe("updated");
    expect(await adapter.read(path + "references/example.md")).toBe("two");
  });
  for (const mutation of ["edit", "add", "delete"] as const) {
    it(`preserves the complete directory after a local ${mutation}`, async () => {
      const adapter = new MemoryVaultAdapter();
      await manageSkills(adapter, [skill()], "install");
      if (mutation === "edit")
        await adapter.write(path + "references/example.md", "local");
      if (mutation === "add") await adapter.write(path + "mine.md", "local");
      if (mutation === "delete")
        await adapter.remove(path + "references/example.md");
      expect(
        (await manageSkills(adapter, [skill("two")], "update"))[0],
      ).toMatchObject({ status: "skipped", reason: "locally-modified" });
      expect(await adapter.read(path + "SKILL.md")).toContain("one");
    });
  }
  it("detects binary edits even when text decoding matches the receipt", async () => {
    const adapter = new MemoryVaultAdapter();
    const original = skill();
    (original.files as Record<string, string>)["references/example.md"] =
      "\uFFFD";
    await manageSkills(adapter, [original], "install");
    await adapter.writeBinary(
      path + "references/example.md",
      new Uint8Array([0xff]).buffer,
    );
    expect(
      (await manageSkills(adapter, [skill("two")], "update"))[0],
    ).toMatchObject({
      status: "skipped",
      reason: "locally-modified",
    });
    expect(await adapter.read(path + "SKILL.md")).toContain("one");
    expect(
      new Uint8Array(await adapter.readBinary(path + "references/example.md")),
    ).toEqual(new Uint8Array([0xff]));
  });
  it("preserves added binary resources and refuses adapters without byte guards", async () => {
    const adapter = new MemoryVaultAdapter();
    await manageSkills(adapter, [skill()], "install");
    await adapter.writeBinary(
      path + "mine.png",
      new Uint8Array([0xff, 0, 0xfe]).buffer,
    );
    expect(
      (await manageSkills(adapter, [skill("two")], "update"))[0],
    ).toMatchObject({ status: "skipped", reason: "locally-modified" });
    expect(await adapter.read(path + "SKILL.md")).toContain("one");
    Object.defineProperty(adapter, "writeBinaryIfUnchanged", {
      value: undefined,
    });
    await expect(
      manageSkills(adapter, [skill("two")], "update"),
    ).rejects.toThrow("conditional writes");
  });
  it("preserves unmanaged directories and rejects corrupt receipts", async () => {
    const adapter = new MemoryVaultAdapter();
    await adapter.mkdir(path.slice(0, -1), { recursive: true });
    await adapter.write(path + "SKILL.md", "local");
    expect((await manageSkills(adapter, [skill()], "install"))[0].reason).toBe(
      "unmanaged",
    );
    await adapter.write(".agents/.lapis-skills.json", "broken");
    await expect(manageSkills(adapter, [skill()], "update")).rejects.toThrow(
      "receipt",
    );
    expect(await adapter.read(path + "SKILL.md")).toBe("local");
  });
  it("rejects collisions and unsafe package paths before writing", async () => {
    const adapter = new MemoryVaultAdapter();
    await expect(
      manageSkills(adapter, [skill(), skill()], "install"),
    ).rejects.toThrow("Duplicate");
    await expect(
      manageSkills(
        adapter,
        [{ ...skill(), files: { "../SKILL.md": "bad" } }],
        "install",
      ),
    ).rejects.toThrow();
    expect(await adapter.exists(".agents")).toBe(false);
  });
  it("keeps an interrupted operation fenced on restart", async () => {
    const adapter = new MemoryVaultAdapter();
    await manageSkills(adapter, [skill()], "install");
    const write = adapter.writeBinaryIfUnchanged.bind(adapter);
    adapter.writeBinaryIfUnchanged = async (file, ...args) => {
      if (file === path + "references/example.md")
        throw new Error("interrupted");
      return write(file, ...args);
    };
    await expect(
      manageSkills(adapter, [skill("two")], "update"),
    ).rejects.toThrow("interrupted");
    adapter.writeBinaryIfUnchanged = write;
    expect(
      (await manageSkills(adapter, [skill("two")], "update"))[0].reason,
    ).toBe("interrupted");
  });
  it("serializes simultaneous installs and removes obsolete resources on clean upgrades", async () => {
    const adapter = new MemoryVaultAdapter();
    const results = await Promise.all([
      manageSkills(adapter, [skill()], "install"),
      manageSkills(adapter, [skill()], "install"),
    ]);
    expect(results.map(([item]) => item.status)).toEqual([
      "installed",
      "unchanged",
    ]);
    const next = skill("two");
    delete (next.files as Record<string, string>)["references/example.md"];
    expect((await manageSkills(adapter, [next], "update"))[0].status).toBe(
      "updated",
    );
    expect(await adapter.exists(path + "references/example.md")).toBe(false);
  });
  it("rejects an incomplete receipt and fences an intervening editor write", async () => {
    const adapter = new MemoryVaultAdapter();
    await manageSkills(adapter, [skill()], "install");
    const receiptPath = ".agents/.lapis-skills.json";
    const text = await adapter.read(receiptPath);
    const receipt = JSON.parse(text);
    receipt.skills["lapis-example"].version = "";
    await adapter.write(receiptPath, JSON.stringify(receipt));
    await expect(
      manageSkills(adapter, [skill("two")], "update"),
    ).rejects.toThrow("receipt");
    await adapter.write(receiptPath, text);
    const write = adapter.writeTextIfUnchanged.bind(adapter);
    adapter.writeTextIfUnchanged = async (file, ...args) => {
      await write(file, ...args);
      if (file === receiptPath)
        await adapter.write(path + "references/example.md", "concurrent edit");
    };
    await expect(
      manageSkills(adapter, [skill("two")], "update"),
    ).rejects.toThrow("changed during");
    expect(await adapter.read(path + "references/example.md")).toBe(
      "concurrent edit",
    );
    expect(await adapter.read(path + "SKILL.md")).toContain("one");
  });
});
