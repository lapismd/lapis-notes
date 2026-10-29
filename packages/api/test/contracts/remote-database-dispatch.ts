import {
  parseRemoteAppDatabaseArgs,
  type RemoteAppDatabaseArgs,
  type RemoteAppDatabaseMethod,
} from "../../dist/app-database-host.js";

// A transport dispatches the whole catalogue, not one literal method at a time.
declare const method: RemoteAppDatabaseMethod;
const empty: RemoteAppDatabaseArgs<RemoteAppDatabaseMethod> = [];
const args = parseRemoteAppDatabaseArgs(method, empty);
const encoded: unknown[] = args.map((value: unknown) => value);
void encoded;

const literal: RemoteAppDatabaseArgs<"getMeta"> = ["key"];
// @ts-expect-error A specific required method still requires its argument.
const missing: RemoteAppDatabaseArgs<"getMeta"> = [];
// @ts-expect-error Raw SQL is not a public AppDatabase method.
type UnknownMethod = RemoteAppDatabaseArgs<"exec">;
void [literal, missing];
