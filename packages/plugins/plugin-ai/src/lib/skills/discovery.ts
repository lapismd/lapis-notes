import type { Vault } from "@lapis-notes/api";
import type {
  AppSkillRegistry,
  RegisteredAppSkillSource,
  SkillSourceKind,
} from "@lapis-notes/api/agent-skills";
import { parseSkillMarkdown, SkillParseError } from "./parser";
import type {
  LoadedAppSkill,
  SkillDiagnostic,
  SkillDiscoveryContext,
} from "./types";

const SOURCE_RANK: Record<SkillSourceKind, number> = {
  folder: 5,
  vault: 4,
  user: 3,
  extension: 2,
  programmatic: 2,
  bundled: 1,
};

export interface DiscoveredSkills {
  skills: LoadedAppSkill[];
  diagnostics: SkillDiagnostic[];
}

export interface SkillDiscoveryOptions {
  vault: Vault;
  appSkills?: AppSkillRegistry;
  bundled?: LoadedAppSkill[];
  extensionFiles?: ReadonlyMap<string, Readonly<Record<string, string>>>;
  extensionRootFor?: (ownerPluginId: string) => string | undefined;
  userPrefix?: string;
}

function skillGlob(prefix: string): string {
  const root = prefix.replace(/\/$/u, "");
  return root ? `${root}/**/SKILL.md` : ".agents/skills/**/SKILL.md";
}

function folderPrefix(scopeDir: string): string {
  return scopeDir ? `${scopeDir}/.agents/skills` : ".agents/skills";
}

export class SkillDiscovery {
  constructor(private readonly options: SkillDiscoveryOptions) {}

  async discover(context: SkillDiscoveryContext): Promise<DiscoveredSkills> {
    const diagnostics: SkillDiagnostic[] = [];
    const buckets = new Map<SkillSourceKind, LoadedAppSkill[]>();

    await this.#collectVault(
      "folder",
      folderPrefix(context.scopeDir),
      buckets,
      diagnostics,
    );
    await this.#collectVault("vault", ".agents/skills", buckets, diagnostics);
    await this.#collectVault(
      "user",
      this.options.userPrefix ?? ".agents/user/skills",
      buckets,
      diagnostics,
    );
    await this.#collectRegistered(buckets, diagnostics, context);
    for (const bundled of this.options.bundled ?? []) {
      addToBucket(buckets, bundled);
    }

    return mergeByPrecedence(buckets, diagnostics, context);
  }

  async #collectVault(
    source: SkillSourceKind,
    prefix: string,
    buckets: Map<SkillSourceKind, LoadedAppSkill[]>,
    diagnostics: SkillDiagnostic[],
  ): Promise<void> {
    const files = this.options.vault.getFilesByGlob(skillGlob(prefix));
    for (const file of files) {
      if (file.path.includes("/scripts/") || file.path.includes("/references/")) {
        continue;
      }
      const root = file.path.replace(/\/SKILL\.md$/u, "");
      if (rootIncludesEscape(root, prefix)) {
        diagnostics.push({
          path: file.path,
          source,
          message: "Skill path escapes the trusted root.",
        });
        continue;
      }
      const content = await this.options.vault.cachedRead(file);
      try {
        addToBucket(
          buckets,
          parseSkillMarkdown(content, {
            path: file.path,
            source,
            root,
          }),
        );
      } catch (error) {
        diagnostics.push({
          path: file.path,
          source,
          message:
            error instanceof SkillParseError
              ? error.message
              : "Skill could not be parsed.",
        });
      }
    }
  }

  async #collectRegistered(
    buckets: Map<SkillSourceKind, LoadedAppSkill[]>,
    diagnostics: SkillDiagnostic[],
    context: SkillDiscoveryContext,
  ): Promise<void> {
    for (const source of this.options.appSkills?.list() ?? []) {
      if (
        context.enabledPluginIds &&
        context.enabledPluginIds.length > 0 &&
        !context.enabledPluginIds.includes(source.ownerPluginId)
      ) {
        diagnostics.push({
          path: source.path ?? source.skill?.name ?? source.ownerPluginId,
          source: source.kind === "programmatic" ? "programmatic" : "extension",
          message: `Disabled extension root is excluded: ${source.ownerPluginId}`,
        });
        continue;
      }
      if (source.kind === "programmatic" && source.skill) {
        addToBucket(buckets, programmaticSkill(source));
        continue;
      }
      const files =
        this.options.extensionFiles?.get(
          `${source.ownerPluginId}:${source.path ?? ""}`,
        ) ?? (await this.#vaultExtensionFiles(source));
      if (!files) continue;
      for (const [relativePath, content] of Object.entries(files)) {
        if (!relativePath.endsWith("SKILL.md")) continue;
        try {
          addToBucket(
            buckets,
            parseSkillMarkdown(content, {
              path: `${source.ownerPluginId}/${relativePath}`,
              source: "extension",
              root: `${source.ownerPluginId}/${relativePath.replace(/\/SKILL\.md$/u, "")}`,
            }),
          );
        } catch (error) {
          diagnostics.push({
            path: `${source.ownerPluginId}/${relativePath}`,
            source: "extension",
            message:
              error instanceof SkillParseError
                ? error.message
                : "Skill could not be parsed.",
          });
        }
      }
    }
  }

  async #vaultExtensionFiles(
    source: RegisteredAppSkillSource,
  ): Promise<Record<string, string> | undefined> {
    if (!source.path) return undefined;
    const pluginRoot = this.options.extensionRootFor?.(source.ownerPluginId);
    if (!pluginRoot) return undefined;
    const prefix = `${pluginRoot.replace(/\/$/u, "")}/${source.path}`;
    const files = this.options.vault.getFilesByGlob(skillGlob(prefix));
    const contents: Record<string, string> = {};
    for (const file of files) {
      if (rootIncludesEscape(file.path.replace(/\/SKILL\.md$/u, ""), prefix)) {
        continue;
      }
      contents[file.path.slice(prefix.length + 1)] =
        await this.options.vault.cachedRead(file);
    }
    return Object.keys(contents).length > 0 ? contents : undefined;
  }
}

