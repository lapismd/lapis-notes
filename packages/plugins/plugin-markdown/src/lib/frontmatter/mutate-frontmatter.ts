import {
  Notice,
  normalizeMetadataValue,
  type App,
  type MetadataTypeDef,
  type TFile,
} from "@lapis-notes/api";
import { applyFrontmatterMutation } from "./apply-frontmatter-mutation";

export { applyFrontmatterMutation };

export async function updateFrontmatterProperty(
  app: App,
  file: TFile,
  type: Pick<MetadataTypeDef, "name" | "type">,
  value: unknown,
): Promise<boolean> {
  try {
    const declaredType =
      app.metadataTypeManager.types[type.name]?.type ?? type.type;
    const normalized = normalizeMetadataValue(declaredType, value);

    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      applyFrontmatterMutation(frontmatter, type.name, normalized);
    });
    return true;
  } catch (error) {
    new Notice(
      error instanceof Error
        ? error.message
        : `Failed to update property ${type.name}`,
    );
    return false;
  }
}
