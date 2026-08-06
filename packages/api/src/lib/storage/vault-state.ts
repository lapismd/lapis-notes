import type { DataAdapter } from "./fs";
import {
  createStore,
  del,
  get,
  getMany,
  keys,
  set,
  setMany,
  type UseStore,
} from "./keyval";

export type VaultStorageKind =
  | "opfs"
  | "file-system-access"
  | "desktop-folder";

export type BootstrapAppearanceMode = "dark" | "light" | "system";

export interface VaultProfileDemoMetadata {
  source: "e2e-vault";
  fixtureVersion: string;
}

export interface VaultProfile {
  id: string;
  name: string;
  kind: VaultStorageKind;
  createdAt: number;
  updatedAt: number;
  handle?: unknown;
  demo?: VaultProfileDemoMetadata;
}

export interface KeyValueStore {
  get<T = unknown>(key: IDBValidKey): Promise<T | undefined>;
  set(key: IDBValidKey, value: unknown): Promise<void>;
  setMany(entries: [IDBValidKey, unknown][]): Promise<void>;
  getMany<T = unknown>(keys: IDBValidKey[]): Promise<T[]>;
  del(key: IDBValidKey): Promise<void>;
  keys(): Promise<IDBValidKey[]>;
}

export class IndexedDbKeyValueStore implements KeyValueStore {
  constructor(
    readonly dbName: string = "lapis-notes-vault-state",
    readonly storeName: string = "state",
    readonly store: UseStore = createStore(dbName, storeName),
  ) {}

  get<T = unknown>(key: IDBValidKey): Promise<T | undefined> {
    return get<T>(key, this.store);
  }

  set(key: IDBValidKey, value: unknown): Promise<void> {
    return set(key, value, this.store);
  }

  setMany(entries: [IDBValidKey, unknown][]): Promise<void> {
    return setMany(entries, this.store);
  }

  getMany<T = unknown>(items: IDBValidKey[]): Promise<T[]> {
    return getMany<T>(items, this.store);
  }

  del(key: IDBValidKey): Promise<void> {
    return del(key, this.store);
  }

  keys(): Promise<IDBValidKey[]> {
    return keys(this.store);
  }
}

export class MemoryKeyValueStore implements KeyValueStore {
  private values = new Map<IDBValidKey, unknown>();

  async get<T = unknown>(key: IDBValidKey): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async set(key: IDBValidKey, value: unknown): Promise<void> {
    this.values.set(key, value);
  }

  async setMany(entries: [IDBValidKey, unknown][]): Promise<void> {
    entries.forEach(([key, value]) => this.values.set(key, value));
  }

  async getMany<T = unknown>(keys: IDBValidKey[]): Promise<T[]> {
    return keys.map((key) => this.values.get(key) as T);
  }

  async del(key: IDBValidKey): Promise<void> {
    this.values.delete(key);
  }

  async keys(): Promise<IDBValidKey[]> {
    return [...this.values.keys()];
  }
}

let defaultStore: KeyValueStore | null = null;

export function getDefaultVaultStateStore(): KeyValueStore {
  defaultStore ||= new IndexedDbKeyValueStore();
  return defaultStore;
}

export function setDefaultVaultStateStore(store: KeyValueStore | null): void {
  defaultStore = store;
}

export class ScopedVaultStore {
  constructor(
    readonly vaultId: string,
    readonly namespace: string,
    readonly store: KeyValueStore = getDefaultVaultStateStore(),
  ) {}

  private key(key: IDBValidKey): string {
    return `vault:${this.vaultId}:${this.namespace}:${String(key)}`;
  }

  get<T = unknown>(key: IDBValidKey): Promise<T | undefined> {
    return this.store.get<T>(this.key(key));
  }

  set(key: IDBValidKey, value: unknown): Promise<void> {
    return this.store.set(this.key(key), value);
  }

  setMany(entries: [IDBValidKey, unknown][]): Promise<void> {
    return this.store.setMany(
      entries.map(([key, value]) => [this.key(key), value]),
    );
  }

  getMany<T = unknown>(items: IDBValidKey[]): Promise<T[]> {
    return this.store.getMany<T>(items.map((key) => this.key(key)));
  }

