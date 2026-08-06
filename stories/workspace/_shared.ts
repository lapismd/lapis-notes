import {
  visualPendingTags,
  workspaceCatalogParameters,
} from "../catalog/catalog.mjs";

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
        description: { story: description },
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
