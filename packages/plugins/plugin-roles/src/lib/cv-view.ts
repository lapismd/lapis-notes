import {
  TextFileView,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import { CV_VIEW_TYPE, isCvPath } from "./cv/cv-path";
import {
  savePdfArtifactToVault,
} from "./cv/cv-artifact-actions";
import type { WorkerArtifact } from "./cv/web-artifacts";
import { CvSaveCoordinator } from "./cv-save-coordinator";
import CvWorkspace from "./cv-workspace.svelte";

type CvSaveRequest = { file: TFile; value: string };

export class CvView extends TextFileView {
  private component: Record<string, unknown> | null = null;
  private readonly saves = new CvSaveCoordinator<CvSaveRequest>(
    async ({ file, value }) => this.app.vault.modify(file, value),
  );

  constructor(leaf?: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return CV_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.baseName ?? "CV";
  }

  getIcon(): string {
    return "file-text";
  }

  canAcceptExtension(extension: string): boolean {
    const normalized = extension.toLowerCase().replace(/^\./, "");
    if (normalized === "cv.yml" || normalized === "cv.yaml") return true;
    return isCvPath(this.file?.path ?? "");
  }

  getViewData(): string {
    return this.data;
  }

  setViewData(data: string, _clear?: boolean): void {
    this.data = data;
    this.editor.setValue(data);
    this.reload();
  }

  clear(): void {
    this.data = "";
    this.editor.setValue("");
    this.reload();
  }

  onload(): void {
    this.reload();
  }

  async onunload(): Promise<void> {
    await this.saves.flush();
    this.unmountWorkspace();
  }

  async onUnloadFile(file: TFile): Promise<void> {
    await this.saves.flush();
    await super.onUnloadFile(file);
  }

  protected async onClose(): Promise<void> {
    await this.saves.flush();
    this.unmountWorkspace();
  }

  private persistYaml(next: string): Promise<void> {
    if (next === this.data) return Promise.resolve();
    this.data = next;
    this.editor.setValue(next);
    if (!this.file) return Promise.resolve();
    return this.saves.queue({ file: this.file.copy(), value: next });
  }

  private async savePdfToVault(artifact: WorkerArtifact): Promise<string> {
    if (!this.file) throw new Error("Open a CV file before saving its PDF.");
    return savePdfArtifactToVault(this.app.vault, this.file.path, artifact);
  }

  private unmountWorkspace(): void {
    if (!this.component) return;
    unmount(this.component as Parameters<typeof unmount>[0]);
    this.component = null;
  }

  private fillLeafSurface(element: HTMLElement | null | undefined): void {
    if (!element) return;
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.minHeight = "0";
    element.style.overflow = "hidden";
  }

  private reload(): void {
    const target = this.contentEl ?? this.containerEl;
    if (!target) return;
    this.unmountWorkspace();
    target.empty();
    this.fillLeafSurface(this.containerEl);
    this.fillLeafSurface(target);
    this.component = mount(CvWorkspace, {
      target,
      props: {
        yamlText: this.data,
        filePath: this.file?.path ?? "",
        embedded: true,
        onYamlChange: (next: string) => this.persistYaml(next),
        onSavePdfToVault: (artifact: WorkerArtifact) =>
          this.savePdfToVault(artifact),
      },
    }) as Record<string, unknown>;
  }
}
