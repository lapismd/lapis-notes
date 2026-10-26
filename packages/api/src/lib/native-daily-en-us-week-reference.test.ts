import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Settings } from "luxon";
import { expect, it } from "vitest";
import {
  captureDailyLocale,
  captureDailyLocaleIo,
} from "./native-daily-locale-reference.test.fixture";
import { nativeTaskDailyFormat } from "./native-tasks";

it("freezes complete retained en-US behavior for declared legacy Intl minimalDays one", async () => {
  const locale = Settings.defaultLocale,
    week = Settings.defaultWeekSettings;
  Settings.defaultLocale = "en-US";
  Settings.defaultWeekSettings = {
    firstDay: 7,
    minimalDays: 1,
    weekend: [6, 7],
  };
  Settings.resetCaches();
  try {
    const actual = {
      ...(await captureDailyLocale()),
      contextOrigin:
        "Declared legacy Intl en-US week settings; not asserted as current Node defaults",
    };
    const io = await captureDailyLocaleIo();
    expect(nativeTaskDailyFormat()).toEqual({
      locale: "en-US",
      firstDay: 7,
      minimalDays: 1,
    });
    expect(actual.filenames).toHaveLength(200);
    expect(actual.providers).toHaveLength(45);
    expect(actual.registry).toHaveLength(19);
    expect(io).toHaveLength(8);
    if (process.env.LAPIS_NOTES_CAPTURE_DAILY_LOCALES_REFERENCE === "1") {
      await mkdir(resolve("../../test-results"), { recursive: true });
      await writeFile(
        resolve("../../test-results/daily-provider-en-us-minimal-one.json"),
        JSON.stringify(actual, null, 2) + "\n",
      );
      await writeFile(
        resolve("../../test-results/daily-provider-en-us-minimal-one-io.json"),
        JSON.stringify(io, null, 2) + "\n",
      );
    } else {
      expect(actual).toEqual(
        JSON.parse(
          await readFile(
            resolve(
              "../../crates/lapis-app-core/tests/fixtures/daily-provider-en-us-minimal-one.json",
            ),
            "utf8",
          ),
        ),
      );
      expect(io).toEqual(
        JSON.parse(
          await readFile(
            resolve(
              "../../crates/lapis-app-core/tests/fixtures/daily-provider-en-us-minimal-one-io.json",
            ),
            "utf8",
          ),
        ),
      );
    }
  } finally {
    Settings.defaultLocale = locale;
    Settings.defaultWeekSettings = week;
    Settings.resetCaches();
  }
});
