type BoundHandler = (...args: unknown[]) => unknown;

export type DesktopWindowBinding = readonly [
  name: string,
  handler: BoundHandler,
];

export type BindableDesktopWindow = {
  bind(name: string, handler: BoundHandler): void;
  addEventListener(type: "load", listener: () => void): void;
  removeEventListener(type: "load", listener: () => void): void;
};

export function installWindowBindings(
  win: BindableDesktopWindow,
  bindings: readonly DesktopWindowBinding[],
): () => void {
  const register = () => {
    for (const [name, handler] of bindings) {
      win.bind(name, handler);
    }
  };

  register();
  win.addEventListener("load", register);

  return () => {
    win.removeEventListener("load", register);
  };
}
