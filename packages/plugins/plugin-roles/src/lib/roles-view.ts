import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import RolesWorkspace from "./roles-workspace.svelte";
import { RolesManager } from "./roles/roles-manager";
import type { RoleRecord, RolesPresentationState } from "./roles/types";

export const ROLES_VIEW_TYPE = "roles";

export interface RolesViewOptions {
  getPresentation: () => RolesPresentationState;
  updatePresentation: (state: RolesPresentationState) => Promise<void>;
  openRole: (role: RoleRecord) => Promise<void>;
}

export class RolesView extends View {
  private component: Record<string, unknown> | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly manager: RolesManager,
    private readonly options: RolesViewOptions,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return ROLES_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Roles";
  }

  getIcon(): string {
    return "briefcase-business";
  }

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.containerEl.style.width = "100%";
    this.containerEl.style.height = "100%";
    this.containerEl.style.minHeight = "0";
    this.containerEl.style.overflow = "hidden";
    this.component = mount(RolesWorkspace, {
      target: this.containerEl,
      props: {
        manager: this.manager,
        presentation: this.options.getPresentation(),
        onPresentationChange: (state: RolesPresentationState) =>
          this.options.updatePresentation(state),
        onOpenRole: (role: RoleRecord) => this.options.openRole(role),
      },
    }) as Record<string, unknown>;
  }

  onunload(): void {
    if (this.component) void unmount(this.component);
    this.component = null;
  }
}

