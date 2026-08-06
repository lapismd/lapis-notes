import { catalogParameters, visualPendingTags } from "../catalog/catalog.mjs";

export function apiStoryMeta(
  catalogId: string,
  description: string,
  options: { skipVisual?: boolean; baselineImage?: string } = {},
) {
  const parameters: Record<string, unknown> = {
    ...catalogParameters(catalogId),
    docs: {
      description: {
        story: description,
      },
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
