import type { App, AppStateProperties } from "../../dist";
import type {
  NativeBackgroundJobs,
  BackgroundJobCommand,
} from "../../dist/background-jobs";
declare const port: NativeBackgroundJobs;
declare const app: App;
const options = { nativeBackgroundJobs: port } satisfies Pick<
  AppStateProperties,
  "nativeBackgroundJobs"
>;
const command = { kind: "list" } satisfies BackgroundJobCommand;
void [options, app.backgroundJobs?.call(command)];
