import type { App, VaultSession } from "@lapis-notes/api";
import {
  appStatePath,
  DEFAULT_APP_STATE_DIRECTORY,
} from "@lapis-notes/api/path";
import { prepareNativeChatLeave } from "../native-chat/plugin";
import {
  prepareNativeRepositoryLeave,
  resumeNativeRepositoryLeave,
} from "../native-repository";
import { createWorkspaceLeave } from "./leave";

export function createNotesSessionLifecycle(options: {
  app: App;
  session: VaultSession;
  fence(): void;
  releaseObservers(): void;
  releaseServices(): Promise<void>;
  releaseHostServices(): Promise<void>;
  releaseApplication(): void;
}) {
  const { app, session } = options;
  let disposed = false;
  const persistLayout = async () => {
    if (disposed || !app.workspace.layoutReady) return;
    await app.workspace.flushLayout();
    await session.vaultAdapter.mkdir(DEFAULT_APP_STATE_DIRECTORY, {
      recursive: true,
    });
    await session.vaultAdapter.write(
      appStatePath("workspace.json"),
      JSON.stringify(app.workspace.getLayout(), null, 2),
    );
  };
  const dispose = createWorkspaceLeave({
    isDisposed: () => disposed,
    preflight: async () => {
      await prepareNativeRepositoryLeave(app);
      await app.vaultChanges.stop();
      await app.workspace.flushPluginChanges();
      await app.plugins.flushPendingConfigWrites();
      await app.fileEditingSessions.settleOperations();
      await app.fileEditingSessions.preflightNativeRecovery();
    },
    onRefused: async (error) => {
      const resumed = await Promise.allSettled([
        resumeNativeRepositoryLeave(app),
        app.vaultChanges.start(),
      ]);
      const errors = resumed.flatMap((result) =>
        result.status === "rejected" ? [result.reason] : [],
      );
      const failure = errors.length
        ? new AggregateError(
            [error, ...errors],
            "Leaving failed and workspace observation could not resume",
          )
        : error;
      app.notifications.notify({
        title: "Vault could not close",
        message: failure instanceof Error ? failure.message : String(failure),
        severity: "error",
        source: "workspace",
        persist: true,
      });
      if (failure !== error) throw failure;
    },
    commit: async (persist) => {
      if (disposed) return;
      const failures: unknown[] = [];
      const attempt = async (action: () => unknown | Promise<unknown>) => {
        try {
          await action();
        } catch (error) {
          failures.push(error);
        }
      };
      await app.fileEditingSessions.guard(undefined, async () => {
        await app.workspace.flushLayout();
        if (persist) await persistLayout();
        disposed = true;
        await attempt(() => app.nativeTasks?.detach());
        await attempt(() => prepareNativeChatLeave(app, "detach"));
        options.fence();
        await attempt(() => app.workspace.disposeWorkspaceHost());
        await attempt(options.releaseObservers);
        await attempt(() => app.metadataCache.dispose());
        for (const plugin of [...app.plugins.plugins.values()].reverse()) {
          await attempt(() => plugin.disable());
        }
      });
      await attempt(() => app.fileEditingSessions.dispose());
      await attempt(options.releaseServices);
      await attempt(() => session.close());
      await attempt(options.releaseHostServices);
      if (failures.length)
        throw new AggregateError(
          failures,
          "Notes session cleanup did not complete",
        );
      options.releaseApplication();
    },
  });
  return { persistLayout, dispose, canRecoverLeave: () => !disposed };
}
