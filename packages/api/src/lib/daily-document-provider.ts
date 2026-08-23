import { DateTime } from "luxon";
import type { App } from "./context.svelte";
import { EventDispatcher } from "./events";
import type { TFile } from "./storage";
import { parseYaml } from "./utils";

export const DEFAULT_DAILY_NOTES_FOLDER = "daily";
export const DEFAULT_DAILY_NOTES_DATE_FORMAT = "yyyy-MM-dd";

export type DailyDocumentProvider = {
  /** Stable application-wide provider id. */
  id: string;
  /** Higher priorities override lower-priority providers. */
  priority?: number;
  /** Find the canonical daily note for a local calendar date. */
  locate(date: string): Promise<TFile | null>;
  /** Find or create the canonical daily note for a local calendar date. */
  ensure(date: string): Promise<TFile>;
};

export type DailyDocumentProviderRegistration = {
  readonly id: string;
  dispose(): void;
};

export type DailyDocumentProviderChange = {
  providerId: string;
  reason: "registered" | "unregistered";
};

function validateProvider(provider: DailyDocumentProvider): void {
  if (!provider.id.trim()) {
    throw new Error("Daily document provider id must not be empty.");
  }
  if (!Number.isFinite(provider.priority ?? 0)) {
    throw new Error(
      `Daily document provider ${provider.id} must use a finite priority.`,
    );
  }
}

/** Public registry for the host-owned daily Markdown document policy. */
export class DailyDocumentProviderRegistry extends EventDispatcher<{
  changed: [change: DailyDocumentProviderChange];
}> {
  private readonly providers = new Map<string, DailyDocumentProvider>();

  register(provider: DailyDocumentProvider): DailyDocumentProviderRegistration {
    validateProvider(provider);
    const id = provider.id.trim();
    if (this.providers.has(id)) {
      throw new Error(`Daily document provider already registered: ${id}`);
    }

    const registered = { ...provider, id };
    this.providers.set(id, registered);
    this.emit("changed", { providerId: id, reason: "registered" });

    let disposed = false;
    return {
      id,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        if (this.providers.get(id) !== registered) return;
        this.providers.delete(id);
        this.emit("changed", { providerId: id, reason: "unregistered" });
      },
    };
  }

  getAll(): DailyDocumentProvider[] {
    return [...this.providers.values()];
  }

  resolve(): DailyDocumentProvider {
    const providers = this.getAll().sort(
      (left, right) =>
        (right.priority ?? 0) - (left.priority ?? 0) ||
        left.id.localeCompare(right.id),
    );
    const selected = providers[0];
    if (!selected) {
      throw new Error("No daily document provider is registered.");
    }
    const conflicting = providers[1];
    if (
      conflicting &&
      (conflicting.priority ?? 0) === (selected.priority ?? 0)
    ) {
      throw new Error(
        `Ambiguous daily document providers: ${selected.id}, ${conflicting.id}`,
      );
    }
    return selected;
  }
}

const DAILY_NOTES_CONFIGURATION_SCHEMA = {
  id: "dailyNotes",
  title: "Daily notes",
  type: "object",
  properties: {
    folder: {
      type: "string",
      default: DEFAULT_DAILY_NOTES_FOLDER,
      title: "Folder",
      description: "Vault folder used when a daily note must be created.",
    },
    dateFormat: {
      type: "string",
      default: DEFAULT_DAILY_NOTES_DATE_FORMAT,
      title: "Filename date format",
      description:
        "Luxon date format used for new daily-note filenames. It must produce one safe filename segment.",
    },
  },
} as const;

function assertLocalDate(date: string): DateTime {
  const parsed = DateTime.fromISO(date, { zone: "utc", setZone: true });
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date) || !parsed.isValid) {
    throw new Error(`Invalid local date: ${date}`);
  }
  return parsed;
}

