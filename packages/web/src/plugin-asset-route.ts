export function matchesWebPluginAssetRequest({ url }: { url: URL }): boolean {
  // Workbox serializes this callback; its route must not capture build variables.
  return (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/__lapis/plugins/")
  );
}
