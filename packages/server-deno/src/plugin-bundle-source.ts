const OFFICIAL_GITHUB_RELEASE_PATH =
  /^\/(?:lapismd\/lapis-plugins|lapis-notes\/releases)\/releases\/download\/[^/]+\/[^/]+\.lapis-plugin$/u;

/** Keep hosted installs on the signed first-party release boundary. */
export function isOfficialPluginBundleSource(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === "" &&
      OFFICIAL_GITHUB_RELEASE_PATH.test(url.pathname)
    );
  } catch {
    return false;
  }
}
