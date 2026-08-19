declare namespace Deno {
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
    reload(): void;
    hide(): void;
    getPosition(): [number, number];
    setPosition(x: number, y: number): void;
    openDevtools(options?: { deno?: boolean; renderer?: boolean }): void;
    executeJs(code: string): Promise<unknown>;
  }
}
