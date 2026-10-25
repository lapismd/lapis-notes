import assert from "node:assert/strict";
import { test } from "node:test";
import { auditStoryParity } from "./storybook-parity.mjs";

const story = "stories/Example.stories.ts";
const fixture = "stories/Demo.svelte";
const real =
  '<script>import { WorkspaceShell as Shell } from "@lapis-notes/workspace";</script><Shell app={{}} />';
const meta =
  'import Demo from "./Demo.svelte"; const meta = {component:Demo}; export default meta; export const Basic = {};';
function audit(sources = {}, contract = { kind: "application" }) {
  const files = { [story]: meta, [fixture]: real, ...sources };
  return auditStoryParity({
    files: Object.keys(files),
    contracts: { [story]: contract },
    readOptional: (file) => files[file] ?? null,
  });
}

test("real public shell is accepted through an aliased rendered binding", () =>
  assert.deepEqual(audit(), []));
test("an unused shell import cannot qualify a replacement shell", () => {
  assert.ok(
    audit({
      [fixture]:
        '<script>import { WorkspaceShell } from "@lapis-notes/workspace";</script><main>Fake app</main>',
    }).length,
  );
});
test("the actual render override wins over the metadata component", () => {
  const text = meta.replace(
    "export const Basic = {};",
    'import Fake from "./Fake.svelte"; export const Basic = {render: () => ({Component:Fake})};',
  );
  assert.ok(
    audit({ [story]: text, "stories/Fake.svelte": "<main>Replacement</main>" })
      .length,
  );
});
test("local story factories retain literal props and the selected branch", () => {
  const text = meta.replace(
    "export const Basic = {};",
    "function scenario(real) { return {render:() => ({Component:Demo,props:{real}})}; } export const Basic = scenario(false);",
  );
  const demo =
    '<script>import {WorkspaceShell} from "@lapis-notes/workspace"; let {real=true}=$props();</script>{#if real}<WorkspaceShell app={{}} />{:else}<main>Fake</main>{/if}';
  assert.ok(audit({ [story]: text, [fixture]: demo }).length);
  assert.deepEqual(
    audit({
      [story]: text.replace("scenario(false)", "scenario(true)"),
      [fixture]: demo,
    }),
    [],
  );
});
test("imported render factories reach the actual public shell", () => {
  const text =
    'import {renderPlacement as render} from "./render"; const meta={}; export default meta; export const Basic={render:render("left-sidebar")};';
  const factory =
    'import Demo from "./Demo.svelte"; export function renderPlacement(layout) { return args => ({Component:Demo,props:{...args,layout}}); }';
  assert.deepEqual(audit({ [story]: text, "stories/render.ts": factory }), []);
});
test("default component re-exports cannot conceal a replacement", () => {
  const text = meta.replace('"./Demo.svelte"', '"./boundary"');
  assert.deepEqual(
    audit({
      [story]: text,
      "stories/boundary.ts": 'export {default} from "./Demo.svelte";',
    }),
    [],
  );
  assert.ok(
    audit({
      [story]: text,
      "stories/boundary.ts": 'export {default} from "./Fake.svelte";',
      "stories/Fake.svelte": "<main>Replacement</main>",
    }).length,
  );
});
test("unresolved application versus standalone branches fail closed", () => {
  const demo =
    '<script>import {WorkspaceShell} from "@lapis-notes/workspace"; let {choose}=$props();</script>{#if choose}<WorkspaceShell app={{}} />{:else}<main>Fake</main>{/if}';
  assert.ok(
    audit({ [fixture]: demo }).some((x) =>
      /unresolved application/.test(x.message),
    ),
  );
});
test("real App boot and failure presentation remain supported", () => {
  const demo =
    '<script>import {WorkspaceShell} from "@lapis-notes/workspace"; let {app,ready}=$props();</script>{#if ready}<WorkspaceShell {app} />{:else}<p role="status">Loading workspace</p>{/if}';
  assert.deepEqual(audit({ [fixture]: demo }), []);
});
test("dynamic component composition is not waived by a real shell import", () => {
  assert.ok(
    audit({
      [fixture]:
        '<script>import {WorkspaceShell} from "@lapis-notes/workspace"; let {component}=$props();</script><svelte:component this={component}/>',
    }).length,
  );
});
test("production internals cannot be repainted by application fixture CSS", () => {
  assert.ok(
    audit({
      [fixture]:
        real +
        "<style>:global(.ui-workspace-sidebar) { padding: 20px; }</style>",
    }).some((x) => /override/.test(x.message)),
  );
});
test("fixture actions must be isolated in the declared controls component", () => {
  assert.ok(
    audit({ [fixture]: real + "<button>Seed scenario</button>" }).some((x) =>
      /FixtureControls/.test(x.message),
    ),
  );
  const demo =
    real.replace(
      "</script>",
      'import Controls from "./catalog/FixtureControls.svelte";</script>',
    ) + "<Controls><button>Seed scenario</button></Controls>";
  assert.deepEqual(
    audit({
      [fixture]: demo,
      "stories/catalog/FixtureControls.svelte": "<div>Fixture controls</div>",
    }),
    [],
  );
});
test("application shell children cannot replace production presentation", () => {
  assert.ok(
    audit({
      [fixture]: real.replace(
        "<Shell app={{}} />",
        "<Shell app={{}}>Fake chrome</Shell>",
      ),
    }).some((x) => /replacement children/.test(x.message)),
  );
});
test("component coverage identifies the genuine public rendered export", () => {
  const component = {
    kind: "component",
    subject: "@lapismd/design-core/shadcn/button#Button",
  };
  assert.deepEqual(
    audit(
      {
        [fixture]:
          '<script>import {Button} from "@lapismd/design-core/shadcn/button";</script><Button>Action</Button>',
      },
      component,
    ),
    [],
  );
  assert.ok(
    audit(
      {
        [fixture]:
          '<script>import {Button} from "@lapismd/design-core/shadcn/button";</script><button>Fake</button>',
      },
      component,
    ).length,
  );
});
test("prototype coverage needs a real requirement and meaningful purpose", () => {
  assert.ok(audit({}, { kind: "prototype", reason: "demo" }).length);
  assert.deepEqual(
    audit(
      {},
      {
        kind: "prototype",
        requirement: "LN-CAT-118",
        reason:
          "A proposed interaction with explicitly non-application presentation.",
      },
    ),
    [],
  );
});
test("missing and stale family classifications fail closed", () => {
  const files = { [story]: meta, [fixture]: real };
  const readOptional = (file) => files[file] ?? null;
  assert.ok(
    auditStoryParity({ files: Object.keys(files), contracts: {}, readOptional })
      .length,
  );
  assert.ok(
    auditStoryParity({
      files: Object.keys(files),
      contracts: { "stories/Removed.stories.ts": { kind: "application" } },
      readOptional,
    }).some((x) => /Stale/.test(x.message)),
  );
});
test("unresolvable story factories cannot silently use metadata component", () => {
  assert.ok(
    audit({
      [story]: meta.replace(
        "export const Basic = {};",
        "export const Basic = unknownFactory();",
      ),
    }).some((x) => /actual story render path/.test(x.message)),
  );
});

