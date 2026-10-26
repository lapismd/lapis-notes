import type { HistoryClient, Handle } from "@lapismd/jj-history";
import type { RepositoryServices } from "@lapis-notes/history/repository/controllers/history-reader";
import { PreparationQueue } from "@lapis-notes/history/repository/controllers/preparation-queue";

/** Owns this workspace's reads only. Capture and indexing belong to the native vault owner. */
export function createHostedRepository(
  reader: HistoryClient,
): RepositoryServices {
  const preparations = new PreparationQueue(reader);
  const pending = new Set<Promise<unknown>>();
  const handles = new Set<Handle>();
  let closed = false;
  let closing: Promise<void> | undefined;
  function track<T>(action: () => Promise<T>): Promise<T> {
    if (closed)
      return Promise.reject(new Error("Repository history is closed"));
    const job = Promise.resolve().then(action);
    pending.add(job);
    void job.finally(() => pending.delete(job)).catch(() => {});
    return job;
  }
  async function closeHandle(handle: Handle) {
    await preparations.close(handle);
    handles.delete(handle);
  }
  return {
    reader: {
      heads: () => track(() => reader.heads()),
      open: (operation) =>
        track(async () => {
          const handle = await preparations.open(operation);
          handles.add(handle);
          return handle;
        }),
      status: (handle) => track(() => reader.status(handle)),
      read: (handle, query) => track(() => reader.read(handle, query)),
      blame: (handle, query) => track(() => reader.blame(handle, query)),
      close: (handle) => track(() => closeHandle(handle)),
    },
    close() {
      closed = true;
      preparations.stop();
      return (closing ??= (async () => {
        while (pending.size) await Promise.allSettled([...pending]);
        const results = await Promise.allSettled([...handles].map(closeHandle));
        const failure = results.find((result) => result.status === "rejected");
        if (failure?.status === "rejected") throw failure.reason;
      })().catch((error) => {
        closing = undefined;
        throw error;
      }));
    },
  };
}
