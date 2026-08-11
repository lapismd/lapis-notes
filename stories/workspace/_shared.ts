import {
  visualPendingTags,
  workspaceCatalogParameters,
} from "../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "./docs-parameters";
import { workspaceExampleSource } from "./Workspace.example-sources";
import "./Workspace.docs.css";

export function workspaceStoryMeta(
  catalogId: string,
  description: string,
  baselineImage: string,
) {
  const source = workspaceExampleSource(catalogId);
  return {
    tags: visualPendingTags,
    parameters: {
      ...workspaceCatalogParameters(catalogId),
      layout: "fullscreen",
      docs: {
        canvas: { className: "workspace-shell-docs-canvas" },
        description: { story: description },
        source: { code: source, language: "svelte", type: "code" },
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
