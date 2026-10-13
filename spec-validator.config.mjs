import {
  defineConfig,
  singleIdVerification,
  headingRequirements,
} from "@lapismd/spec-validator";

export default defineConfig(headingRequirements(), {
  name: "lapis-notes",
  idPattern: /^LN-[A-Z]+-\d{3}$/,
  tableSection: "Requirements",
  minAcceptance: 3,
  maxAcceptance: null,
  ruleIds: {
    summary: "LN-GOV-001",
    fileLimits: "LN-GOV-048",
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
  documentRoles: [{ pattern: "^verification/", role: "verification" }],
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
    "STORYBOOK-AI-STATE-MATRIX": "LN-CAT-079",
    "STORYBOOK-SPECIFICATION-ORDER": "LN-CAT-074",
  },
  validators: {
    summary: true,
    fileLimits: { maxLines: 400, maxBytes: 32768 },
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
      files: ["^verification/.*\\.md$"],
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
          pattern:
            "^(?:\\.ci/(?:dependency-image\\.Dockerfile|images\\.json)|\\.env\\.example|\\.github/actions/ci-setup/action\\.yml|\\.github/workflows/(?:dependency-image|lapis-ci|publish-storybook-pages|release)\\.yml|\\.changeset/(?:config\\.json|README\\.md)|RELEASING\\.md|scripts/(?:public-packages|release-plan|release-manifest|prepare-release|publish-release|verify-release|create-github-releases|check-package-boundaries|check-package-tarballs|check-release-config|check-release-workflow|check-release-intent|prepare-local-plugin-consumer|pack-packages|prepare-ci-dependency-context|update-ci-image-manifest|run-ci-container|run-turbo|report-turbo-cache|lib/(?:local-plugin-consumer|concurrency|ci-images|ci-container))\\.mjs|scripts/local-plugin-pnpmfile(?:\\.test)?\\.(?:cjs|mjs))$",
          chapterPatterns: [
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/spec\\-governance/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^packages/api/(?:src/|package\\.json$|README\\.md$|CHANGELOG\\.md$|LICENSE\\.md$)",
          chapterPatterns: [
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/api/src/lib/file-tools/",
          chapterPatterns: [
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/plugins/ai/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/api/src/lib/storage/(?!desktop-native\\.ts).+",
          chapterPatterns: [
            "^spec/src/app\\-database/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/api/src/lib/storage/desktop-native\\.ts$",
          chapterPatterns: [
            "^spec/src/desktop\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/api/src/lib/cache\\.svelte(?:\\.d)?\\.ts$",
          chapterPatterns: [
            "^spec/src/app\\-database/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/plugin\\-model/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^packages/api/src/lib/(?:plugin(?:-manager)?\\.ts|workspace\\.svelte\\.ts|context\\.svelte\\.ts)$",
          chapterPatterns: [
            "^spec/src/plugin\\-model/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02)\\.md$)[^/]+\\.md$",
            "^spec/src/workspace\\-shell/(?!(?:index|context(?:-\\d+)?|context|panels)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/api/src/lib/app-shell-plugin-persistence\\.ts$",
          chapterPatterns: [
            "^spec/src/workspace\\-shell/(?!(?:index|context(?:-\\d+)?|context|panels)\\.md$)[^/]+\\.md$",
            "^spec/src/plugin\\-model/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^packages/ui/(?:src/|package\\.json$|README\\.md$|CHANGELOG\\.md$|LICENSE\\.md$)",
          chapterPatterns: [
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/ui\\-and\\-styling/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^packages/workspace/(?:src/|package\\.json$|README\\.md$|CHANGELOG\\.md$|LICENSE\\.md$)",
          chapterPatterns: [
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/workspace\\-shell/(?!(?:index|context(?:-\\d+)?|context|panels)\\.md$)[^/]+\\.md$",
            "^spec/src/plugin\\-model/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/app-profile/",
          chapterPatterns: [
            "^spec/src/plugin\\-model/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/web\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/desktop\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/file-explorer/",
          chapterPatterns: [
            "^spec/src/plugins/explorer/index\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/editor\\-demo/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^packages/(?:file-explorer|plugins/plugin-[^/]+)/(?:src/|package\\.json$)",
          chapterPatterns: [
            "^spec/src/plugin\\-model/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/desktop-electron/",
          chapterPatterns: [
            "^spec/src/desktop\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/plugin\\-model/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02)\\.md$)[^/]+\\.md$",
            "^spec/src/workspace\\-shell/(?!(?:index|context(?:-\\d+)?|context|panels)\\.md$)[^/]+\\.md$",
            "^spec/src/plugins/ai/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/plugins/markdown/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/desktop-deno/",
          chapterPatterns: [
            "^spec/src/desktop\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/deno-host-services/",
          chapterPatterns: [
            "^spec/src/server\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/desktop\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/server-deno/",
          chapterPatterns: [
            "^spec/src/server\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/app\\-database/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/web/",
          chapterPatterns: [
            "^spec/src/server\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/web\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/plugin\\-model/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^packages/language-service/(?:src/markdownlint/|package\\.json$)",
          chapterPatterns: [
            "^spec/src/desktop\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^packages/api/src/lib/(?:markdown(?:-extension-registry|-file-surface-registry)?\\.ts|plugin\\.ts|context\\.svelte(?:\\.d)?\\.ts|docs-api\\.ts|index\\.ts)$",
          chapterPatterns: [
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/plugins/markdown/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^packages/api/src/lib/(?:diagnostics/|language-service/|components/editor/language-service/|components/editor/extensions/lint/|workspace\\.ts$|plugin\\.ts$|context\\.svelte\\.ts$)",
          chapterPatterns: [
            "^spec/src/workspace\\-shell/panels/problems/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/language-service/",
          chapterPatterns: [
            "^spec/src/workspace\\-shell/panels/problems/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^stories/plugins/bookmarks/",
          chapterPatterns: [
            "^spec/src/plugins/bookmarks/index\\.md$",
            "^spec/src/storybook\\-catalog/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^stories/plugins/history/",
          chapterPatterns: [
            "^spec/src/plugins/history/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/storybook\\-catalog/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^stories/plugins/graph/",
          chapterPatterns: [
            "^spec/src/plugins/graph/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/storybook\\-catalog/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^stories/plugins/bases/",
          chapterPatterns: [
            "^spec/src/plugins/bases/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/storybook\\-catalog/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^packages/ai-host/",
          chapterPatterns: [
            "^spec/src/plugins/ai/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/desktop\\-deno\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/web\\-host/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern: "^stories/plugins/ai/",
          chapterPatterns: [
            "^spec/src/plugins/ai/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
            "^spec/src/storybook\\-catalog/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^(?:\\.storybook/|stories/catalog/|scripts/storybook-runtime-warnings\\.mjs$)",
          chapterPatterns: [
            "^spec/src/storybook\\-catalog/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^(?:scripts/spec-validation/|spec-validator\\.config\\.mjs$|\\.qmd/index\\.ya?ml$|\\.gitignore$|spec/book\\.toml|AGENTS\\.md$)",
          chapterPatterns: [
            "^spec/src/spec\\-governance/(?!(?:index|context(?:-\\d+)?|context)\\.md$)[^/]+\\.md$",
          ],
        },
        {
          pattern:
            "^(?:package\\.json|pnpm-lock\\.yaml|pnpm-workspace\\.yaml|turbo\\.json|tsconfig(?:\\.[^.]+)*\\.json)$",
          chapterPatterns: [
            "^spec/src/architecture/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
            "^spec/src/packages/(?!(?:index|context(?:-\\d+)?|context\\-01|context\\-02|context\\-03)\\.md$)[^/]+\\.md$",
          ],
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
        name: "specification-docs",
        command: "pnpm",
        args: ["check:specification-docs"],
      },
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
