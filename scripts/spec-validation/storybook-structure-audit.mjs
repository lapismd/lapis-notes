import {
  pluginPanelFamilies,
  pluginPanelPlacements,
} from "../../stories/catalog/plugin-panels.mjs";

function lineFor(source, token) {
  const index = source.indexOf(token);
  return index < 0 ? 1 : source.slice(0, index).split("\n").length;
}

function finding(code, file, line, message) {
  return { code, file, line, message };
}

function quotedTitle(source) {
  return source.match(/\btitle:\s*["']([^"']+)["']/)?.[1] ?? null;
}

/**
 * Audit the structured command-view to Storybook mapping. Kept independent of
 * repository I/O so validator fixtures exercise the same implementation.
 */
export function auditPluginPanels({
  families = pluginPanelFamilies,
  placements = pluginPanelPlacements,
  readOptional,
}) {
  const findings = [];
  const mappedCommands = new Set();
  const mappedStories = new Set();

  for (const family of families) {
    if (mappedCommands.has(family.commandId)) {
      findings.push(
        finding(
          "STORYBOOK-PANEL-MAPPING-DUPLICATE",
          family.storyFile,
          1,
          `command ${family.commandId} is mapped to more than one panel story`,
        ),
      );
    }
    mappedCommands.add(family.commandId);

    if (mappedStories.has(family.storyFile)) {
      findings.push(
        finding(
          "STORYBOOK-PANEL-MAPPING-DUPLICATE",
          family.storyFile,
          1,
          `${family.storyFile} is mapped to more than one command view`,
        ),
      );
    }
    mappedStories.add(family.storyFile);

    const commandSource = readOptional(family.sourceFile);
    if (
      commandSource === null ||
      !commandSource.includes(family.commandToken)
    ) {
      findings.push(
        finding(
          "STORYBOOK-PANEL-COMMAND-STALE",
          family.sourceFile,
          1,
          `panel mapping ${family.commandId} does not match its registered command source`,
        ),
      );
    }

    const storySource = readOptional(family.storyFile);
    if (storySource === null) {
      findings.push(
        finding(
          "STORYBOOK-PANEL-SOURCE-MISSING",
          family.storyFile,
          1,
          `command view ${family.commandId} must have a canonical panel story`,
        ),
      );
      continue;
    }

    const expectedTitle = `Plugins/${family.plugin}/Panels/${family.panel}`;
    const actualTitle = quotedTitle(storySource);
    if (actualTitle !== expectedTitle) {
      findings.push(
        finding(
          "STORYBOOK-PANEL-TITLE",
          family.storyFile,
          lineFor(storySource, "title:"),
          `expected Storybook title ${expectedTitle}, found ${actualTitle ?? "none"}`,
        ),
      );
    }

    for (const placement of placements) {
      const exportToken = `export const ${placement.exportName}`;
      if (!storySource.includes(exportToken)) {
        findings.push(
          finding(
            "STORYBOOK-PANEL-PLACEMENT-MISSING",
            family.storyFile,
            1,
            `${expectedTitle} must export ${placement.exportName} for ${placement.title}`,
          ),
        );
      }
    }

    if (!storySource.includes('"visual-pending"')) {
      findings.push(
        finding(
          "STORYBOOK-PANEL-VISUAL-STATUS",
          family.storyFile,
          1,
          `${expectedTitle} must retain visual-pending until reviewed baselines exist`,
        ),
      );
    }
  }

  return findings;
}

function rule(context, code) {
  const mapped = context.config.diagnostics[code];
  if (!mapped) throw new Error(`missing diagnostic mapping for ${code}`);
  return mapped;
}

export const name = "storybookStructureAudit";

export function validate(context) {
  return auditPluginPanels({
    readOptional(file) {
      return context.readOptional(`${context.model.repoRoot}/${file}`);
    },
  }).map((entry) => ({ ...entry, rule: rule(context, entry.code) }));
}
