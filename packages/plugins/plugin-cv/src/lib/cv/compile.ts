import type { CvSource } from "./types";
import type { CompiledCvSource } from "./compiler/shared";
import { renderHtmlPreview } from "./compiler/html-preview";
import { renderMarkdown } from "./compiler/markdown";
import { renderRenderCvYaml } from "./compiler/rendercv-yaml";
import { renderTypst } from "./compiler/typst";

export {
  DEFAULT_RENDERCV_DESIGN,
  THEME_PRESETS,
  resolvedDesign,
} from "./compiler/shared";
export type { CompiledCvSource } from "./compiler/shared";
export { renderHtmlPreview } from "./compiler/html-preview";
export { renderMarkdown } from "./compiler/markdown";
export {
  buildRenderCvDocument,
  renderRenderCvYaml,
} from "./compiler/rendercv-yaml";
export { renderTypst } from "./compiler/typst";

export function compileCvSource(source: CvSource): CompiledCvSource {
  const markdown = renderMarkdown(source);
  return {
    markdown,
    rendercvYaml: renderRenderCvYaml(source),
    typst: renderTypst(source),
    html: renderHtmlPreview(source, markdown),
  };
}
