import type { App } from "./context.svelte";
import type { TFile } from "./storage";
import {
  DailyDocumentProviderRegistry,
  formatDailyDocumentFilename,
  registerDefaultDailyDocumentProvider,
} from "./daily-document-provider";
import type { DailyReferenceInput } from "./native-daily-inputs.test.fixture";

export function retainedError(value: unknown) {
  const error = value as Error;
  return { name: error.name, message: error.message };
}

function file(path: string): TFile {
  const name = path.split("/").at(-1)!;
  return { path, name, baseName: name.replace(/\.[^.]+$/u, ""),
    extension: name.split(".").at(-1)!, stat: { ctime: 0, mtime: 0, size: 0 } } as TFile;
}

/** Calls the retained provider with explicit storage and cached metadata only. */
export async function captureProvider(input: DailyReferenceInput) {
  const contents = new Map(Object.entries(input.files ?? {}));
  const files = new Map([...contents.keys()].map((path) => [path, file(path)] as const));
  const trace: unknown[] = [];
  const schema: unknown[] = [];
  const app = {
    dailyDocumentProviders: new DailyDocumentProviderRegistry(),
    configuration: {
      schema: { register: (value: unknown) => schema.push(value),
        unregister: (value: unknown) => trace.push({ kind: "unregister", schema: value }) },
      getConfiguration: () => ({ get: (key: string, fallback: unknown) =>
        input.configuration?.[key] ?? fallback }),
    },
    metadataCache: { getFileCacheAsync: async (candidate: TFile) => {
      trace.push({ kind: "cache", path: candidate.path });
      const frontmatter = input.cached?.[candidate.path];
      return frontmatter === undefined ? null : { frontmatter };
    } },
    vault: {
      getMarkdownFiles: () => [...files.values()].filter((value) => value.extension === "md"),
      getFileByPath: (path: string) => files.get(path) ?? null,
      read: async (candidate: TFile) => {
        trace.push({ kind: "read", path: candidate.path });
        return contents.get(candidate.path)!;
      },
      mkpath: async (path: string) => { trace.push({ kind: "mkpath", path }); },
      create: async (path: string, raw: string) => {
        trace.push({ kind: "create", path, raw });
        const candidate = file(path);
        files.set(path, candidate);
        contents.set(path, raw);
        return candidate;
      },
    },
  } as unknown as App;
  const registration = registerDefaultDailyDocumentProvider(app);
  let result: unknown;
  try {
    const provider = app.dailyDocumentProviders.resolve();
    const found = await provider[input.operation](input.date);
    result = { value: found?.path ?? null, providerId: provider.id };
  } catch (error) { result = { error: retainedError(error) }; }
  registration.dispose();
  return { result, files: Object.fromEntries(contents), trace, schema };
}

export function captureFilename(input: { date: string; format: string }) {
  try { return { value: formatDailyDocumentFilename(input.date, input.format) }; }
  catch (error) { return { error: retainedError(error) }; }
}

export function captureRegistry() {
  const registry = new DailyDocumentProviderRegistry();
  const changes: unknown[] = [];
  registry.on("changed", (value) => changes.push(value));
  const results: unknown[] = [];
  const registrations = new Map<string, { dispose(): void }>();
  const actions = [
    { type: "resolve" },
    { type: "register", id: " default ", priority: 0 },
    { type: "resolve" },
    { type: "register", id: "override", priority: 10 },
    { type: "resolve" },
    { type: "register", id: "default", priority: 11 },
    { type: "register", id: "", priority: 0 },
    { type: "register", id: "\ufeff", priority: 0 },
    { type: "register", id: "infinite", priority: Infinity },
    { type: "register", id: "nan", priority: NaN },
    { type: "register", id: "other", priority: 10 },
    { type: "resolve" },
    { type: "dispose", id: "override" },
    { type: "resolve" },
    { type: "dispose", id: "override" },
    { type: "dispose", id: "other" },
    { type: "resolve" },
    { type: "dispose", id: "default" },
    { type: "resolve" },
  ];
  for (const action of actions) {
    let result: unknown;
    try {
      if (action.type === "register") {
        const registration = registry.register({ id: action.id!, priority: action.priority,
          locate: async () => null, ensure: async () => file(`${action.id}.md`) });
        registrations.set(registration.id, registration);
        result = { id: registration.id };
      } else if (action.type === "dispose") {
        registrations.get(action.id!)!.dispose(); result = { disposed: action.id };
      } else { result = { selected: registry.resolve().id }; }
    } catch (error) { result = { error: retainedError(error) }; }
    results.push({ action: { ...action,
      ...(action.priority === Infinity ? { priority: "Infinity" } : {}),
      ...(Number.isNaN(action.priority) ? { priority: "NaN" } : {}) }, result,
      providers: registry.getAll().map(({ id, priority }) => ({ id, priority })),
      changes: [...changes] });
  }
  return results;
}
