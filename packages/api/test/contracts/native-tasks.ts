import type { App, AppStateProperties } from "../../dist";
import type {
  NativeTasks,
  NativeTaskCommand,
  NativeTaskValue,
} from "../../dist/native-tasks";

const command = {
  kind: "mutate",
  path: "Task.md",
  expected_version: "a".repeat(64),
  mutation: {
    type: "tracking",
    tracking: { type: "count", unit: "pages", target: 5 },
    at: "2026-10-26T09:00:00Z",
  },
} satisfies NativeTaskCommand;
const lifecycle = {
  kind: "submit",
  request: {
    request_id: "uuid",
    path: "Task.md",
    expected_version: "a".repeat(64),
    action: {
      type: "complete",
      at: "2026-10-26T09:00:00Z",
      localDate: "2026-10-26",
      trackedValue: null,
    },
  },
} satisfies NativeTaskCommand;
const unavailable = {
  kind: "configure",
  configuration: {
    day_parts: { afternoonStartsAt: "12:00", eveningStartsAt: "17:00" },
    daily: { folder: "daily", date_format: "yyyy-LL-dd" },
    format: { locale: "en-US", firstDay: 7, minimalDays: 4 },
    provider: { kind: "unavailable", message: "Custom provider" },
  },
} satisfies NativeTaskCommand;
const service: NativeTasks = {
  async call() {
    return { kind: "operation", operation: null } satisfies NativeTaskValue;
  },
};
const forbidden: NativeTaskCommand = {
  kind: "status",
  // @ts-expect-error The admitted transport owns filesystem authority.
  root: "/outside",
};
const noBypass: NativeTaskCommand = {
  kind: "mutate",
  path: "Task.md",
  expected_version: "version",
  mutation: {
    // @ts-expect-error Complete cannot bypass the ordered lifecycle journal.
    type: "complete",
    at: "now",
    localDate: "2026-10-26",
    trackedValue: null,
  },
};
void [command, lifecycle, unavailable, service, forbidden, noBypass];

const appOptions = { nativeTasks: service } satisfies Pick<
  AppStateProperties,
  "nativeTasks"
>;
declare const app: App;
void [appOptions, app.nativeTasks?.call(command)];
