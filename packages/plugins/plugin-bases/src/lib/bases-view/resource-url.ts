import type { App, TFile } from "@lapis-notes/api";

export function loadBasesResourceUrl(
  app: Pick<App, "vault">,
  file: TFile,
  onReady: (url: string) => void,
): () => void {
  let disposed = false;
  let currentUrl = "";

  void app.vault
    .getResourceUrl(file)
    .then((url) => {
      if (disposed) {
        app.vault.revokeResourceUrl(url);
        return;
      }
      currentUrl = url;
      onReady(url);
    })
    .catch(() => {});

  return () => {
    disposed = true;
    if (currentUrl) {
      app.vault.revokeResourceUrl(currentUrl);
    }
  };
}