  del(key: IDBValidKey): Promise<void> {
    return this.store.del(this.key(key));
  }

  async keys(): Promise<string[]> {
    const prefix = this.key("");
    return (await this.store.keys())
      .map(String)
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  }
}

export function getAdapterVaultId(adapter: DataAdapter): string {
  const candidate = adapter as DataAdapter & { getVaultId?: () => string };
  return candidate.getVaultId?.() ?? `adapter:${adapter.getName()}`;
}

const CURRENT_PROFILE_KEY = "profile:current";
const PROFILE_PREFIX = "profile:";
const BOOTSTRAP_APPEARANCE_MODE_KEY = "bootstrap:appearance:baseColorSchema";

function profileKey(id: string): string {
  return `${PROFILE_PREFIX}${id}`;
}

function isBootstrapAppearanceMode(
  value: unknown,
): value is BootstrapAppearanceMode {
  return value === "dark" || value === "light" || value === "system";
}

export async function saveVaultProfile(
  profile: VaultProfile,
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<void> {
  await store.setMany([
    [profileKey(profile.id), profile],
    [CURRENT_PROFILE_KEY, profile.id],
  ]);
}

export async function replaceVaultProfile(
  previousId: string,
  profile: VaultProfile,
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<void> {
  const currentId = await store.get<string>(CURRENT_PROFILE_KEY);
  if (previousId !== profile.id) {
    await store.del(profileKey(previousId));
  }

  await store.set(profileKey(profile.id), profile);
  if (currentId === previousId || currentId === profile.id) {
    await store.set(CURRENT_PROFILE_KEY, profile.id);
  }
}

export async function deleteVaultProfile(
  id: string,
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<void> {
  const currentId = await store.get<string>(CURRENT_PROFILE_KEY);
  await store.del(profileKey(id));
  if (currentId === id) {
    await store.del(CURRENT_PROFILE_KEY);
  }
}

export async function clearVaultScopedState(
  vaultId: string,
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<void> {
  const prefix = `vault:${vaultId}:`;
  const keysToDelete = (await store.keys())
    .map(String)
    .filter((key) => key.startsWith(prefix));
  await Promise.all(keysToDelete.map((key) => store.del(key)));
}

export async function getVaultProfile(
  id: string,
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<VaultProfile | undefined> {
  return store.get<VaultProfile>(profileKey(id));
}

export async function getCurrentVaultProfile(
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<VaultProfile | undefined> {
  const id = await store.get<string>(CURRENT_PROFILE_KEY);
  return id ? getVaultProfile(id, store) : undefined;
}

export async function clearCurrentVaultProfile(
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<void> {
  await store.del(CURRENT_PROFILE_KEY);
}

export async function listVaultProfiles(
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<VaultProfile[]> {
  const profileKeys = (await store.keys())
    .map(String)
    .filter(
      (key) => key.startsWith(PROFILE_PREFIX) && key !== CURRENT_PROFILE_KEY,
    );
  return (await store.getMany<VaultProfile>(profileKeys))
    .filter(Boolean)
    .sort((left, right) => {
      const updatedDelta = (right.updatedAt ?? 0) - (left.updatedAt ?? 0);
      if (updatedDelta !== 0) {
        return updatedDelta;
      }

      const createdDelta = (right.createdAt ?? 0) - (left.createdAt ?? 0);
      if (createdDelta !== 0) {
        return createdDelta;
      }

      return left.name.localeCompare(right.name);
    });
}

export async function getBootstrapAppearanceMode(
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<BootstrapAppearanceMode> {
  const stored = await store.get<unknown>(BOOTSTRAP_APPEARANCE_MODE_KEY);
  return isBootstrapAppearanceMode(stored) ? stored : "system";
}

export async function saveBootstrapAppearanceMode(
  mode: BootstrapAppearanceMode,
  store: KeyValueStore = getDefaultVaultStateStore(),
): Promise<void> {
  await store.set(BOOTSTRAP_APPEARANCE_MODE_KEY, mode);
}

export type BrowserVaultIdPrefix = "opfs";

export function generateBrowserVaultId(
  prefix: BrowserVaultIdPrefix,
  name: string,
): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "vault";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${slug}-${suffix}`;
}
