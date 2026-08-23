import { join } from "jsr:@std/path@1/join";
import { userDataDir } from "./user-data.ts";

type StoreMap = Record<string, unknown>;

function storePath(): string {
  return join(userDataDir(), "vault-bootstrap.json");
}

async function readStore(): Promise<StoreMap> {
  try {
    return JSON.parse(await Deno.readTextFile(storePath())) as StoreMap;
  } catch {
    return {};
  }
}

async function writeStore(store: StoreMap): Promise<void> {
  await Deno.mkdir(userDataDir(), { recursive: true });
  const tempPath = `${storePath()}.tmp`;
  await Deno.writeTextFile(tempPath, JSON.stringify(store));
  await Deno.rename(tempPath, storePath());
}

export async function handleBootstrapKv(
  command: string,
  payload: Record<string, unknown> = {},
): Promise<unknown> {
  const store = await readStore();
  switch (command) {
    case "desktop_vault_bootstrap_kv_get":
      return store[String(payload.key)];
    case "desktop_vault_bootstrap_kv_set":
      store[String(payload.key)] = payload.value;
      await writeStore(store);
      return;
    case "desktop_vault_bootstrap_kv_set_many": {
      const entries = (payload.entries as [string, unknown][]) ?? [];
      for (const [key, value] of entries) store[String(key)] = value;
      await writeStore(store);
      return;
    }
    case "desktop_vault_bootstrap_kv_get_many": {
      const keys = (payload.keys as string[]) ?? [];
      return keys.map((key) => store[String(key)]);
    }
    case "desktop_vault_bootstrap_kv_del":
      delete store[String(payload.key)];
      await writeStore(store);
      return;
    case "desktop_vault_bootstrap_kv_keys":
      return Object.keys(store);
    case "desktop_vault_bootstrap_kv_is_empty":
      return Object.keys(store).length === 0;
    case "desktop_vault_bootstrap_kv_import_if_empty": {
      if (Object.keys(store).length > 0) return;
      const entries =
        (payload.entries as Array<{ key: string; value: unknown }>) ?? [];
      for (const entry of entries) store[entry.key] = entry.value;
      await writeStore(store);
      return;
    }
    default:
      throw new Error(`Unhandled bootstrap command: ${command}`);
  }
}
