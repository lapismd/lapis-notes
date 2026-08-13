import {
  TextFileView,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import { CvSaveCoordinator } from "./cv-save-coordinator";
import RoleWorkspace from "./role-workspace.svelte";
import { isRolePath, parseRoleDocument } from "./roles/role-document";
import { RolesManager } from "./roles/roles-manager";

export const ROLE_VIEW_TYPE = "role";
export const ROLE_FILENAME_PATTERNS = ["role.md"] as const;

type RoleSaveRequest = { file: TFile; value: string };

export class RoleView extends TextFileView {
  private component: Record<string, unknown> | null = null;
  private readonly saves = new CvSaveCoordinator<RoleSaveRequest>(
    async ({ file, value }) => this.app.vault.modify(file, value),
  );

  constructor(
    leaf: WorkspaceLeaf,
    private readonly manager: RolesManager,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return ROLE_VIEW_TYPE;
  }

  getDisplayText(): string {
    const parsed = parseRoleDocument(this.file?.path ?? "role.md", this.data);
    return parsed.role?.title ?? this.file?.parent?.name ?? "Role";
  }

  getIcon(): string {
    return "briefcase-business";
  }

  canAcceptExtension(): boolean {
    return isRolePath(this.file?.path ?? "");
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

  private persist(next: string): Promise<void> {
    if (next === this.data) return Promise.resolve();
    this.data = next;
    this.editor.setValue(next);
    if (!this.file) return Promise.resolve();
    return this.saves.queue({ file: this.file.copy(), value: next });
  }

  private async openCv(path: string): Promise<void> {
    const file = this.app.vault.getFileByPath(path);
    if (!file) throw new Error(`CV file not found: ${path}`);
    await this.app.openFile(file);
  }

  private async tailorCv(sourcePath: string): Promise<void> {
    if (!this.file) throw new Error("Open a role before tailoring a CV.");
    const document = parseRoleDocument(this.file.path, this.data);
    if (!document.role) throw new Error("Fix the role document before tailoring a CV.");
    const target = await this.manager.createTailoredCv(document.role, sourcePath);
    await this.openCv(target);
  }

  private async deleteRole(): Promise<void> {
    if (!this.file) return;
    await this.manager.deleteRole(this.file.path);
    this.leaf.detach(true);
  }

  private unmountWorkspace(): void {
    if (!this.component) return;
    unmount(this.component as Parameters<typeof unmount>[0]);
    this.component = null;
  }

  private reload(): void {
    const target = this.contentEl ?? this.containerEl;
    if (!target) return;
    this.unmountWorkspace();
    target.empty();
    target.style.width = "100%";
    target.style.height = "100%";
    target.style.minHeight = "0";
    target.style.overflow = "hidden";
    this.component = mount(RoleWorkspace, {
      target,
      props: {
        filePath: this.file?.path ?? "role.md",
        content: this.data,
        onContentChange: (next: string) => this.persist(next),
        onOpenCv: (path: string) => this.openCv(path),
        onTailorCv: (path: string) => this.tailorCv(path),
        onDelete: () => this.deleteRole(),
      },
    }) as Record<string, unknown>;
  }
}
