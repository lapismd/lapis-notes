export type DesktopAppIconAppearance = "light" | "dark";

type AppearanceMediaQuery = {
  readonly matches: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
};

export function installDesktopAppIconAppearanceSync(options: {
  platform: string;
  matchMedia?: (query: string) => AppearanceMediaQuery;
  apply?: (appearance: DesktopAppIconAppearance) => void | Promise<void>;
  onError?: (error: unknown) => void;
}): () => void {
  if (
    options.platform !== "macos" ||
    !options.matchMedia ||
    !options.apply
  ) {
    return () => {};
  }

  const media = options.matchMedia("(prefers-color-scheme: dark)");
  let disposed = false;
  const apply = () => {
    if (disposed) return;
    try {
      void Promise.resolve(options.apply?.(media.matches ? "dark" : "light"))
        .catch((error) => options.onError?.(error));
    } catch (error) {
      options.onError?.(error);
    }
  };

  media.addEventListener("change", apply);
  apply();
  return () => {
    if (disposed) return;
    disposed = true;
    media.removeEventListener("change", apply);
  };
}
