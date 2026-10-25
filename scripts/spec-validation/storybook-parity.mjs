import { resolve } from "node:path";
import { sourceModel } from "./story-parity/csf.mjs";
import { compositionModel } from "./story-parity/svelte.mjs";

export const name = "storybookCompositionParity";
export function auditStoryParity({
  files,
  contracts,
  readOptional,
  rule = "LN-CAT-118",
}) {
  const findings = [],
    source = sourceModel(files, readOptional),
    composition = compositionModel(source, readOptional);
  const add = (file, message, node) =>
    findings.push({
      code: "STORYBOOK-PARITY",
      rule,
      file,
      line: node
        ? source
            .module(file)
            .tree.getLineAndCharacterOfPosition(node.getStart()).line + 1
        : 1,
      message,
    });
  const stories = files.filter((file) =>
    /\.stories\.(?:[cm]?[jt]sx?|svelte)$/.test(file),
  );
  for (const file of Object.keys(contracts))
    if (!stories.includes(file))
      add(file, "Stale story classification: source is absent.");
  for (const file of stories) {
    const contract = contracts[file];
    if (
      !contract ||
      !["application", "component", "prototype", "integration"].includes(
        contract.kind,
      )
    ) {
      add(
        file,
        "Every executable story family must declare application, component, integration or prototype coverage.",
      );
      continue;
    }
    if (["prototype", "integration"].includes(contract.kind)) {
      if (
        !/^(?:LN|LP)-[A-Z]+-\d{3}$/.test(contract.requirement ?? "") ||
        typeof contract.reason !== "string" ||
        contract.reason.length < 30
      )
        add(
          file,
          "Integration fixtures and prototypes must declare a governing requirement and a specific purpose.",
        );
      continue;
    }
    const validSubject = (subject) =>
      /^@(?:lapis-notes|lapismd)\/[\w./-]+#[\w.]+$/.test(subject ?? "") ||
      (/^packages\/[\w-]+\/src\/(?!.*\.\.)[\w./-]+\.svelte#default$/.test(
        subject ?? "",
      ) &&
        files.includes(subject.split("#")[0]));
    if (contract.kind === "component" && !validSubject(contract.subject)) {
      add(
        file,
        "Component stories must identify their genuine public package subject and export.",
      );
      continue;
    }
    if (file.endsWith(".svelte")) {
      add(
        file,
        "Unsupported CSF source format requires explicit composition parser support.",
      );
      continue;
    }
    try {
      const model = source.module(file);
      if (!model.stories.length)
        add(file, "Classified story file exports no executable stories.");
      for (const entry of Object.keys(contract.stories ?? {}))
        if (!model.stories.some((story) => story.name === entry))
          add(file, `Stale story override: ${entry} is not exported.`);
      for (const entry of model.stories) {
        const selected = contract.stories?.[entry.name] ?? contract;
        if (
          !["application", "component"].includes(selected.kind) ||
          (selected.kind === "component" && !validSubject(selected.subject))
        ) {
          add(
            file,
            `${entry.name}: invalid story coverage override.`,
            entry.node,
          );
          continue;
        }
        const story = source.symbol(file, entry.name),
          rendered = source.rendered(file, story);
        if (!rendered) {
          add(
            file,
            `${entry.name}: cannot resolve the actual story render path.`,
            entry.node,
          );
          continue;
        }
        const outcome = composition.inspect(
          rendered.reference,
          rendered.props,
          selected.kind,
          selected.subject,
        );
        if (!outcome.reaches)
          add(
            file,
            `${entry.name}: rendered composition does not reach ${selected.kind === "application" ? "the public production WorkspaceShell" : selected.subject}.`,
            entry.node,
          );
        for (const message of new Set(outcome.errors))
          add(file, `${entry.name}: ${message}`, entry.node);
      }
    } catch (error) {
      add(file, `Cannot prove story composition: ${error.message}`);
    }
  }
  return findings;
}
export function validate(context) {
  const root = context.model.repoRoot;
  const readOptional = (file) => context.readOptional(resolve(root, file));
  const manifest = readOptional("stories/catalog/story-parity.json");
  if (!manifest)
    return [
      {
        code: "STORYBOOK-PARITY",
        rule: "LN-CAT-118",
        file: "stories/catalog/story-parity.json",
        line: 1,
        message: "Story classification inventory is missing.",
      },
    ];
  return auditStoryParity({
    files: context.trackedFiles,
    contracts: JSON.parse(manifest),
    readOptional,
  });
}
export default { name, validate };
