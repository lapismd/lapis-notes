import { unknown } from "./syntax.mjs";
export function renderedStory(source, file, story) {
  const { module, reference, call } = source;
  const model = module(file),
    meta = reference(file, "default");
  if (!story || story === unknown || meta === unknown) return null;
  const render = Object.hasOwn(story, "render") ? story.render : meta.render;
  if (render !== undefined) {
    const output = call(render, [{ ...meta.args, ...story.args }], []);
    return output?.Component?.kind === "reference"
      ? { reference: output.Component, props: output.props ?? {} }
      : null;
  }
  if (story.unresolvedSpread || meta.unresolvedSpread) return null;
  return meta.component?.kind === "reference"
    ? { reference: meta.component, props: { ...meta.args, ...story.args } }
    : null;
}
