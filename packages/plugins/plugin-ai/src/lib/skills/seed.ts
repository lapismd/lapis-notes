import type { Vault } from "@lapis-notes/api";
import { BUNDLED_SKILL_MARKDOWN } from "./bundled/research";

export function bundledSkillVaultPath(name: string): string {
  return `.agents/skills/${name}/SKILL.md`;
}

export async function seedBundledSkills(
  vault: Vault,
  options: { overwrite?: boolean } = {},
): Promise<void> {
  for (const [name, markdown] of Object.entries(BUNDLED_SKILL_MARKDOWN)) {
    const path = bundledSkillVaultPath(name);
    const existing = vault.getFileByPath(path);
    if (existing && !options.overwrite) continue;
    if (existing) {
      await vault.modify(existing, markdown);
      continue;
    }
    await vault.mkpath(`.agents/skills/${name}`);
    await vault.create(path, markdown);
  }
}
