import type { VaultAdapter, VaultIdentityAdapter } from "./storage/fs";
import { sha256Hex } from "./plugin-distribution/hashes";
import { assertSkillRelativePath, SKILL_NAME_PATTERN } from "./agent-skills";

export interface AgentSkillContribution {
  name: string;
  directory: string;
}
export interface PackagedSkill {
  name: string;
  source: string;
  version: string;
  files: Readonly<Record<string, string>>;
}
export type SkillAction = "list" | "install" | "update";
export interface SkillManagementResult {
  name: string;
  source: string;
  version: string;
  status: "available" | "installed" | "updated" | "unchanged" | "skipped";
  reason?: string;
}
export interface SkillManagementHost {
  manage(action: SkillAction, skill?: string): Promise<SkillManagementResult[]>;
}
interface RecordEntry {
  source: string;
  version: string;
  files: Record<string, string>;
  pending?: boolean;
}
interface Receipt {
  schemaVersion: 1;
  skills: Record<string, RecordEntry>;
}
const receiptPath = ".agents/.lapis-skills.json";
const queues = new WeakMap<VaultAdapter, Promise<unknown>>();

export function isAgentSkillContribution(
  value: unknown,
): value is AgentSkillContribution {
  if (!value || typeof value !== "object") return false;
  const { name, directory } = value as AgentSkillContribution;
  if (
    typeof name !== "string" ||
    !SKILL_NAME_PATTERN.test(name) ||
    typeof directory !== "string"
  )
    return false;
  try {
    return assertSkillRelativePath(directory, "Skill directory") === directory;
  } catch {
    return false;
  }
}
function validFiles(files: Record<string, unknown>, hashes = false): boolean {
  if (!files || typeof files !== "object" || Array.isArray(files)) return false;
  return (
    Object.keys(files).length > 0 &&
    Object.keys(files).length <= 128 &&
    Object.entries(files).every(([path, value]) => {
      try {
        return (
          assertSkillRelativePath(path, "Skill file") === path &&
          typeof value === "string" &&
          (!hashes || /^[a-f0-9]{64}$/.test(value))
        );
      } catch {
        return false;
      }
    })
  );
}
function parseReceipt(text: string | null): Receipt {
  if (text === null) return { schemaVersion: 1, skills: {} };
  try {
    const value = JSON.parse(text) as Receipt;
    if (
      value.schemaVersion !== 1 ||
      !value.skills ||
      typeof value.skills !== "object" ||
      Array.isArray(value.skills)
    )
      throw new Error();
    for (const [name, entry] of Object.entries(value.skills)) {
      if (
        !SKILL_NAME_PATTERN.test(name) ||
        !entry ||
        typeof entry.source !== "string" ||
        !entry.source ||
        typeof entry.version !== "string" ||
        !entry.version ||
        !entry.files ||
        !validFiles(entry.files, true) ||
        (entry.pending !== undefined && typeof entry.pending !== "boolean")
      )
        throw new Error();
    }
    return value;
  } catch {
    throw new Error(
      "Invalid skill installation receipt; existing files were preserved.",
    );
  }
}
async function snapshot(
  adapter: VaultAdapter,
  root: string,
  prefix = "",
): Promise<Record<string, string>> {
  const files: Record<string, string> = Object.create(null);
  if (!(await adapter.exists(root))) return files;
  const listing = await adapter.list(root);
  for (const child of listing.files) {
    assertSkillRelativePath(child, "Installed skill child");
    if (child.includes("/"))
      throw new Error("Skill file escaped its directory");
    const file = `${root}/${child}`;
    const name = prefix + child;
    assertSkillRelativePath(name, "Installed skill file");
    files[name] = await adapter.read(file);
  }
  for (const child of listing.folders) {
    assertSkillRelativePath(child, "Installed skill child");
    if (child.includes("/"))
      throw new Error("Skill folder escaped its directory");
    Object.assign(
      files,
      await snapshot(adapter, `${root}/${child}`, prefix + child + "/"),
    );
  }
  return files;
}
async function hashes(
  files: Readonly<Record<string, string>>,
): Promise<Record<string, string>> {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(files)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(async ([path, body]) => [path, await sha256Hex(body)]),
    ),
  );
}
function equal(a: Record<string, string>, b: Record<string, string>): boolean {
  return (
    Object.keys(a).length === Object.keys(b).length &&
    Object.entries(a).every(([key, value]) => b[key] === value)
  );
}
/**
 * Only portable browser stores should use this implementation. Native hosts own
 * their writer.
 */
