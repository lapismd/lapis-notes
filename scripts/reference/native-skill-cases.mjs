// Declarative source inputs; this file implements no skill policy.
export const markdown = (name = "research", extra = "", body = "Read notes.") =>
  `---\nname: ${name}\ndescription: Research notes\n${extra}---\n${body}\n`;
export const parseCases = [
  markdown(),
  "",
  "No frontmatter",
  "---\n---\nbody",
  "---\n[]\n---\n",
  "---\nnull\n---\n",
  "---\ntrue\n---\n",
  "---\nname: [\n---\n",
  "---\nname: a\nname: b\n---\n",
  "---\ndescription: x\n---\n",
  markdown("Research"),
  markdown("a/b"),
  markdown("a".repeat(64)),
  markdown("a".repeat(65)),
  markdown("a_1-b"),
  "---\nname: research\n---\n",
  markdown().replace("description: Research notes", "description: 3"),
  markdown(
    "research",
    "user-invocable: false\ndisable-model-invocation: true\n",
  ),
  markdown(
    "research",
    'user-invocable: "false"\ndisable-model-invocation: yes\n',
  ),
  markdown("research", 'argument-hint: " <topic> "\n'),
  markdown("research", "command-dispatch: tool\ncommand-tool: notes_search\n"),
  markdown("research", "command-dispatch: tool\n"),
  markdown("research", "command-dispatch: native\n"),
  markdown(
    "research",
    "command-dispatch: tool\ncommand-tool: x\ncommand-arg-mode: parsed\n",
  ),
  markdown("research", 'command-dispatch: " "\n'),
  markdown(
    "research",
    "metadata:\n  lapis:\n    requires:\n      tools: [notes_search, ' x ', 3, null, '']\n      capabilities: [read]\n      extensions: [search]\n",
  ),
  markdown(
    "research",
    "metadata: {lapis: {requires: {tools: [], extensions: no}}}\n",
  ),
  markdown("research", "metadata: []\n"),
  markdown("research", "", "\ufeff café 📝 \u0085"),
  markdown().replaceAll("\n", "\r\n"),
  markdown().replace(
    "description: Research notes",
    "description: |\n  Read notes\n  Carefully",
  ),
  markdown(
    "research",
    "metadata: &m {lapis: {requires: {tools: [search]}}}\ncopy: *m\n",
  ),
  markdown("research", "argument-hint: null\n"),
];
export const loaded = (name = "research", source = "bundled") => ({
  id: `${source}:${name}`,
  name,
  description: "Bundled research",
  source,
  root: `${source}/${name}`,
  version: "bundled-version",
  userInvocable: true,
  modelInvocable: true,
  command: { kind: "model" },
  instructions: "Bundled rules",
});
export function discovery(files = [], context = {}, sources = {}) {
  const scope = context.scopeDir ?? "";
  const prefixes = [
    ...new Set([
      scope ? `${scope}/.agents/skills` : ".agents/skills",
      ".agents/skills",
      sources.userPrefix ?? ".agents/user/skills",
      ...(sources.extensionRoots ?? []).flatMap(([owner, root]) =>
        (sources.registered ?? [])
          .filter((s) => s.ownerPluginId === owner && s.path)
          .map((s) => `${root.replace(/\/$/u, "")}/${s.path}`),
      ),
    ]),
  ];
  return {
    context: { scopeDir: "", ...context },
    sources,
    files,
    lists: prefixes.map((prefix) => [
      prefix,
      files
        .filter(
          ([path]) =>
            path.startsWith(`${prefix}/`) && path.endsWith("/SKILL.md"),
        )
        .map(([path]) => path),
    ]),
  };
}
const root = ".agents/skills/research/SKILL.md";
const programmatic = (name = "research", values = {}) => ({
  ownerPluginId: "demo",
  kind: "programmatic",
  skill: {
    name,
    description: "Extension research",
    instructions: "Registered rules",
    ...values,
  },
});
export const discoveryCases = [
  discovery(),
  discovery([[root, markdown()]]),
  discovery([["Projects/日本/.agents/skills/research/SKILL.md", markdown()]], {
    scopeDir: "Projects/日本",
  }),
  discovery([[root, markdown()]], {}, { bundled: [loaded()] }),
  discovery(
    [
      [root, markdown()],
      [
        ".agents/user/skills/research/SKILL.md",
        markdown("research", "", "User"),
      ],
    ],
    {},
    { bundled: [loaded()], registered: [programmatic()] },
  ),
  discovery(
    [
      ["Projects/.agents/skills/research/SKILL.md", markdown()],
      [root, markdown()],
    ],
    { scopeDir: "Projects" },
    { registered: [programmatic()] },
  ),
  discovery([
    [root, markdown()],
    [".agents/skills/other/SKILL.md", markdown()],
  ]),
  discovery([
    [root, markdown()],
    [".agents/skills/other/SKILL.md", markdown()],
    [".agents/skills/third/SKILL.md", markdown()],
  ]),
  discovery([
    [root, "Bad"],
    [".agents/skills/good/SKILL.md", markdown("good")],
  ]),
  discovery([
    [".agents/skills/x/scripts/SKILL.md", markdown()],
    [".agents/skills/x/references/SKILL.md", markdown()],
  ]),
  discovery([
    [
      root,
      markdown(
        "research",
        "metadata: {lapis: {requires: {tools: [search]}}}\n",
      ),
    ],
  ]),
  discovery(
    [
      [
        root,
        markdown(
          "research",
          "metadata: {lapis: {requires: {tools: [search]}}}\n",
        ),
      ],
    ],
    { availableToolNames: ["search"] },
  ),
  discovery(
    [
      [
        root,
        markdown(
          "research",
          "metadata: {lapis: {requires: {extensions: [needed]}}}\n",
        ),
      ],
    ],
    { enabledPluginIds: [] },
  ),
  discovery(
    [
      [
        root,
        markdown(
          "research",
          "metadata: {lapis: {requires: {extensions: [needed]}}}\n",
        ),
      ],
    ],
    { enabledPluginIds: ["other"] },
  ),
  discovery([
    [
      root,
      markdown(
        "research",
        "metadata: {lapis: {requires: {capabilities: [unsupported]}}}\n",
      ),
    ],
  ]),
  discovery(
    [],
    { enabledPluginIds: ["other"] },
    { registered: [programmatic()] },
  ),
  discovery([], { enabledPluginIds: [] }, { registered: [programmatic()] }),
  discovery(
    [],
    {},
    {
      registered: [
        programmatic("research", {
          userInvocable: false,
          disableModelInvocation: true,
          argumentHint: "<x>",
          command: { kind: "tool", tool: "search", argMode: "raw" },
        }),
      ],
    },
  ),
  discovery(
    [],
    {},
    {
      registered: [
        programmatic("research", { description: "invalid: mapping" }),
      ],
    },
  ),
  discovery(
    [],
    {},
    {
      registered: [
        programmatic(),
        programmatic("research", { instructions: "Other" }),
      ],
      bundled: [loaded()],
    },
  ),
  discovery(
    [],
    {},
    {
      registered: [
        { ownerPluginId: "demo", kind: "directory", path: "skills" },
      ],
      extensionFiles: [
        [
          "demo:skills",
          [
            ["research/SKILL.md", markdown()],
            ["README.md", "Ignored"],
            ["bad/SKILL.md", "Bad"],
          ],
        ],
      ],
    },
  ),
  discovery(
    [[".lapis/plugins/demo/skills/research/SKILL.md", markdown()]],
    {},
    {
      registered: [{ ownerPluginId: "demo", kind: "root", path: "skills" }],
      extensionRoots: [["demo", ".lapis/plugins/demo"]],
    },
  ),
  discovery(
    [["custom/research/SKILL.md", markdown()]],
    {},
    { userPrefix: "custom/" },
  ),
  discovery([
    [".agents/skills/z/SKILL.md", markdown("z")],
    [".agents/skills/a/SKILL.md", markdown("a")],
    [".agents/skills/a_b/SKILL.md", markdown("a_b")],
    [".agents/skills/a-b/SKILL.md", markdown("a-b")],
  ]),
];
const escaping = discovery([["outside/SKILL.md", markdown()]]);
escaping.lists[0][1] = ["outside/SKILL.md", ".agents/skills/a/../b/SKILL.md"];
discoveryCases.push(escaping);
