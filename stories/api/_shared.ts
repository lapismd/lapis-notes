import { catalogParameters, visualPendingTags } from "../catalog/catalog.mjs";
import { apiExampleSource } from "./Api.example-sources";

export function apiStoryMeta(
  catalogId: string,
  description: string,
  options: { skipVisual?: boolean; baselineImage?: string } = {},
) {
  const source = apiExampleSource(catalogId);
  const parameters: Record<string, unknown> = {
    ...catalogParameters(catalogId),
    docs: {
      description: {
        story: description,
      },
      source: { code: source, language: "svelte", type: "code" },
    },
  };

  if (options.baselineImage && !options.skipVisual) {
    parameters.visualDelta = {
      images: [options.baselineImage],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    };
  }

  return {
    tags: options.skipVisual
      ? (["skip-visual", "test"] as string[])
      : visualPendingTags,
    parameters,
  };
}