function programmaticSkill(
  source: RegisteredAppSkillSource,
): LoadedAppSkill {
  const skill = source.skill!;
  const frontmatter = [
    "---",
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    skill.userInvocable === false ? "user-invocable: false" : undefined,
    skill.disableModelInvocation ? "disable-model-invocation: true" : undefined,
    skill.argumentHint ? `argument-hint: ${JSON.stringify(skill.argumentHint)}` : undefined,
    skill.command?.kind === "tool" ? "command-dispatch: tool" : undefined,
    skill.command?.kind === "tool" ? `command-tool: ${skill.command.tool}` : undefined,
    "---",
  ].filter((line): line is string => Boolean(line));
  const content = [...frontmatter, "", skill.instructions].join("\n");
  return parseSkillMarkdown(content, {
    path: `programmatic:${source.ownerPluginId}/${skill.name}`,
    source: "programmatic",
    root: `programmatic:${source.ownerPluginId}/${skill.name}`,
  });
}

function addToBucket(
  buckets: Map<SkillSourceKind, LoadedAppSkill[]>,
  skill: LoadedAppSkill,
): void {
  const bucket = buckets.get(skill.source) ?? [];
  bucket.push(skill);
  buckets.set(skill.source, bucket);
}

function rootIncludesEscape(root: string, prefix: string): boolean {
  const normalized = prefix.replace(/\/$/u, "");
  if (root.includes("/../") || root.endsWith("/..") || root.includes("/./")) {
    return true;
  }
  return normalized !== "" && root !== normalized && !root.startsWith(`${normalized}/`);
}

function isEligible(
  skill: LoadedAppSkill,
  context: SkillDiscoveryContext,
): string | undefined {
  const requiredTools = skill.requirements?.tools ?? [];
  const available = new Set(context.availableToolNames ?? []);
  const missingTool = requiredTools.find((tool) => !available.has(tool));
  if (missingTool) return `Required tool is unavailable: ${missingTool}`;
  const requiredPlugins = skill.requirements?.extensions ?? [];
  const enabled = new Set(context.enabledPluginIds ?? []);
  if (requiredPlugins.length > 0 && enabled.size > 0) {
    const missing = requiredPlugins.find((id) => !enabled.has(id));
    if (missing) return `Required extension is unavailable: ${missing}`;
  }
  return undefined;
}

function mergeByPrecedence(
  buckets: Map<SkillSourceKind, LoadedAppSkill[]>,
  diagnostics: SkillDiagnostic[],
  context: SkillDiscoveryContext,
): DiscoveredSkills {
  const winners = new Map<string, LoadedAppSkill>();
  const kinds: SkillSourceKind[] = [
    "bundled",
    "extension",
    "programmatic",
    "user",
    "vault",
    "folder",
  ];
  for (const kind of kinds) {
    const skills = buckets.get(kind) ?? [];
    const seen = new Set<string>();
    for (const skill of skills) {
      if (seen.has(skill.name)) {
        diagnostics.push({
          path: skill.root,
          source: skill.source,
          message: `Duplicate skill name at the same precedence: ${skill.name}`,
        });
        winners.delete(skill.name);
        continue;
      }
      seen.add(skill.name);
      const reason = isEligible(skill, context);
      if (reason) {
        diagnostics.push({
          path: skill.root,
          source: skill.source,
          message: reason,
        });
        continue;
      }
      const existing = winners.get(skill.name);
      if (existing && SOURCE_RANK[existing.source] > SOURCE_RANK[skill.source]) {
        continue;
      }
      if (existing) {
        diagnostics.push({
          path: existing.root,
          source: existing.source,
          message: `Shadowed by ${skill.source} skill ${skill.name}`,
          shadowedBy: skill.root,
        });
      }
      winners.set(skill.name, skill);
    }
  }
  return {
    skills: [...winners.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    diagnostics,
  };
}
