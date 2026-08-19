import type { SkillActivation } from "./types";
import { hasHostFilesystemPath } from "./manifest";

export function projectSkillActivationPrompt(
  text: string,
  activations?: readonly SkillActivation[],
): string {
  const activation = activations?.[0];
  if (!activation?.instructions.trim()) return text;
  if (hasHostFilesystemPath(activation.instructions)) return text;
  const name = escapeAttribute(activation.skillName);
  const version = escapeAttribute(activation.version);
  return [
    `<skill_activation name="${name}" version="${version}">`,
    activation.instructions.trim(),
    "</skill_activation>",
    "",
    text,
  ].join("\n");
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}
