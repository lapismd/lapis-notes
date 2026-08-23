declare namespace Deno {
  interface FsEvent {
    kind: "any" | "access" | "create" | "modify" | "remove" | "other";
    paths: string[];
  }
  interface FsWatcher extends AsyncIterable<FsEvent> {
    close(): void;
  }
  function watchFs(
    paths: string | string[],
    options?: { recursive?: boolean },
  ): FsWatcher;
  function realPathSync(path: string): string;

  class BrowserWindow extends EventTarget {
    constructor(options?: {
      title?: string;
      width?: number;
      height?: number;
      transparentTitlebar?: boolean;
      frameless?: boolean;
    });
    bind(name: string, handler: (...args: unknown[]) => unknown): void;
    setApplicationMenu(menu: unknown[]): void;
    navigate(url: string): void;
    close(): void;
    reload(): void;
    hide(): void;
    show(): void;
    focus(): void;
    isClosed(): boolean;
    setTitle(title: string): void;
    setOpacity(opacity: number): void;
    getPosition(): [number, number];
    setPosition(x: number, y: number): void;
    openDevtools(options?: { deno?: boolean; renderer?: boolean }): void;
    executeJs(code: string): Promise<unknown>;
  }
}
