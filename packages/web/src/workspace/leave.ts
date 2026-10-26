type WorkspaceLeaveOptions = {
  preflight(): Promise<void>;
  commit(persistLayout: boolean): Promise<void>;
  isDisposed(): boolean;
  onRefused(error: unknown): void | Promise<void>;
};

/** Preparation cannot retire a live workspace; concurrent callers share its drain. */
export function createWorkspaceLeave(options: WorkspaceLeaveOptions) {
  let flight: Promise<void> | undefined;
  return (persistLayout: boolean): Promise<void> => {
    if (flight) return flight;
    if (options.isDisposed()) return Promise.resolve();
    flight = Promise.resolve()
      .then(() => options.preflight())
      .then(() => options.commit(persistLayout))
      .catch(async (error: unknown) => {
        if (!options.isDisposed()) await options.onRefused(error);
        throw error;
      })
      .finally(() => {
        // Before the fence, recovery may explicitly retry. Afterwards retain
        // the complete result so incomplete cleanup cannot report success.
        if (!options.isDisposed()) flight = undefined;
      });
    return flight;
  };
}