test("known metadata options and absent optional fields preserve render resolution", () => {
  const text = meta.replace(
    "export const Basic = {};",
    'function options(value={}) { const parameters={}; if(value.image && !value.skip) {parameters.image=value.image;} return {parameters}; } export const Basic={...options({image:"baseline.png"})};',
  );
  assert.deepEqual(audit({ [story]: text }), []);
});
test("a factory's property assignment cannot conceal its actual rendered component", () => {
  const text = meta.replace(
    "export const Basic = {};",
    'import Fake from "./Fake.svelte"; function scenario() {const result={Component:Demo}; result.Component=Fake; return result;} export const Basic={render:scenario};',
  );
  assert.ok(
    audit({ [story]: text, "stories/Fake.svelte": "<main>Replacement</main>" })
      .length,
  );
});
test("production startup is allowed only as an App lifecycle fallback", () => {
  const demo =
    '<script>import {WorkspaceShell} from "@lapis-notes/workspace"; import {WorkspaceStartup} from "@lapismd/design-core/workspace/startup"; let {ready,app}=$props();</script>{#if ready}<WorkspaceShell {app}/>{:else}<WorkspaceStartup title="Opening"/>{/if}';
  assert.deepEqual(audit({ [fixture]: demo }), []);
  assert.ok(
    audit({
      [fixture]: demo
        .replace("ready}", "selected}")
        .replace("ready,app", "selected,app"),
    }).length,
  );
});
test("a known browser surface resolves its selected public shell branch", () => {
  const demo =
    '<script>import {WorkspaceShell} from "@lapis-notes/workspace"; import {WorkspaceSettingsSurface} from "@lapismd/design-core/workspace/settings"; let {surface="settings"}=$props();</script>{#if surface === "browser" || somethingUnknown}<WorkspaceShell app={{}}/>{:else}<WorkspaceSettingsSurface/>{/if}';
  const text = meta.replace(
    "export const Basic = {};",
    'export const Basic = {args:{surface:"browser"}};',
  );
  assert.deepEqual(audit({ [story]: text, [fixture]: demo }), []);
  assert.ok(audit({ [fixture]: demo }).length);
});
test("a ready-state name cannot waive replacement placeholder chrome", () => {
  const demo =
    '<script>import {WorkspaceShell} from "@lapis-notes/workspace"; let {ready}=$props();</script>{#if ready}<WorkspaceShell app={{}}/>{:else}<main>Replacement chrome</main>{/if}';
  assert.ok(audit({ [fixture]: demo }).length);
});
test("application fixtures cannot duplicate the production root", () => {
  assert.ok(
    audit({
      [fixture]: real.replace(
        "<Shell app={{}} />",
        "<Shell app={{}}/><Shell app={{}}/>",
      ),
    }).some((x) => /exactly one/.test(x.message)),
  );
});
test("application fixtures cannot repaint the public root through class or style", () => {
  for (const attribute of ['style="width: 300px"', 'class="replacement-frame"'])
    assert.ok(
      audit({
        [fixture]: real.replace(
          "<Shell app={{}} />",
          `<Shell app={{}} ${attribute}/>`,
        ),
      }).some((x) => /override/.test(x.message)),
    );
});

