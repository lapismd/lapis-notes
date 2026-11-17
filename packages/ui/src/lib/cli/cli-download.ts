import type { CliDownload } from "./cli-settings";

export type CliOperatingSystem = "linux" | "macos" | "windows";
type CliArchitecture = "arm64" | "x64";

export interface CliBrowserIdentity {
  platform?: string;
  userAgent?: string;
  userAgentData?: { platform?: string };
}

interface CliPlatform {
  os?: CliOperatingSystem;
  architecture?: CliArchitecture;
}

function platformFromText(value: string): CliPlatform {
  const text = value.toLowerCase();
  const os = /(?:mac|darwin)/u.test(text)
    ? "macos"
    : /(?:linux|ubuntu)/u.test(text)
      ? "linux"
      : /(?:win|mingw|msvc)/u.test(text)
        ? "windows"
        : undefined;
  const architecture = /(?:aarch64|arm64|armv8)/u.test(text)
    ? "arm64"
    : /(?:x86_64|x64|amd64|win64|wow64)/u.test(text)
      ? "x64"
      : undefined;
  return { os, architecture };
}

function downloadPlatform(download: CliDownload): CliPlatform {
  return platformFromText(
    [download.target, download.label, download.file, download.url]
      .filter(Boolean)
      .join(" "),
  );
}

export function cliDownloadLabel(download: CliDownload): string {
  if (download.label) return download.label;
  const platform = downloadPlatform(download);
  const os =
    platform.os === "macos"
      ? "macOS"
      : platform.os === "linux"
        ? "Linux"
        : platform.os === "windows"
          ? "Windows"
          : "CLI";
  const architecture =
    platform.architecture === "arm64"
      ? "ARM64"
      : platform.architecture === "x64"
        ? "x64"
        : undefined;
  return `Lapis CLI · ${os}${architecture ? ` · ${architecture}` : ""}`;
}

export function cliDownloadPlatformLabel(download: CliDownload): string {
  if (download.label) {
    return download.label.replace(/^Lapis CLI\s*·\s*/u, "");
  }
  return cliDownloadLabel(download).replace(/^Lapis CLI\s*·\s*/u, "");
}

export function cliDownloadOperatingSystem(
  download: CliDownload,
): CliOperatingSystem | undefined {
  return downloadPlatform(download).os;
}

export function preferredCliDownloadUrl(
  downloads: readonly CliDownload[],
  browser: CliBrowserIdentity | undefined = globalThis.navigator,
): string {
  if (!browser) return "";
  const detected = platformFromText(
    [browser.userAgentData?.platform, browser.platform, browser.userAgent]
      .filter(Boolean)
      .join(" "),
  );
  if (!detected.os) return "";
  const operatingSystemMatches = downloads.filter(
    (download) => downloadPlatform(download).os === detected.os,
  );
  if (detected.architecture) {
    const exact = operatingSystemMatches.find(
      (download) =>
        downloadPlatform(download).architecture === detected.architecture,
    );
    if (exact) return exact.url;
  }
  return operatingSystemMatches.length === 1
    ? operatingSystemMatches[0]!.url
    : "";
}
