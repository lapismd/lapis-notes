import { EventDispatcher } from "./events";

export type EditorViewPriority = "default" | "option" | "exclusive";

export type EditorViewContribution = {
  id: string;
  viewType?: string;
  label: string;
  description?: string;
  filenamePatterns?: string[];
  priority?: EditorViewPriority;
  pluginId?: string;
  source?: "core" | "plugin" | "manifest" | "compat";
  activationEvent?: string;
};

export type RegisteredEditorViewContribution = EditorViewContribution & {
  viewType: string;
  filenamePatterns: string[];
  priority: EditorViewPriority;
};

export type EditorViewRegistryChange = {
  id: string;
  action: "registered" | "updated" | "unregistered";
};

function normalizeString(value: string): string {
  return value.trim();
}

function uniqueStrings(values: readonly string[] = []): string[] {
  return [...new Set(values.map(normalizeString).filter(Boolean))];
}

function normalizeContribution(
  contribution: EditorViewContribution,
): RegisteredEditorViewContribution {
  const id = normalizeString(contribution.id);
  if (!id) {
    throw new Error("Editor view contribution id must not be empty.");
  }

  const label = normalizeString(contribution.label);
  if (!label) {
    throw new Error(`Editor view contribution ${id} label must not be empty.`);
  }

  return {
    ...contribution,
    id,
    viewType: normalizeString(contribution.viewType ?? id),
    label,
    filenamePatterns: uniqueStrings(contribution.filenamePatterns),
    priority: contribution.priority ?? "option",
  };
}

function mergeContribution(
  current: RegisteredEditorViewContribution,
  next: EditorViewContribution,
): RegisteredEditorViewContribution {
  const normalized = normalizeContribution({ ...current, ...next });
  return {
    ...current,
    ...normalized,
    filenamePatterns: uniqueStrings([
      ...current.filenamePatterns,
      ...normalized.filenamePatterns,
    ]),
  };
}

export class EditorViewRegistry extends EventDispatcher<{
  changed: [change: EditorViewRegistryChange];
}> {
  private readonly views = new Map<string, RegisteredEditorViewContribution>();

  register(contribution: EditorViewContribution): () => void {
    const normalized = normalizeContribution(contribution);
    if (this.views.has(normalized.id)) {
      console.warn(`Editor view ${normalized.id} is already registered.`);
      return () => {};
    }

    this.views.set(normalized.id, normalized);
    this.emit("changed", { id: normalized.id, action: "registered" });

    return () => {
      this.unregister(normalized.id);
    };
  }

  upsert(contribution: EditorViewContribution): () => void {
    const normalized = normalizeContribution(contribution);
    const existing = this.views.get(normalized.id);
    if (!existing) {
      return this.register(normalized);
    }

    const merged = mergeContribution(existing, normalized);
    this.views.set(merged.id, merged);
    this.emit("changed", { id: merged.id, action: "updated" });
    return () => {};
  }

  update(id: string, contribution: Partial<EditorViewContribution>): boolean {
    const existing = this.views.get(id);
    if (!existing) {
      return false;
    }

    const merged = mergeContribution(existing, {
      ...existing,
      ...contribution,
      id: existing.id,
      label: contribution.label ?? existing.label,
    });
    this.views.set(existing.id, merged);
    this.emit("changed", { id: existing.id, action: "updated" });
    return true;
  }

  removeFilenamePatterns(id: string, patterns: readonly string[]): boolean {
    const existing = this.views.get(id);
    if (!existing) {
      return false;
    }

    const removedPatterns = new Set(uniqueStrings(patterns));
    const filenamePatterns = existing.filenamePatterns.filter(
      (pattern) => !removedPatterns.has(pattern),
    );
    if (filenamePatterns.length === existing.filenamePatterns.length) {
      return false;
    }

    if (filenamePatterns.length === 0 && existing.source === "compat") {
      this.views.delete(id);
      this.emit("changed", { id, action: "unregistered" });
      return true;
    }

    this.views.set(id, { ...existing, filenamePatterns });
    this.emit("changed", { id, action: "updated" });
    return true;
  }

  unregister(id: string): boolean {
    const deleted = this.views.delete(id);
    if (deleted) {
      this.emit("changed", { id, action: "unregistered" });
    }
    return deleted;
  }

  get(id: string): RegisteredEditorViewContribution | undefined {
    return this.views.get(id);
  }

  getByViewType(viewType: string): RegisteredEditorViewContribution[] {
    return this.getAll().filter((view) => view.viewType === viewType);
  }

  getAll(): RegisteredEditorViewContribution[] {
    return [...this.views.values()].sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }
}
