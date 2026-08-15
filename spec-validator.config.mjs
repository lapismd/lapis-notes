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
            "spec/src/packages.md",
            "spec/src/architecture.md",
            "spec/src/editor-demo.md",
          ],
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
            "spec/src/markdown-plugin.md",
            "spec/src/markdown-plugin/panels/index.md",
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
            "spec/src/workspace-shell/panels/problems.md",
            "spec/src/packages.md",
            "spec/src/editor-demo.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-search/",
          chapters: [
            "spec/src/search-plugin.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-bases/",
          chapters: [
            "spec/src/bases-plugin.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern:
            "^stories/(?:plugins/bases/|workspace/plugins/(?:bases/|Bases))",
          chapters: [
            "spec/src/bases-plugin.md",
            "spec/src/storybook-catalog.md",
          ],
        },
        {
          pattern: "^packages/ai-host/",
          chapters: [
            "spec/src/ai-plugin.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
            "spec/src/desktop-host.md",
            "spec/src/web-host.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-ai/",
          chapters: [
            "spec/src/ai-plugin.md",
            "spec/src/packages.md",
            "spec/src/architecture.md",
          ],
        },
        {
          pattern: "^stories/plugins/ai/",
          chapters: ["spec/src/ai-plugin.md", "spec/src/storybook-catalog.md"],
        },
        {
          pattern:
            "^stories/workspace/plugins/(?:roles-plugin-shell/|RolesWorkspace|CvFileView|create-roles-workspace-demo|create-cv-file-view-demo)",
          chapters: [
            "spec/src/roles-plugin.md",
            "spec/src/storybook-catalog.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-roles/",
          chapters: [
            "spec/src/roles-plugin.md",
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
            "spec/src/markdown-plugin/panels/all-properties.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/src/lib/(?:views/file-properties/|frontmatter/)",
          chapters: [
            "spec/src/markdown-plugin/panels/file-properties.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-markdown/src/lib/views/outline/",
          chapters: [
            "spec/src/markdown-plugin/panels/outline.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern: "^packages/plugins/plugin-markdown/src/lib/views/backlinks/",
          chapters: [
            "spec/src/markdown-plugin/panels/backlinks.md",
            "spec/src/markdown-plugin/panels/link-previews.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/src/lib/views/outgoing-links/",
          chapters: [
            "spec/src/markdown-plugin/panels/outgoing-links.md",
            "spec/src/markdown-plugin/panels/link-previews.md",
            "spec/src/workspace-shell/panels.md",
          ],
        },
        {
          pattern:
            "^packages/plugins/plugin-markdown/src/lib/(?:views/link-sidebar/|components/embed/|mira/file-adapter\\.|embed\\.ts$)",
          chapters: [
            "spec/src/markdown-plugin/panels/link-previews.md",
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
});