test("nested compound components and public Svelte actions identify their real subject", () => {
  assert.deepEqual(
    audit(
      {
        [fixture]:
          '<script>import {Button} from "@lapismd/design-core/shadcn/button"; import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";</script><Tooltip.Provider><Button>Run</Button></Tooltip.Provider>',
      },
      {
        kind: "component",
        subject: "@lapismd/design-core/shadcn/button#Button",
      },
    ),
    [],
  );
  assert.deepEqual(
    audit(
      {
        [fixture]:
          '<script>import {useTextHighlight} from "@lapis-notes/api";</script><span use:useTextHighlight={{query:"text"}}/>',
      },
      { kind: "component", subject: "@lapis-notes/api#useTextHighlight" },
    ),
    [],
  );
});
test("mixed families validate explicit story overrides and reject stale names", () => {
  assert.deepEqual(
    audit(
      {},
      {
        kind: "component",
        subject: "@lapis-notes/ui#Missing",
        stories: { Basic: { kind: "application" } },
      },
    ),
    [],
  );
  assert.ok(
    audit(
      {},
      { kind: "application", stories: { Removed: { kind: "application" } } },
    ).some((x) => /Stale story/.test(x.message)),
  );
});
test("integration fixtures carry an explicit requirement and cannot claim application parity", () => {
  assert.ok(audit({}, { kind: "integration", reason: "test" }).length);
  assert.deepEqual(
    audit(
      {},
      {
        kind: "integration",
        requirement: "LN-CAT-118",
        reason:
          "Exercises imperative public embed registries in an integration-only fixture.",
      },
    ),
    [],
  );
});
test("explicit fixture setup and data-loading status are safe boot fallbacks", () => {
  const demo =
    '<script>import {WorkspaceShell} from "@lapis-notes/workspace";</script>{#if files}<WorkspaceShell app={{}}/>{:else}<div role="status">Loading fixture</div>{/if}';
  assert.deepEqual(audit({ [fixture]: demo }), []);
});

test("imported fixture CSS cannot repaint production internals", () => {
  const demo = real.replace("</script>", 'import "./fixture.css";</script>');
  assert.ok(
    audit({
      [fixture]: demo,
      "stories/fixture.css": '@import "./paint.css";',
      "stories/paint.css": ".ui-workspace-sidebar {font-size:30px;}",
    }).some((x) => /override/.test(x.message)),
  );
});
test("fixture controls cannot conceal another production shell", () => {
  const demo =
    real.replace(
      "</script>",
      'import Controls from "./catalog/FixtureControls.svelte";</script>',
    ) + "<Controls><Shell app={{}}/></Controls>";
  assert.ok(
    audit({
      [fixture]: demo,
      "stories/catalog/FixtureControls.svelte":
        "<aside>Fixture controls</aside>",
    }).some((x) => /contain.*shell/.test(x.message)),
  );
});
