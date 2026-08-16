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

const pluginShells = [
  {
    plugin: "AI",
    storyFile: "stories/plugins/ai/shell/Shell.stories.ts",
    demoFile: "stories/plugins/ai/shell/ShellDemo.svelte",
    runtimeFile: "stories/plugins/ai/shell/create-shell-demo.ts",
  },
  {
    plugin: "Bases",
    storyFile: "stories/plugins/bases/shell/Shell.stories.ts",
    demoFile: "stories/plugins/bases/shell/ShellDemo.svelte",
    runtimeFile: "stories/plugins/bases/shell/create-shell-demo.ts",
  },
  {
    plugin: "History",
    storyFile: "stories/plugins/history/shell/Shell.stories.ts",
    demoFile: "stories/plugins/history/shell/ShellDemo.svelte",
    runtimeFile: "stories/plugins/history/shell/create-shell-demo.ts",
  },
];

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

function auditCatalogTaxonomy({ trackedFiles, readOptional }) {
  const findings = [];
  for (const file of trackedFiles.filter((entry) =>
    entry.startsWith("stories/"),
  )) {
    if (
      file.startsWith("stories/workspace/plugins/") ||
      file.startsWith("stories/workspace/panels/")
    ) {
      findings.push(
        finding(
          "STORYBOOK-TAXONOMY-LEGACY",
          file,
          1,
          "plugin stories must live under stories/plugins/<plugin>",
        ),
      );
    }

    if (!/\.(?:svelte|[cm]?[jt]sx?|mdx)$/.test(file)) continue;
    const source = readOptional(file);
    if (source === null) continue;
    const title = quotedTitle(source);
    if (
      title?.startsWith("Workspace/Panels/") ||
      title?.startsWith("Workspace/Plugins/")
    ) {
      findings.push(
        finding(
          "STORYBOOK-TAXONOMY-LEGACY",
          file,
          lineFor(source, "title:"),
          `legacy Storybook title ${title} is forbidden`,
        ),
      );
    }
    if (
      source.includes("@lapis-notes/lapis-plugin-cv-roles") ||
      title?.startsWith("Plugins/Roles") ||
      title?.startsWith("Plugins/CV") ||
      /(?:^|\/)(?:Roles|Cv|CV)[^/]*\.(?:stories\.|example-sources\.|svelte$)/.test(
        file,
      )
    ) {
      findings.push(
        finding(
          "STORYBOOK-EXTERNAL-PLUGIN",
          file,
          1,
          "Roles and CV Storybook acceptance belongs to lapis-plugin-cv-roles",
        ),
      );
    }
  }
  return findings;
}

