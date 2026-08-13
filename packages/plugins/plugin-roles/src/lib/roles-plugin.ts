import {
  Plugin,
  type App,
  type PluginManifest,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import {
  CV_EXTENSIONS,
  CV_FILENAME_PATTERNS,
  CV_VIEW_TYPE,
} from "./cv/cv-path";
import { CvView } from "./cv-view";
import {
  ROLE_FILENAME_PATTERNS,
  ROLE_VIEW_TYPE,
  RoleView,
} from "./role-view";
import { ROLES_VIEW_TYPE, RolesView } from "./roles-view";
import { RolesManager } from "./roles/roles-manager";
import type {
  RoleRecord,
  RolesPresentationState,
} from "./roles/types";

const MANIFEST: PluginManifest = {
  id: "roles",
  name: "Roles",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "Vault-native role workflows and retained CV views.",
  author: "Lapis Notes",
};

export class RolesPlugin extends Plugin {
  readonly rolesManager: RolesManager;
  private presentation: RolesPresentationState = {
    mode: "applications",
    query: "",
    collapsedColumnIds: [],
    columnWidths: {},
  };

  constructor(app: App, pluginManifest: PluginManifest = MANIFEST) {
    super(app, pluginManifest);
    this.rolesManager = new RolesManager(app);
  }

  async onload(): Promise<void> {
    const saved = (await this.loadData()) as
      | { presentation?: Partial<RolesPresentationState> }
      | null;
    this.presentation = {
      ...this.presentation,
      ...(saved?.presentation ?? {}),
      collapsedColumnIds: [...(saved?.presentation?.collapsedColumnIds ?? [])],
      columnWidths: { ...(saved?.presentation?.columnWidths ?? {}) },
    };
    await this.rolesManager.start();
    this.register(() => this.rolesManager.dispose());

    this.registerView(CV_VIEW_TYPE, (leaf: WorkspaceLeaf) => new CvView(leaf));
    this.registerView(
      ROLE_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new RoleView(leaf, this.rolesManager),
    );
    this.registerView(
      ROLES_VIEW_TYPE,
      (leaf: WorkspaceLeaf) =>
        new RolesView(leaf, this.rolesManager, {
          getPresentation: () => this.getPresentation(),
          updatePresentation: (state) => this.updatePresentation(state),
          openRole: (role) => this.openRole(role),
        }),
    );
    this.registerEditorView({
      id: CV_VIEW_TYPE,
      viewType: CV_VIEW_TYPE,
      label: "CV",
      filenamePatterns: [...CV_FILENAME_PATTERNS],
      priority: "exclusive",
    });
    this.registerEditorView({
      id: ROLE_VIEW_TYPE,
      viewType: ROLE_VIEW_TYPE,
      label: "Role",
      filenamePatterns: [...ROLE_FILENAME_PATTERNS],
      priority: "exclusive",
    });
    this.registerExtensions([...CV_EXTENSIONS], CV_VIEW_TYPE);
    this.addCommand({
      id: "open",
      name: "Open roles",
      callback: () => void this.openRoles(),
    });
    this.addCommand({
      id: "new",
      name: "Create role",
      callback: async () => {
        const role = await this.rolesManager.createRole({
          company: "New company",
          title: "New role",
        });
        await this.openRole(role);
      },
    });
  }

  getPresentation(): RolesPresentationState {
    return {
      ...this.presentation,
      collapsedColumnIds: [...this.presentation.collapsedColumnIds],
      columnWidths: { ...this.presentation.columnWidths },
    };
  }

  async updatePresentation(state: RolesPresentationState): Promise<void> {
    this.presentation = {
      ...state,
      collapsedColumnIds: [...state.collapsedColumnIds],
      columnWidths: { ...state.columnWidths },
    };
    await this.saveData({ presentation: this.presentation });
  }

  async openRoles(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(ROLES_VIEW_TYPE)[0];
    if (existing) {
      this.app.workspace.activeLeaf = existing;
      await this.app.workspace.revealLeaf(existing);
      return;
    }
    const leaf = this.app.workspace.getLeaf();
    await leaf.setViewState({ type: ROLES_VIEW_TYPE, active: true });
    this.app.workspace.activeLeaf = leaf;
    await this.app.workspace.revealLeaf(leaf);
  }

  async openRole(role: RoleRecord): Promise<void> {
    const file = this.app.vault.getFileByPath(role.sourcePath);
    if (!file) throw new Error(`Role file not found: ${role.sourcePath}`);
    await this.app.openFile(file);
  }
}

export default RolesPlugin;
