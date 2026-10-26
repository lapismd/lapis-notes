import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DateTime, Info } from "luxon";
import { expect, it } from "vitest";
import { filenameInputs, providerInputs } from "./native-daily-inputs.test.fixture";
import { captureFilename, captureProvider, captureRegistry } from "./native-daily-reference.test.fixture";

const fixture = resolve("../../crates/lapis-app-core/tests/fixtures/daily-provider.json");
it("freezes complete retained daily-provider, filename and registry behavior", async () => {
  const providers = [];
  for (const input of providerInputs()) providers.push({ ...input, expected: await captureProvider(input) });
  const actual = {
    schema: 1,
    oracleRevision: "19b5389d8d385cf363b342e6259e39597465aab9",
    locale: DateTime.fromISO("2026-08-21", { zone: "utc" }).resolvedLocaleOptions(),
    weekSettings: { firstDay: Info.getStartOfWeek(), minimalDays: Info.getMinimumDaysInFirstWeek() },
    filenames: filenameInputs().map((input) => ({ ...input, expected: captureFilename(input) })),
    providers,
    registry: captureRegistry(),
  };
  if (process.env.LAPIS_NOTES_CAPTURE_DAILY_REFERENCE === "1") {
    await mkdir(resolve("../../test-results"), { recursive: true });
    await writeFile(resolve("../../test-results/daily-provider.json"), JSON.stringify(actual, null, 2) + "\n");
  } else expect(actual).toEqual(JSON.parse(await readFile(fixture, "utf8")));
  expect(actual.filenames.length).toBeGreaterThan(190);
  expect(actual.providers.length).toBeGreaterThan(40);
  expect(providers.find((entry) => entry.name === "default canonical seed")!.expected.result)
    .toEqual({ value: "daily/2026-08-21.md", providerId: "lapis:daily-notes" });
  expect(providers.find((entry) => entry.name === "locate never creates")!.expected.files).toEqual({});
});
