import type { App } from "./context.svelte";
import type {
  DiagnosticCollectionUpdate,
  WorkspaceDiagnostic,
} from "./diagnostics";
import type { NativeEditingProblemIssue } from "./file-editing-native-issues";
import type { EditingIntentState } from "./native-editing-intents";

const prefix = "lapis-editing-claim:";
const bindings = new WeakMap<App, { references: number; dispose(): void }>();
type Action =
  | { kind: "claim"; state: EditingIntentState }
  | { kind: "local"; issue: NativeEditingProblemIssue };

const claimCode = (state: EditingIntentState) =>
  `claim:${state.editor_id}:${state.generation}:${state.revision}:${+state.active}${+state.dirty}${+state.detached}`;
const issueCode = (issue: NativeEditingProblemIssue) =>
  `admission:${issue.registration}:${issue.id}:${issue.status}`;

/** Share one disposable Problems collection across every shell of the same App. */
export function bindNativeEditingProblems(app: App): () => void {
  const recovery = app.fileEditingSessions.nativeRecovery;
  if (!recovery) return () => {};
  let binding = bindings.get(app);
  if (!binding) {
    binding = createBinding(app);
    bindings.set(app, binding);
  }
  const owned = binding;
  owned.references++;
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    if (--owned.references === 0) {
      owned.dispose();
      bindings.delete(app);
    }
  };
}

function createBinding(app: App): { references: number; dispose(): void } {
  const registry = app.fileEditingSessions;
  const recovery = registry.nativeRecovery!;
  let active = true;
  let actions = new Map<string, Action>();
  let resources = new Set<string>();
  const run = async (operation: () => Promise<unknown>) => {
    if (!active) return;
    try {
      await operation();
    } catch (error) {
      if (active)
        app.notifications.notify({
          severity: "error",
          source: "editing",
          message: error instanceof Error ? error.message : String(error),
        });
    }
  };
  const openSavedFile = (path: string) =>
    registry.track(async () => {
      const file = app.vault.getFileByPath(path);
      if (!file) throw new Error("The saved file is no longer available");
      const leaf = app.workspace.getLeaf("tab");
      await leaf.openFile(file, {
        state: { type: leaf.view.getViewType(), state: { mode: "preview" } },
      });
      app.workspace.setActiveLeaf(leaf);
      await app.workspace.revealLeaf(leaf);
    });
  const collection = app.workspace.diagnostics.createCollection(
    "lapis:editing-claims",
    {
      label: "Editing",
      buildItemMenu(menu, entry) {
        const code = entry.diagnostic.code;
        const action = typeof code === "string" ? actions.get(code) : undefined;
        if (!active) return;
        if (!action) {
          if (code === "editing-observation-unavailable")
            menu.addItem((item) =>
              item
                .setTitle("Refresh editing claims")
                .setIcon("refresh-cw")
                .onClick(() =>
                  run(() => registry.track(() => recovery.refresh())),
                ),
            );
          return;
        }
        const path =
          action.kind === "claim" ? action.state.path : action.issue.path;
        menu.addItem((item) =>
          item
            .setTitle("Review saved file")
            .setIcon("file-text")
            .setDisabled(!app.vault.getFileByPath(path))
            .onClick(() => run(() => openSavedFile(path))),
        );
        if (action.kind === "claim") {
          const captured = action.state;
          menu.addItem((item) =>
            item
              .setTitle("Recover editing claim")
              .setIcon("rotate-ccw")
              .setDisabled(!captured.detached)
              .onClick(() => run(() => recovery.recover(captured))),
          );
          menu.addItem((item) =>
            item
              .setTitle("Discard editing claim")
              .setIcon("trash-2")
              .onClick(() => run(() => recovery.discard(captured))),
          );
        } else {
          const captured = action.issue;
          menu.addItem((item) =>
            item
              .setTitle("Retry editing admission")
              .setIcon("refresh-cw")
              .setDisabled(captured.status !== "failed")
              .onClick(() => run(() => registry.nativeIssues.retry(captured))),
          );
        }
      },
    },
  );
  const publish = () => {
    if (!active) return;
    const grouped = new Map<
      string,
      { path: string; diagnostics: WorkspaceDiagnostic[] }
    >();
    const next = new Map<string, Action>();
    const add = (
      path: string,
      code: string,
      message: string,
      action: Action,
    ) => {
      const group = grouped.get(path) ?? { path, diagnostics: [] };
      group.diagnostics.push({
        message,
        severity: "warning",
        source: "Editing",
        code,
      });
      grouped.set(path, group);
      next.set(code, action);
    };
    const snapshot = recovery.snapshot();
    for (const state of snapshot.claims)
      add(
        state.path,
        claimCode(state),
        "Unresolved editing claim. Review the saved file before recovering or discarding this claim; unsaved draft content is not stored here.",
        { kind: "claim", state },
      );
    for (const issue of registry.nativeIssues.entries)
      add(
        issue.path,
        issueCode(issue),
        issue.status === "pending"
          ? `Editing ${issue.phase} is pending. Editable input remains protected.`
          : `Editing ${issue.phase} failed: ${issue.message}. Retry explicitly to restore editable access.`,
        { kind: "local", issue },
      );
    actions = next;
    const current = new Set(grouped.keys());
    for (const path of resources)
      if (!current.has(path))
        collection.delete({ uri: prefix + encodeURIComponent(path) });
    const updates: DiagnosticCollectionUpdate[] = [...grouped.values()].map(
      ({ path, diagnostics }) => [
        {
          uri: prefix + encodeURIComponent(path),
          label: path,
          detail: path,
          icon: "file-warning",
        },
        diagnostics,
      ],
    );
    updates.push([
      null,
      snapshot.error
        ? [
            {
              severity: "error",
              source: "Editing",
              code: "editing-observation-unavailable",
              message: `Editing claims could not be checked: ${snapshot.error}. Existing protection remains active.`,
            },
          ]
        : undefined,
    ]);
    collection.set(updates);
    resources = current;
  };
  const stopNavigation = app.workspace.registerDiagnosticOpener(
    async (location) => {
      if (!location.resource.uri.startsWith(prefix)) return false;
      if (!active) return true;
      const path = decodeURIComponent(
        location.resource.uri.slice(prefix.length),
      );
      if (resources.has(path) && app.vault.getFileByPath(path))
        await run(() => openSavedFile(path));
      return true;
    },
  );
  const stopRecovery = recovery.subscribe(publish);
  const stopIssues = registry.nativeIssues.subscribe(publish);
  const stopObserver = recovery.observe();
  return {
    references: 0,
    dispose() {
      active = false;
      stopObserver();
      stopIssues();
      stopRecovery();
      stopNavigation();
      collection.dispose();
    },
  };
}
