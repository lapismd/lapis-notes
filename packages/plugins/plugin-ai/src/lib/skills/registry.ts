import { SkillDiscovery, type SkillDiscoveryOptions } from "./discovery";
import type {
  AppSkillDescriptor,
  LoadedAppSkill,
  SkillActivation,
  SkillDiagnostic,
  SkillDiscoveryContext,
  SkillSnapshot,
  SkillSnapshotEntry,
} from "./types";

export class SkillRegistry {
  readonly #discovery: SkillDiscovery;
  readonly #loaded = new Map<string, LoadedAppSkill>();
  readonly #history = new Map<string, LoadedAppSkill>();
  #generation = 0;
  diagnostics: SkillDiagnostic[] = [];

  constructor(options: SkillDiscoveryOptions) {
    this.#discovery = new SkillDiscovery(options);
  }

  invalidate(): void {
    this.#generation += 1;
    this.#loaded.clear();
  }

  async discover(
    context: SkillDiscoveryContext,
  ): Promise<readonly AppSkillDescriptor[]> {
    const discovered = await this.#discovery.discover(context);
    this.diagnostics = discovered.diagnostics;
    this.#loaded.clear();
    for (const skill of discovered.skills) {
      this.#loaded.set(skill.id, skill);
      this.#history.set(`${skill.id}@${skill.version}`, skill);
    }
    return discovered.skills;
  }

  async resolve(
    name: string,
    context: SkillDiscoveryContext,
  ): Promise<AppSkillDescriptor | undefined> {
    const skills = await this.discover(context);
    return skills.find((skill) => skill.name === name);
  }

  async load(
    id: string,
    version: string,
  ): Promise<LoadedAppSkill> {
    const loaded =
      this.#history.get(`${id}@${version}`) ??
      this.#loaded.get(id) ??
      [...this.#history.values()].find(
        (skill) =>
          skill.version === version &&
          (skill.id === id || skill.name === id),
      );
    if (!loaded || loaded.version !== version) {
      throw new Error(`Skill is not available: ${id}`);
    }
    return loaded;
  }

  async snapshot(context: SkillDiscoveryContext): Promise<SkillSnapshot> {
    const skills = await this.discover(context);
    const entries: SkillSnapshotEntry[] = skills.map((skill) => ({
      skillId: skill.id,
      name: skill.name,
      description: skill.description,
      version: skill.version,
      userInvocable: skill.userInvocable,
      modelInvocable: skill.modelInvocable,
      argumentHint: skill.argumentHint,
    }));
    return Object.freeze({
      id: `skill-snapshot-${this.#generation}-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      skills: Object.freeze(entries),
    });
  }

  async activate(
    name: string,
    context: SkillDiscoveryContext,
    source: SkillActivation["source"],
    args?: string,
  ): Promise<SkillActivation> {
    const descriptor = await this.resolve(name, context);
    if (!descriptor) {
      throw new Error(`Unknown skill: ${name}`);
    }
    const loaded = await this.load(descriptor.id, descriptor.version);
    return {
      skillId: loaded.id,
      skillName: loaded.name,
      version: loaded.version,
      source,
      arguments: args,
      instructions: loaded.instructions,
    };
  }

  getLoaded(name: string): LoadedAppSkill | undefined {
    return [...this.#loaded.values()].find((skill) => skill.name === name);
  }
}

export class SkillSnapshotStore {
  readonly #snapshots = new Map<string, SkillSnapshot>();

  set(bindingId: string, snapshot: SkillSnapshot): void {
    this.#snapshots.set(bindingId, snapshot);
  }

  get(bindingId: string): SkillSnapshot | undefined {
    return this.#snapshots.get(bindingId);
  }

  close(bindingId: string): void {
    this.#snapshots.delete(bindingId);
  }

  clear(): void {
    this.#snapshots.clear();
  }
}
