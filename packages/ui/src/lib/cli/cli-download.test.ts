import { describe, expect, it } from "vitest";
import type { CliDownload } from "./cli-settings";
import {
  cliDownloadLabel,
  cliDownloadOperatingSystem,
  cliDownloadPlatformLabel,
  preferredCliDownloadUrl,
} from "./cli-download";

const downloads: CliDownload[] = [
  {
    target: "aarch64-apple-darwin",
    url: "macos-arm64",
    sha256: "a".repeat(64),
  },
  {
    target: "aarch64-unknown-linux-gnu",
    url: "linux-arm64",
    sha256: "b".repeat(64),
  },
  {
    target: "x86_64-unknown-linux-gnu",
    url: "linux-x64",
    sha256: "c".repeat(64),
  },
];

describe("CLI download presentation", () => {
  it.each([
    ["macOS", { platform: "MacIntel" }, "macos-arm64"],
    ["Linux x64", { platform: "Linux x86_64" }, "linux-x64"],
    [
      "Linux ARM64",
      { userAgent: "Mozilla/5.0 (X11; Linux aarch64)" },
      "linux-arm64",
    ],
  ])("preselects the %s browser target", (_, browser, expected) => {
    expect(preferredCliDownloadUrl(downloads, browser)).toBe(expected);
  });

  it("leaves unknown and ambiguous platforms for explicit selection", () => {
    expect(preferredCliDownloadUrl(downloads, { platform: "Linux" })).toBe("");
    expect(
      preferredCliDownloadUrl(downloads, { platform: "FreeBSD x64" }),
    ).toBe("");
  });

  it("derives release labels without requiring server-authored display text", () => {
    expect(cliDownloadLabel(downloads[0]!)).toBe("Lapis CLI · macOS · ARM64");
    expect(
      cliDownloadLabel({ ...downloads[2]!, label: "Verified Linux build" }),
    ).toBe("Verified Linux build");
    expect(cliDownloadPlatformLabel(downloads[0]!)).toBe("macOS · ARM64");
    expect(cliDownloadOperatingSystem(downloads[0]!)).toBe("macos");
  });
});
