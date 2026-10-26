import { DateTime, Info } from "luxon";
import {
  filenameInputs,
  providerInputs,
} from "./native-daily-inputs.test.fixture";
import {
  captureFilename,
  captureProvider,
  captureRegistry,
} from "./native-daily-reference.test.fixture";

export async function captureDailyLocale() {
  const providers = [];
  for (const input of providerInputs())
    providers.push({ ...input, expected: await captureProvider(input) });
  return {
    schema: 1,
    oracleRevision: "d6e0427f83d613b662f4d28df8c65e691e0588b6",
    locale: DateTime.fromISO("2026-08-21", {
      zone: "utc",
    }).resolvedLocaleOptions(),
    weekSettings: {
      firstDay: Info.getStartOfWeek(),
      minimalDays: Info.getMinimumDaysInFirstWeek(),
    },
    filenames: filenameInputs().map((input) => ({
      ...input,
      expected: captureFilename(input),
    })),
    providers,
    registry: captureRegistry(),
  };
}

export async function captureDailyLocaleIo() {
  const io = [];
  for (const format of [
    "yyyy-LL-dd",
    "yyyy-MM-dd",
    "dd-LL-yyyy",
    "yyyy LLL dd",
    "yyyy LLLL dd",
    "DD",
    "DDD",
    "DDDD",
  ]) {
    const input = {
      name: format,
      date: "2026-08-21",
      operation: "ensure" as const,
      configuration: {
        "dailyNotes.folder": "Journal/Daily",
        "dailyNotes.dateFormat": format,
      },
    };
    io.push({ ...input, expected: await captureProvider(input) });
  }
  return io;
}
