# Released Search registry intake

Canvas group SVG qualification exposed an API-owned resource MIME defect. Its
wider catalog run also found six Search accessible-name failures. Before
changing their assertions, an isolated unchanged-main checkout reproduced the
exact Middle Top Tabs failure:

    pnpm exec vitest run --project storybook stories/plugins/search/panels/Search.stories.ts -t 'Middle Top Tabs'

The root and private application profile were still locked to Search 0.1.3.
The canonical consumer contract and current assertion require filename, count,
path and match count; the old package exposed only path and match count.
Registry Search 0.1.6 already supplies the required label. Its public tarball
was inspected before intake. Both manifests now require `^0.1.6` and the
lockfile resolves that released registry package. No source is copied and no
assertion, accessibility exclusion or threshold is weakened.

The unchanged-main exact target failed once, and the original wider run failed
all six placements. The released-package intake passes all six without changing
their assertions. Root check/test/build lanes pass 16/16, 16/16 and 9/9 tasks;
the complete specification lane passes. The combined API candidate's cold
catalog passes all 62 families and 275 tests with zero failures or skips (run
bf8c06fc-0da8-41ad-9be0-529046aaa2dc). All seven installed Canvas Web cases pass
through the updated profile and public API host.

The first combined catalog attempt passed 273 cases before one browser
disconnect prevented the two link-preview acceptance stories from running.
Both exact stories pass in a fresh native process; the subsequent full cold
run passes every case. No product assertions or test infrastructure changed
to dismiss that failure. This dependency change remains separate from the API
MIME fix.

The lock refresh was subsequently narrowed to Search and the additional
registry dependency closure it requires. Existing unrelated Zod/Rollup
resolutions and the Deno cache lock are preserved. A frozen install accepts
the final graph, and the exact six placements pass again. The final combined
candidate repeats the complete catalog: 62 families, 275 passes, zero failures
or skips (validation run c3cf92b6-a75e-445e-ae32-44d153bde851), with root
check/test/build and specification lanes also green.

The final stack incorporates main's independently merged deferred-plugin
activation fix (#90). That merge already raised the root Search range; this
PR retains it and updates the private application profile's remaining range
and lock importer. Both qualification paragraphs survive the canonical merge.