function auditShells({ readOptional, shells = pluginShells }) {
  const findings = [];
  for (const shell of shells) {
    const story = readOptional(shell.storyFile);
    const demo = readOptional(shell.demoFile);
    const runtime = readOptional(shell.runtimeFile);
    const expectedTitle = `Plugins/${shell.plugin}/Shell`;
    if (story === null || demo === null || runtime === null) {
      const missing = [
        [shell.storyFile, story],
        [shell.demoFile, demo],
        [shell.runtimeFile, runtime],
      ].find(([, source]) => source === null)?.[0];
      findings.push(
        finding(
          "STORYBOOK-SHELL-SOURCE-MISSING",
          missing ?? shell.storyFile,
          1,
          `${expectedTitle} must provide its canonical story, demo, and runtime sources`,
        ),
      );
      continue;
    }

    const actualTitle = quotedTitle(story);
    if (actualTitle !== expectedTitle) {
      findings.push(
        finding(
          "STORYBOOK-SHELL-TITLE",
          shell.storyFile,
          lineFor(story, "title:"),
          `expected Storybook title ${expectedTitle}, found ${actualTitle ?? "none"}`,
        ),
      );
    }
    for (const exportName of ["Desktop", "Mobile"]) {
      if (!story.includes(`export const ${exportName}`)) {
        findings.push(
          finding(
            "STORYBOOK-SHELL-VARIANT-MISSING",
            shell.storyFile,
            1,
            `${expectedTitle} must export ${exportName}`,
          ),
        );
      }
    }
    if (!story.includes('"visual-pending"')) {
      findings.push(
        finding(
          "STORYBOOK-SHELL-VISUAL-STATUS",
          shell.storyFile,
          1,
          `${expectedTitle} must retain visual-pending until reviewed baselines exist`,
        ),
      );
    }
    for (const token of [
      "FileExplorerPlugin",
      "SearchPlugin",
      'width: "17rem"',
      'width: "0px"',
    ]) {
      if (!runtime.includes(token)) {
        findings.push(
          finding(
            "STORYBOOK-SHELL-COMPOSITION",
            shell.runtimeFile,
            1,
            `${expectedTitle} must keep Explorer visible on the left and Search collapsed on the right`,
          ),
        );
        break;
      }
    }
    for (const token of [
      "body.sb-main-fullscreen",
      "height: 100vh",
      "overflow: hidden",
      "padding: 0 !important",
      "lapis-workspace-shell",
      "workspace-shell-docs-canvas",
      "height: 700px",
    ]) {
      if (!demo.includes(token)) {
        findings.push(
          finding(
            "STORYBOOK-SHELL-GEOMETRY",
            shell.demoFile,
            1,
            `${expectedTitle} must fill Preview without scrolling while limiting only Docs to 700px`,
          ),
        );
        break;
      }
    }
  }
  return findings;
}

function auditPanelGeometry({ readOptional }) {
  const demoFile = "stories/plugins/_shared/panels/PanelDemo.svelte";
  const helperFile = "stories/plugins/_shared/panels/panel-story-helpers.ts";
  const demo = readOptional(demoFile);
  const helper = readOptional(helperFile);
  const requiredDemoTokens = [
    "body.sb-main-fullscreen",
    "width: 100vw",
    "height: 100vh",
    "overflow: hidden",
    "padding: 0 !important",
    "panel-demo-docs-canvas",
    "height: 700px",
  ];
  const requiredAssertionTokens = [
    "viewport.clientWidth",
    "viewport.clientHeight",
    "getComputedStyle(storyRoot).padding",
    "getComputedStyle(storyRoot).overflow",
  ];
  if (
    demo === null ||
    helper === null ||
    requiredDemoTokens.some((token) => !demo.includes(token)) ||
    requiredAssertionTokens.some((token) => !helper.includes(token))
  ) {
    return [
      finding(
        "STORYBOOK-PANEL-GEOMETRY",
        demo === null ? demoFile : helper === null ? helperFile : demoFile,
        1,
        "panel previews must fill the viewport without padding or scrolling and constrain only Docs to 700px",
      ),
    ];
  }
  return [];
}

function auditPersistedWorkspace({ readOptional }) {
  const demoFile = "stories/workspace/WorkspaceShellDemo.svelte";
  const storyFile = "stories/workspace/WorkspaceShell.stories.ts";
  const demo = readOptional(demoFile);
  const story = readOptional(storyFile);
  const pluginTokens = [
    "MarkdownPlugin",
    "MarkdownLintPlugin",
    "FileExplorerPlugin",
    "SearchPlugin",
    "HistoryPlugin",
    "BasesPlugin",
    "AiPlugin",
  ];
  const valid =
    demo !== null &&
    story !== null &&
    pluginTokens.every((token) => demo.includes(token)) &&
    pluginTokens.every((token) =>
      demo.includes(
        `{ plugin: ${token}, required: false, enabledByDefault: true }`,
      ),
    ) &&
    demo.includes('defaultRuntime: "fake"') &&
    story.includes("export const PersistedDesktop") &&
    story.includes("export const Mobile") &&
    (story.match(/loadBundledPlugins:\s*true/g)?.length ?? 0) >= 2;
  return valid
    ? []
    : [
        finding(
          "STORYBOOK-WORKSPACE-INVENTORY",
          demo === null ? demoFile : storyFile,
          1,
          "PersistedDesktop and Mobile must enable all seven bundled plugins and use Fake AI",
        ),
      ];
}

