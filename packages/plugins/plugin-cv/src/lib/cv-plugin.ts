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

const MANIFEST: PluginManifest = {
  id: "cv",
  name: "CV",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description: "CV YAML file views and browser-generated preview.",
  author: "Lapis Notes",
};

export class CvPlugin extends Plugin {
  constructor(app: App, pluginManifest: PluginManifest = MANIFEST) {
    super(app, pluginManifest);
  }

  async onload(): Promise<void> {
    this.registerView(CV_VIEW_TYPE, (leaf: WorkspaceLeaf) => new CvView(leaf));
    this.registerEditorView({
      id: CV_VIEW_TYPE,
      viewType: CV_VIEW_TYPE,
      label: "CV",
      filenamePatterns: [...CV_FILENAME_PATTERNS],
      priority: "exclusive",
    });
    this.registerExtensions([...CV_EXTENSIONS], CV_VIEW_TYPE);
  }
}

export default CvPlugin;
