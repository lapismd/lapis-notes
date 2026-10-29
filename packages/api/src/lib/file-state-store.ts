import type { App } from "./context.svelte";
import { FileTextStateWriter } from "./file-text-state-writer";
import { TFile } from "./storage/fs";
import { normalizePath } from "./storage/path";

const stores = new WeakMap<App, Map<string, FileTextStateWriter>>();

function writer(
  app: App,
  path: string,
  baseline?: string | null,
  reset: (text: string) => void | Promise<void> = () => {},
): FileTextStateWriter {
  path = normalizePath(path).replace(/^\/+/, "");
  let store = stores.get(app);
  if (!store) stores.set(app, (store = new Map()));
  let entry = store.get(path);
  if (!entry) {
    const file =
      app.vault.getFileByPath(path) ??
      new TFile(path, { ctime: 0, mtime: 0, size: 0 }, null);
    entry = new FileTextStateWriter(app, file, baseline, reset, {
      recoverOutsideQueue: true,
    });
    store.set(path, entry);
  }
  return entry;
}

/** Capture the acknowledged state while the owner loads, before edits begin. */
export async function readFileState(
  app: App,
  path: string,
  reset?: (text: string) => void | Promise<void>,
): Promise<string | null> {
  const state = app.vault.supportsConditionalTextWrites
    ? writer(app, path, undefined, reset)
    : undefined;
  const adapter = app.vault.adapter;
  const text = (await adapter.exists(path)) ? await adapter.read(path) : null;
  state?.acceptBaseline(text);
  return text;
}

/** Register synchronously so shutdown cannot overtake initial read or write IO. */
export function saveFileState(
  app: App,
  path: string,
  text: string,
): Promise<void> {
  return writer(app, path).set(text);
}
