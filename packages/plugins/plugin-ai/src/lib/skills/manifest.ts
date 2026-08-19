import type { SkillSnapshot, SkillSnapshotEntry } from "./types";

const MANIFEST_BUDGET = 8_000;

export function hasHostFilesystemPath(value: string): boolean {
  return /(?:(?:^|[\s"'>=])(?:\/|[A-Za-z]:\\|file:\/\/)|\.lapis\/skills\/|\.agents\/(?:user\/)?skills\/)/u.test(
    value,
  );
}

export function buildAvailableSkillsManifest(snapshot: SkillSnapshot): string {
  const visible = snapshot.skills.filter((skill) => skill.modelInvocable);
  const body = visible
    .map((skill) => renderSkill(skill))
    .join("\n");
  const xml = [
    "<available_skills>",
    body,
    "</available_skills>",
    "",
    "When a listed skill clearly applies, load it using skills_read before proceeding.",
    "Only load skills listed in available_skills.",
  ].join("\n");
  if (xml.length > MANIFEST_BUDGET) {
    throw new Error(
      `Available-skills manifest exceeds ${MANIFEST_BUDGET} characters.`,
    );
  }
  return xml;
}

function renderSkill(skill: SkillSnapshotEntry): string {
  return [
    "  <skill>",
    `    <name>${escapeXml(skill.name)}</name>`,
    `    <description>${escapeXml(skill.description)}</description>`,
    `    <id>${escapeXml(skill.skillId)}</id>`,
    `    <version>${escapeXml(skill.version)}</version>`,
    "  </skill>",
  ].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