export async function manageSkills(
  adapter: VaultAdapter,
  bundles: readonly PackagedSkill[],
  action: SkillAction,
  selected?: string,
): Promise<SkillManagementResult[]> {
  const previous = queues.get(adapter) ?? Promise.resolve();
  const vaultId = (adapter as Partial<VaultIdentityAdapter>).getVaultId?.();
  const locks = globalThis.navigator?.locks;
  const run = () => execute(adapter, bundles, action, selected);
  const task = previous
    .catch(() => {})
    .then(() =>
      vaultId && locks ? locks.request(`lapis-skills:${vaultId}`, run) : run(),
    );
  queues.set(adapter, task);
  try {
    return await task;
  } finally {
    if (queues.get(adapter) === task) queues.delete(adapter);
  }
}
async function execute(
  adapter: VaultAdapter,
  bundles: readonly PackagedSkill[],
  action: SkillAction,
  selected?: string,
): Promise<SkillManagementResult[]> {
  if (!["list", "install", "update"].includes(action))
    throw new Error("Invalid skill action");
  const seen = new Set<string>();
  for (const bundle of bundles) {
    if (
      !SKILL_NAME_PATTERN.test(bundle.name) ||
      !bundle.source ||
      !bundle.version ||
      !bundle.files["SKILL.md"] ||
      !validFiles(bundle.files)
    )
      throw new Error("Invalid packaged skill");
    if (seen.has(bundle.name))
      throw new Error(`Duplicate skill contribution: ${bundle.name}`);
    seen.add(bundle.name);
  }
  if (selected && !seen.has(selected))
    throw new Error(`Skill is unavailable: ${selected}`);
  if (action !== "list" && !adapter.writeTextIfUnchanged)
    throw new Error("Skill installation requires conditional writes");
  let receiptText = (await adapter.exists(receiptPath))
    ? await adapter.read(receiptPath)
    : null;
  const receipt = parseReceipt(receiptText);
  const save = async () => {
    await adapter.mkdir(".agents", { recursive: true });
    const next = JSON.stringify(receipt, null, 2) + "\n";
    await adapter.writeTextIfUnchanged!(receiptPath, next, receiptText);
    receiptText = next;
  };
  const results: SkillManagementResult[] = [];
  for (const bundle of bundles.filter(
    (s) => !selected || s.name === selected,
  )) {
    const result: SkillManagementResult = {
      name: bundle.name,
      source: bundle.source,
      version: bundle.version,
      status: "available",
    };
    const root = `.agents/skills/${bundle.name}`;
    const exists = await adapter.exists(root);
    const installed = Object.hasOwn(receipt.skills, bundle.name)
      ? receipt.skills[bundle.name]
      : undefined;
    const current = await snapshot(adapter, root);
    const actual = await hashes(current);
    const incoming = await hashes(bundle.files);
    const reason = installed?.pending
      ? "interrupted"
      : exists && !installed
        ? "unmanaged"
        : installed && installed.source !== bundle.source
          ? "owner-changed"
          : installed && (!exists || !equal(installed.files, actual))
            ? "locally-modified"
            : undefined;
    if (reason) {
      result.status = "skipped";
      result.reason = reason;
    } else if (exists && equal(actual, incoming)) result.status = "unchanged";
    else if (action === "list") result.status = "available";
    else if (action === "install" && exists) {
      result.status = "skipped";
      result.reason = "update-available";
    } else if (action === "update" && !installed) {
      result.status = "skipped";
      result.reason = "not-installed";
    } else {
      receipt.skills[bundle.name] = {
        source: bundle.source,
        version: bundle.version,
        files: incoming,
        pending: true,
      };
      await save();
      // Recheck the complete tree after the durable intent and before any content write.
      if (!equal(await hashes(await snapshot(adapter, root)), actual))
        throw new Error("Skill changed during installation");
      for (const [file, body] of Object.entries(bundle.files)) {
        const destination = `${root}/${file}`;
        await adapter.mkdir(
          destination.slice(0, destination.lastIndexOf("/")),
          { recursive: true },
        );
        await adapter.writeTextIfUnchanged!(
          destination,
          body,
          current[file] ?? null,
        );
      }
      for (const file of Object.keys(current).filter(
        (file) => !Object.hasOwn(bundle.files, file),
      )) {
        const destination = `${root}/${file}`;
        if ((await adapter.read(destination)) !== current[file])
          throw new Error("Skill changed during installation");
        await adapter.remove(destination);
      }
      if (!equal(await hashes(await snapshot(adapter, root)), incoming))
        throw new Error("Skill changed during installation");
      receipt.skills[bundle.name].pending = false;
      await save();
      result.status = exists ? "updated" : "installed";
    }
    results.push(result);
  }
  return results;
}
