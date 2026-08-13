import type { TFile } from "@lapis-notes/api";
import { artifactBlob, type WorkerArtifact } from "./web-artifacts";

export type ArtifactDownloadEnvironment = {
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  clickDownload: (url: string, filename: string) => void;
  scheduleCleanup: (cleanup: () => void) => void;
};

function browserDownloadEnvironment(): ArtifactDownloadEnvironment {
  return {
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
    clickDownload: (url, filename) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      link.style.display = "none";
      document.body.append(link);
      link.click();
      link.remove();
    },
    scheduleCleanup: (cleanup) => window.setTimeout(cleanup, 0),
  };
}

export function downloadWorkerArtifact(
  artifact: WorkerArtifact,
  environment: ArtifactDownloadEnvironment = browserDownloadEnvironment(),
): void {
  const url = environment.createObjectUrl(artifactBlob(artifact));
  try {
    environment.clickDownload(url, artifact.filename);
  } finally {
    environment.scheduleCleanup(() => environment.revokeObjectUrl(url));
  }
}

export function artifactArrayBuffer(artifact: WorkerArtifact): ArrayBuffer {
  const bytes =
    typeof artifact.content === "string"
      ? new TextEncoder().encode(artifact.content)
      : new Uint8Array(artifact.content);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export function pdfVaultPath(sourcePath: string, filename: string): string {
  const separator = sourcePath.lastIndexOf("/");
  return separator < 0 ? filename : `${sourcePath.slice(0, separator)}/${filename}`;
}

export type PdfVaultWriter = {
  getFileByPath: (path: string) => TFile | null;
  createBinary: (path: string, data: ArrayBuffer) => Promise<TFile>;
  modifyBinary: (file: TFile, data: ArrayBuffer) => Promise<void>;
};

export async function savePdfArtifactToVault(
  vault: PdfVaultWriter,
  sourcePath: string,
  artifact: WorkerArtifact,
): Promise<string> {
  const path = pdfVaultPath(sourcePath, artifact.filename);
  const data = artifactArrayBuffer(artifact);
  const existing = vault.getFileByPath(path);
  if (existing) {
    await vault.modifyBinary(existing, data);
  } else {
    await vault.createBinary(path, data);
  }
  return path;
}
