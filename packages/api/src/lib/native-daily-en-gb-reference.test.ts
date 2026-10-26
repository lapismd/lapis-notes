import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Settings } from "luxon";
import { expect, it } from "vitest";
import {
  captureDailyLocale,
  captureDailyLocaleIo,
} from "./native-daily-locale-reference.test.fixture";
import { nativeTaskDailyFormat } from "./native-tasks";

it("freezes the complete unchanged en-GB daily filename provider and registry oracle", async () => {
  const previous = Settings.defaultLocale;
  Settings.defaultLocale = "en-GB";
  Settings.resetCaches();
  try {
    const actual = await captureDailyLocale();
    const io = await captureDailyLocaleIo();
    expect(nativeTaskDailyFormat()).toEqual({
      locale: actual.locale.locale,
      ...actual.weekSettings,
    });
    expect(actual.locale).toEqual({
      locale: "en-GB",
      numberingSystem: "latn",
      outputCalendar: "gregory",
    });
    expect(actual.filenames).toHaveLength(200);
    expect(actual.providers).toHaveLength(45);
    expect(actual.registry).toHaveLength(19);
    if (process.env.LAPIS_NOTES_CAPTURE_DAILY_LOCALES_REFERENCE === "1") {
      await mkdir(resolve("../../test-results"), { recursive: true });
      await writeFile(
        resolve("../../test-results/daily-provider-en-gb.json"),
        JSON.stringify(actual, null, 2) + "\n",
      );
      await writeFile(
        resolve("../../test-results/daily-provider-en-gb-io.json"),
        JSON.stringify(io, null, 2) + "\n",
      );
    } else
      expect(actual).toEqual(
        JSON.parse(
          await readFile(
            resolve(
              "../../crates/lapis-app-core/tests/fixtures/daily-provider-en-gb.json",
            ),
            "utf8",
          ),
        ),
      );
    if (process.env.LAPIS_NOTES_CAPTURE_DAILY_LOCALES_REFERENCE !== "1")
      expect(io).toEqual(
        JSON.parse(
          await readFile(
            resolve(
              "../../crates/lapis-app-core/tests/fixtures/daily-provider-en-gb-io.json",
            ),
            "utf8",
          ),
        ),
      );
  } finally {
    Settings.defaultLocale = previous;
    Settings.resetCaches();
  }
});
