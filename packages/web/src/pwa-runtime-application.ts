export type PwaRuntimeApp = {
  commands: {
    executeCommand(id: string): Promise<unknown>;
    getCommand(id: string): unknown;
    registerCommand(command: {
      id: string;
      name: string;
      icon?: string;
      checkCallback(checking: boolean): boolean;
    }): void;
  };
  statusBar: {
    unregisterItem(id: string): void;
    upsertItem(item: {
      id: string;
      icon?: string;
      text?: string;
      tooltip?: string;
      command?: string;
      alignment?: "left" | "right";
      priority?: number;
    }): void;
  };
};

let providedRuntimeApp: PwaRuntimeApp | null = null;
let prepareUpdate: (() => Promise<void>) | null = null;
let changed: (() => void) | null = null;

export function setPwaRuntimeApplication(
  app: PwaRuntimeApp,
  prepare: () => Promise<void>,
): () => void {
  providedRuntimeApp = app;
  prepareUpdate = prepare;
  changed?.();
  return () => {
    if (providedRuntimeApp === app) {
      providedRuntimeApp = null;
      prepareUpdate = null;
      changed?.();
    }
  };
}

export function getPwaRuntimeApplication(): PwaRuntimeApp | null {
  return providedRuntimeApp;
}

export function onPwaRuntimeApplicationChanged(
  listener: () => void,
): () => void {
  changed = listener;
  return () => {
    if (changed === listener) changed = null;
  };
}

export async function preparePwaUpdate(): Promise<void> {
  await prepareUpdate?.();
}
