import type { TFile } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import {
  artifactArrayBuffer,
  downloadWorkerArtifact,
  pdfVaultPath,
  savePdfArtifactToVault,
  type ArtifactDownloadEnvironment,
} from "./cv-artifact-actions";
import type { WorkerArtifact } from "./web-artifacts";

function artifact(content: string | ArrayBuffer = new Uint8Array([1, 2, 3]).buffer): WorkerArtifact {
  return {
    id: "typst-pdf",
    pipeline: "typst",
    filename: "Ada_Lovelace_typst.pdf",
    extension: "pdf",
    label: "Typst PDF",
    mimeType: "application/pdf",
    content,
  };
}

describe("CV artifact actions", () => {
  it("downloads the current artifact filename and revokes its object URL", () => {
    const cleanup: Array<() => void> = [];
    const environment: ArtifactDownloadEnvironment = {
      createObjectUrl: vi.fn(() => "blob:cv-pdf"),
      revokeObjectUrl: vi.fn(),
      clickDownload: vi.fn(),
      scheduleCleanup: (next) => cleanup.push(next),
    };

    downloadWorkerArtifact(artifact(), environment);

    expect(environment.clickDownload).toHaveBeenCalledWith(
      "blob:cv-pdf",
      "Ada_Lovelace_typst.pdf",
    );
    expect(environment.revokeObjectUrl).not.toHaveBeenCalled();
    cleanup[0]?.();
    expect(environment.revokeObjectUrl).toHaveBeenCalledWith("blob:cv-pdf");
  });

  it("copies binary and text artifact content into portable buffers", () => {
    expect([...new Uint8Array(artifactArrayBuffer(artifact()))]).toEqual([1, 2, 3]);
    expect(new TextDecoder().decode(artifactArrayBuffer(artifact("pdf")))).toBe("pdf");
  });

  it("places generated PDFs beside nested and root CV files", () => {
    expect(pdfVaultPath("People/Ada.cv.yml", "Ada_typst.pdf")).toBe(
      "People/Ada_typst.pdf",
    );
    expect(pdfVaultPath("Ada.cv.yml", "Ada_typst.pdf")).toBe("Ada_typst.pdf");
  });

  it("creates a missing vault PDF and replaces an existing one", async () => {
    const existing = { path: "People/Ada_typst.pdf" } as TFile;
    let existingFile: TFile | null = null;
    const createBinary = vi.fn(async () => existing);
    const modifyBinary = vi.fn(async () => undefined);
    const vault = {
      getFileByPath: vi.fn(() => existingFile),
      createBinary,
      modifyBinary,
    };

    await expect(
      savePdfArtifactToVault(vault, "People/Ada.cv.yml", artifact()),
    ).resolves.toBe("People/Ada_Lovelace_typst.pdf");
    expect(createBinary).toHaveBeenCalledOnce();
    expect(modifyBinary).not.toHaveBeenCalled();

    existingFile = existing;
    await savePdfArtifactToVault(vault, "People/Ada.cv.yml", artifact());
    expect(createBinary).toHaveBeenCalledOnce();
    expect(modifyBinary).toHaveBeenCalledWith(existing, expect.any(ArrayBuffer));
  });
});
