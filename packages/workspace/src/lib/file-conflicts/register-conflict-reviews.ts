import type { App } from "@lapis-notes/api";
import { SvelteSet } from "svelte/reactivity";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import {
  CONFLICT_REVIEW_VIEW,
  ConflictReviewView,
} from "./conflict-review-view";
import { ConflictReviewState } from "./conflict-review-state.svelte";

const prefix = "lapis-file-conflict:";

export interface FileConflictReviewOptions {
  /** Host-owned leave/startup inhibition, read on every action and render. */
  disabled?: () => boolean;
}

type Binding = {
  references: number;
  disabled: SvelteSet<() => boolean>;
  dispose(): void;
};
const bindings = new WeakMap<App, Binding>();

/** One presentation owner per App, shared by early host and mounted shell leases. */
export function bindFileConflictReviews(
  app: App,
  options: FileConflictReviewOptions = {},
): () => void {
  let binding = bindings.get(app);
  if (!binding) {
    const disabled = new SvelteSet<() => boolean>();
    binding = {
      references: 0,
      disabled,
      dispose: registerConflictReviews(app, () =>
        [...disabled].some((read) => read()),
      ),
    };
    bindings.set(app, binding);
  }
  const owned = binding;
  const disabled = () => options.disabled?.() ?? false;
  owned.disabled.add(disabled);
  owned.references++;
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    owned.disabled.delete(disabled);
    if (--owned.references === 0) {
      owned.dispose();
      bindings.delete(app);
    }
  };
}

function registerConflictReviews(
  app: App,
  disabled: () => boolean,
): () => void {
  const registry = app.fileEditingSessions.textConflicts;
  const model = new ConflictReviewState(registry, disabled);
  const controller = getWorkspaceHostBinding(app.workspace).controller;
  const collection = app.workspace.diagnostics.createCollection(
    "desktop:file-conflicts",
    { label: "File conflicts" },
  );
  app.workspace.registerView(
    CONFLICT_REVIEW_VIEW,
    (leaf) => new ConflictReviewView(leaf, model),
  );
  const stopNavigation = app.workspace.registerDiagnosticOpener(
    async (location) => {
      if (!location.resource.uri.startsWith(prefix)) return false;
      if (!active) return true;
      const path = decodeURIComponent(
        location.resource.uri.slice(prefix.length),
      );
      if (!model.entries.some((entry) => entry.path === path)) return true;
      let leaf = app.workspace
        .getLeavesOfType(CONFLICT_REVIEW_VIEW)
        .find((leaf) => leaf.view.getState().path === path);
      if (!leaf) {
        leaf = app.workspace.getLeaf("tab");
        await leaf.setViewState({
          type: CONFLICT_REVIEW_VIEW,
          state: { path },
        });
      }
      if (!active) return true;
      app.workspace.setActiveLeaf(leaf);
      if (!active) return true;
      await app.workspace.revealLeaf(leaf);
      if (!active) return true;
      app.workspace.requestSaveLayout({
        source: "api",
        operation: "open-file-conflict",
      });
      return true;
    },
  );
  let active = true;
  let paths = new Set<string>();
  const stopRegistry = registry.subscribe((entries) => {
    model.entries = entries;
    if (!entries.length) model.error = "";
    const current = new Set(entries.map((entry) => entry.path));
    for (const path of paths)
      if (!current.has(path)) {
        collection.delete({ uri: prefix + encodeURIComponent(path) });
        model.results.delete(path);
      }
    for (const entry of entries) {
      collection.set(
        {
          uri: prefix + encodeURIComponent(entry.path),
          label: entry.path,
          icon: "file-warning",
        },
        [
          {
            message:
              entry.external === undefined
                ? "The disk version could not be read. Review the retained draft."
                : entry.external === null
                  ? "The file was deleted on disk. Review the retained draft."
                  : "File changed on disk. Review your draft before saving.",
            severity: "error",
            source: "File conflicts",
            code: "write-conflict",
          },
        ],
      );
    }
    const added = [...current].some((path) => !paths.has(path));
    paths = current;
    for (const leaf of app.workspace.getLeavesOfType(CONFLICT_REVIEW_VIEW)) {
      if (!current.has(String(leaf.view.getState().path)))
        controller.workspace.closeLeaf(leaf.id);
    }
    if (added)
      void controller
        .start()
        .then(async () => {
          if (active)
            await controller.commands.execute("app-shell:show-problems");
        })
        .catch((error) => {
          if (active)
            app.notifications.notify({
              severity: "error",
              source: "files",
              message: String(error),
            });
        });
  });
  return () => {
    active = false;
    stopRegistry();
    stopNavigation();
    collection.dispose();
    app.workspace.unregisterView(CONFLICT_REVIEW_VIEW);
  };
}
