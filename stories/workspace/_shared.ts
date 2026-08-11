import {
  visualPendingTags,
  workspaceCatalogParameters,
} from "../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "./docs-parameters";
import "./Workspace.docs.css";

export function workspaceStoryMeta(
  catalogId: string,
  description: string,
  baselineImage: string,
) {
  return {
    tags: visualPendingTags,
    parameters: {
      ...workspaceCatalogParameters(catalogId),
      layout: "fullscreen",
      docs: {
        canvas: { className: "workspace-shell-docs-canvas" },
        description: { story: description },
        story: WORKSPACE_SHELL_DOCS_STORY,
      },
      visualDelta: {
        images: [baselineImage],
        opacity: 0.5,
        colorInversion: false,
        align: "canvas",
        placement: "right",
      },
    },
  };
}