const aiStateStories = [
  "PermissionRequested",
  "PermissionAccepted",
  "QuestionAsked",
  "QuestionAnswered",
  "ToolRunning",
  "SuccessfulToolCall",
  "FailedToolCall",
  "ValidationAndEmptyState",
  "FailedMessageAndRetry",
  "AgentTrace",
];

function storyBlock(source, exportName) {
  const startToken = `export const ${exportName}`;
  const start = source.indexOf(startToken);
  if (start < 0) return null;
  const next = source.indexOf("\nexport const ", start + startToken.length);
  return source.slice(start, next < 0 ? source.length : next);
}

/** Enforce the independently inspectable AI interaction state matrix. */
export function auditAiStateMatrix({ readOptional }) {
  const storyFile = "stories/plugins/ai/AiChat.stories.ts";
  const source = readOptional(storyFile);
  if (source === null) {
    return [
      finding(
        "STORYBOOK-AI-STATE-MATRIX",
        storyFile,
        1,
        "AI Chat must provide the canonical interaction state catalog",
      ),
    ];
  }

  const requiredTokens = [
    "workspaceCatalogParameters(",
    "docs:",
    "source:",
    "visualDelta:",
    "images:",
    "play:",
  ];
  const findings = [];
  for (const exportName of aiStateStories) {
    const block = storyBlock(source, exportName);
    const missing =
      block === null
        ? ["story export"]
        : requiredTokens.filter((token) => !block.includes(token));
    if (missing.length > 0) {
      findings.push(
        finding(
          "STORYBOOK-AI-STATE-MATRIX",
          storyFile,
          lineFor(source, `export const ${exportName}`),
          `AI Chat ${exportName} is missing ${missing.join(", ")}`,
        ),
      );
    }
  }
  return findings;
}

function auditSpecificationOrder({ readOptional }) {
  const previewFile = ".storybook/preview.ts";
  const preview = readOptional(previewFile);
  if (
    preview !== null &&
    /storySort:\s*\{\s*order:\s*\[\s*["']Specification["']\s*,\s*\[/s.test(
      preview,
    )
  ) {
    return [];
  }
  return [
    finding(
      "STORYBOOK-SPECIFICATION-ORDER",
      previewFile,
      1,
      "Specification must be the first top-level Storybook menu item",
    ),
  ];
}

/** Audit the complete repository-owned Storybook catalog contract. */
export function auditStorybookStructure({
  trackedFiles = [],
  families = pluginPanelFamilies,
  placements = pluginPanelPlacements,
  shells = pluginShells,
  readOptional,
}) {
  return [
    ...auditPluginPanels({ families, placements, readOptional }),
    ...auditPanelGeometry({ readOptional }),
    ...auditCatalogTaxonomy({ trackedFiles, readOptional }),
    ...auditShells({ readOptional, shells }),
    ...auditPersistedWorkspace({ readOptional }),
    ...auditAiStateMatrix({ readOptional }),
    ...auditSpecificationOrder({ readOptional }),
  ];
}

function rule(context, code) {
  const mapped = context.config.diagnostics[code];
  if (!mapped) throw new Error(`missing diagnostic mapping for ${code}`);
  return mapped;
}

export const name = "storybookStructureAudit";

export function validate(context) {
  return auditStorybookStructure({
    trackedFiles: context.trackedFiles,
    readOptional(file) {
      return context.readOptional(`${context.model.repoRoot}/${file}`);
    },
  }).map((entry) => ({ ...entry, rule: rule(context, entry.code) }));
}