export function formatDailyDocumentFilename(
  date: string,
  format: string,
): string {
  const trimmedFormat = format.trim();
  if (!trimmedFormat) {
    throw new Error("Daily-note date format must not be empty.");
  }
  const formatted = assertLocalDate(date).toFormat(trimmedFormat);
  if (
    !formatted ||
    formatted === "." ||
    formatted === ".." ||
    /[/\\\u0000-\u001f:]/u.test(formatted)
  ) {
    throw new Error(
      `Daily-note date format must produce one safe filename segment; received ${JSON.stringify(formatted)}.`,
    );
  }
  return `${formatted}.md`;
}

function normalizeDailyNotesFolder(folder: string): string {
  const normalized = folder
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+|\/+$/gu, "");
  if (
    !normalized ||
    normalized
      .split("/")
      .some((segment) => !segment || segment === "." || segment === "..") ||
    /[\u0000-\u001f:]/u.test(normalized)
  ) {
    throw new Error(`Invalid daily-note folder: ${JSON.stringify(folder)}.`);
  }
  return normalized;
}

function frontmatterFromContent(
  content: string,
): Record<string, unknown> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content);
  return match ? (parseYaml(match[1]) as Record<string, unknown>) : null;
}

async function dailyFrontmatter(
  app: App,
  file: TFile,
): Promise<Record<string, unknown> | null> {
  const cached = (await app.metadataCache.getFileCacheAsync(file))?.frontmatter;
  if (cached) return cached as Record<string, unknown>;
  return frontmatterFromContent(await app.vault.read(file));
}

function isCanonicalDailyFrontmatter(
  frontmatter: Record<string, unknown> | null,
  date: string,
): boolean {
  return frontmatter?.type === "daily-note" && frontmatter.date === date;
}

function dailyDocumentContent(date: string): string {
  return `---\ntype: daily-note\ndate: ${date}\n---\n\n# ${date}\n`;
}

/**
 * Install Lapis' default daily-note policy and its generated settings controls.
 * Hosts call this before loading configuration and dispose it with the App.
 */
export function registerDefaultDailyDocumentProvider(
  app: App,
): DailyDocumentProviderRegistration {
  app.configuration.schema.register(DAILY_NOTES_CONFIGURATION_SCHEMA);

  const locate = async (date: string): Promise<TFile | null> => {
    assertLocalDate(date);
    const matches: TFile[] = [];
    for (const file of app.vault.getMarkdownFiles()) {
      if (
        isCanonicalDailyFrontmatter(await dailyFrontmatter(app, file), date)
      ) {
        matches.push(file);
      }
    }
    if (matches.length > 1) {
      throw new Error(
        `Multiple daily notes declare date ${date}: ${matches.map((file) => file.path).join(", ")}`,
      );
    }
    return matches[0] ?? null;
  };

  const registration = app.dailyDocumentProviders.register({
    id: "lapis:daily-notes",
    locate,
    ensure: async (date) => {
      const existing = await locate(date);
      if (existing) return existing;

      const configuration = app.configuration.getConfiguration();
      const folder = normalizeDailyNotesFolder(
        configuration.get("dailyNotes.folder", DEFAULT_DAILY_NOTES_FOLDER),
      );
      const filename = formatDailyDocumentFilename(
        date,
        configuration.get(
          "dailyNotes.dateFormat",
          DEFAULT_DAILY_NOTES_DATE_FORMAT,
        ),
      );
      const path = `${folder}/${filename}`;
      const occupied = app.vault.getFileByPath(path);
      if (occupied) {
        const frontmatter = await dailyFrontmatter(app, occupied);
        if (isCanonicalDailyFrontmatter(frontmatter, date)) return occupied;
        throw new Error(
          `Cannot create daily note for ${date}: ${path} already exists without matching daily-note front matter.`,
        );
      }

      await app.vault.mkpath(folder);
      return app.vault.create(path, dailyDocumentContent(date));
    },
  });

  return {
    id: registration.id,
    dispose: () => {
      registration.dispose();
      app.configuration.schema.unregister(DAILY_NOTES_CONFIGURATION_SCHEMA);
    },
  };
}
