import {
  defineConfig,
  singleIdVerification,
  tableRequirements,
} from "@lapismd/spec-validator";

export default defineConfig(tableRequirements(), {
  name: "lapis-notes",
  idPattern: /^LN-[A-Z]+-\d{3}$/,
  tableSection: "Requirements",
  minAcceptance: 3,
  maxAcceptance: null,
  ruleIds: {
    summary: "LN-GOV-001",
    governance: "LN-GOV-017",
    verification: "LN-GOV-002",
    book: "LN-GOV-001",
    bookIgnore: "LN-GOV-007",
    storybookCatalog: "LN-GOV-023",
    storybookMirrors: "LN-CAT-080",
    qmd: "LN-GOV-020",
    specFirst: "LN-GOV-003",
    internal: "LN-GOV-018",
  },
  diagnostics: {
    "SPEC-LINK-BROKEN": "LN-GOV-017",
    "SPEC-REQ-ID": "LN-GOV-002",
    "SPEC-REQ-DUPLICATE": "LN-GOV-002",
    "SPEC-REQ-NORMATIVE": "LN-GOV-010",
    "SPEC-REQ-WORDS": "LN-GOV-015",
    "SPEC-REQ-SENTENCES": "LN-GOV-015",
    "SPEC-REQ-DETAILS-ID": "LN-GOV-016",
    "SPEC-REQ-DETAILS-LIST": "LN-GOV-016",
    "SPEC-VERIFY-TABLE": "LN-GOV-017",
    "SPEC-VERIFY-EVIDENCE": "LN-GOV-017",
    "SPEC-VERIFY-STATUS": "LN-GOV-017",
    "SPEC-STORY-SOURCE-FIELDS": "LN-CAT-025",
    "SPEC-STORY-SOURCE-BOUNDARY": "LN-CAT-024",
    "SPEC-STORY-SOURCE-MISSING": "LN-GOV-023",
    "VIEW-COMMAND-ACCESS-MISSING": "LN-PLUG-016",
    "VIEW-COMMAND-ACCESS-INVALID": "LN-PLUG-016",
    "VIEW-COMMAND-OPEN-SHAPE": "LN-PLUG-017",
    "STORYBOOK-PANEL-MAPPING-DUPLICATE": "LN-GOV-038",
    "STORYBOOK-PANEL-COMMAND-STALE": "LN-CAT-075",
    "STORYBOOK-PANEL-SOURCE-MISSING": "LN-CAT-075",
    "STORYBOOK-PANEL-TITLE": "LN-CAT-074",
    "STORYBOOK-PANEL-PLACEMENT-MISSING": "LN-CAT-075",
    "STORYBOOK-PANEL-VISUAL-STATUS": "LN-CAT-075",
    "STORYBOOK-PANEL-GEOMETRY": "LN-CAT-075",
    "STORYBOOK-TAXONOMY-LEGACY": "LN-CAT-074",
    "STORYBOOK-EXTERNAL-PLUGIN": "LN-CAT-078",
    "STORYBOOK-SHELL-SOURCE-MISSING": "LN-CAT-076",
    "STORYBOOK-SHELL-TITLE": "LN-CAT-076",
    "STORYBOOK-SHELL-VARIANT-MISSING": "LN-CAT-076",
    "STORYBOOK-SHELL-VISUAL-STATUS": "LN-CAT-076",
    "STORYBOOK-SHELL-COMPOSITION": "LN-CAT-076",
    "STORYBOOK-SHELL-GEOMETRY": "LN-CAT-076",
    "STORYBOOK-WORKSPACE-INVENTORY": "LN-CAT-077",
    "STORYBOOK-SPECIFICATION-ORDER": "LN-CAT-074",
  },
  validators: {
    summary: true,
    governance: {
      extras: ["AGENTS.md", "MIGRATION.md"],
      normative: true,
      proseLimits: true,
      acceptance: true,
      acceptanceScope: "declared",
      acceptanceIntroduction: "require",
      acceptanceAtomic: false,
      acceptanceColocation: true,
      references: true,
      changeMap: true,
    },
    verification: singleIdVerification({
      headers: {
        ids: ["ID"],
        status: ["Status"],
        evidence: ["Evidence"],
        required: [["Chapter"]],
      },
      statuses: ["Planned", "Implemented", "In progress", "Partial"],
    }),
    book: true,
    storybookCatalog: {
      roots: ["stories"],
      packageRoots: ["packages"],
      storyOnlyName: "(?:Demo|Harness|Fixture)$",
      forbiddenSource:
        "\\b(?:PanelDemo|[A-Z][A-Za-z0-9]*(?:Demo|Harness|Fixture))\\b|\\bargs\\s*\\.",
      plainTextLanguages: [],
    },
    storybookMirrors: {
      style: "src-spec-mdx",
      directory: "stories/spec",
      titlePrefix: "Specification",
      verifyTarget: true,
      verifyTitle: true,
      verifyContent: true,
      previewPath: ".storybook/preview.ts",
      verifyOrder: true,
    },
    qmd: { collection: "lapis-spec", configPath: ".qmd/index.yml" },
    specFirst: {
      mode: "mapped",
      canonicalPattern: "^spec/src/(?!SUMMARY\\.md$).+\\.md$",
      ignore: [
        "(^|/)node_modules/",
        "(^|/)(?:dist|build|\\.svelte-kit|\\.turbo)/",
        "(^|/)(?:coverage|test-results|playwright-report|storybook-static)/",
        "^spec/book/",
        "\\.(?:spec|test)\\.[cm]?[jt]sx?$",
        "\\.stories\\.(?:svelte|[cm]?[jt]sx?)$",
        "^stories/(?!catalog/)",
        "^MIGRATION\\.md$",
        "^README\\.md$",
      ],
      rules: [
        {
          pattern: "^packages/api/(?:src/|package\\.json$)",
          chapters: ["spec/src/packages.md", "spec/src/architecture.md"],
        },
        {
          pattern: "^packages/api/src/lib/storage/(?!desktop-native\\.ts).+",
          chapters: ["spec/src/app-database.md"],
        },
        {
          pattern: "^packages/api/src/lib/storage/desktop-native\\.ts$",
          chapters: ["spec/src/desktop-host.md", "spec/src/packages.md"],
        },
        {
          pattern:
            "^packages/api/src/lib/(?:plugin(?:-manager)?\\.ts|workspace\\.svelte\\.ts|context\\.svelte\\.ts)$",
          chapters: ["spec/src/plugin-model.md"],
        },
        {
          pattern: "^packages/ui/(?:src/|package\\.json$)",
          chapters: ["spec/src/packages.md", "spec/src/ui-and-styling.md"],
        },
        {
          pattern: "^packages/workspace/(?:src/|package\\.json$)",
          chapters: [
            "spec/src/packages.md",
            "spec/src/architecture.md",
            "spec/src/workspace-shell.md",
          ],
        },
        {
          pattern: "^packages/file-explorer/",
          chapters: [
            "spec/src/plugins/explorer/index.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
            "spec/src/editor-demo.md",
          ],
        },
        {
          pattern:
            "^packages/(?:file-explorer|plugins/plugin-[^/]+)/(?:src/|package\\.json$)",
          chapters: ["spec/src/plugin-model.md"],
        },
        {
          pattern: "^packages/desktop-electron/",
          chapters: [
            "spec/src/desktop-host.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern: "^packages/web/",
          chapters: [
            "spec/src/web-host.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern:
            "^packages/language-service/(?:src/markdownlint/|package\\.json$)",
          chapters: ["spec/src/desktop-host.md"],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/(?:src/|package\\.json$|PARITY\\.md$)",
          chapters: [
            "spec/src/plugins/markdown/index.md",
            "spec/src/plugins/markdown/panels/index.md",
            "spec/src/packages.md",
            "spec/src/editor-demo.md",
          ],
        },
        {
          pattern:
            "^packages/api/src/lib/(?:diagnostics/|language-service/|components/editor/language-service/|workspace\\.ts$|plugin\\.ts$)",
          chapters: ["spec/src/workspace-shell/panels/problems.md"],
        },
        {
          pattern: "^packages/language-service/",
          chapters: [
            "spec/src/workspace-shell/panels/problems.md",
            "spec/src/packages.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-markdown-lint/",
          chapters: [
            "spec/src/plugins/markdown-lint/index.md",
            "spec/src/workspace-shell/panels/problems.md",
            "spec/src/packages.md",
            "spec/src/editor-demo.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-search/",
          chapters: [
            "spec/src/plugins/search/index.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-bases/",
          chapters: [
            "spec/src/plugins/bases/index.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern: "^stories/plugins/bases/",
          chapters: [
            "spec/src/plugins/bases/index.md",
            "spec/src/storybook-catalog.md",
          ],
        },
        {
          pattern: "^packages/ai-host/",
          chapters: [
            "spec/src/plugins/ai/index.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
            "spec/src/desktop-host.md",
            "spec/src/web-host.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-ai/",
          chapters: [
            "spec/src/plugins/ai/index.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern: "^stories/plugins/ai/",
          chapters: [
            "spec/src/plugins/ai/index.md",
            "spec/src/storybook-catalog.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-roles/",
          chapters: [
            "spec/src/plugin-model.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/src/lib/views/sidebar-panel/",
          chapters: ["spec/src/workspace-shell/panels.md"],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/src/lib/views/all-properties/",
          chapters: [
            "spec/src/plugins/markdown/panels/all-properties.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/src/lib/(?:views/file-properties/|frontmatter/)",
          chapters: [
            "spec/src/plugins/markdown/panels/file-properties.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-markdown/src/lib/views/outline/",
          chapters: [
            "spec/src/plugins/markdown/panels/outline.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-markdown/src/lib/views/backlinks/",
          chapters: [
            "spec/src/plugins/markdown/panels/backlinks.md",
            "spec/src/plugins/markdown/panels/link-previews.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/src/lib/views/outgoing-links/",
          chapters: [
            "spec/src/plugins/markdown/panels/outgoing-links.md",
            "spec/src/plugins/markdown/panels/link-previews.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/src/lib/(?:views/link-sidebar/|components/embed/|mira/file-adapter\\.|embed\\.ts$)",
          chapters: [
            "spec/src/plugins/markdown/panels/link-previews.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern: "^(?:\\.storybook/|stories/catalog/)",
          chapters: ["spec/src/storybook-catalog.md"],
        },
        {
          pattern:
            "^(?:scripts/spec-validation/|spec-validator\\.config\\.mjs$|\\.qmd/index\\.ya?ml$|\\.gitignore$|spec/book\\.toml|AGENTS\\.md$)",
          chapters: ["spec/src/spec-governance.md"],
        },
        {
          pattern:
            "^(?:package\\.json|pnpm-lock\\.yaml|pnpm-workspace\\.yaml|turbo\\.json|tsconfig(?:\\.[^.]+)*\\.json)$",
          chapters: ["spec/src/architecture.md", "spec/src/packages.md"],
        },
      ],
      protected: ["^(?:packages/[^/]+/src/|\\.storybook/|stories/catalog/)"],
    },
  },
  plugins: [
    "scripts/spec-validation/view-command-audit.mjs",
    "scripts/spec-validation/storybook-structure-audit.mjs",
  ],
  check: {
    lanes: [
      {
        name: "view-command-audit",
        command: "node",
        args: ["--test", "scripts/spec-validation/view-command-audit.test.mjs"],
      },
      {
        name: "storybook-structure-audit",
        command: "node",
        args: [
          "--test",
          "scripts/spec-validation/storybook-structure-audit.test.mjs",
        ],
      },
    ],
  },
});
