import type {
  AppDatabaseChangeSet,
  ChangeDomain,
  ChangedPath,
  ChangeSet,
  DatabaseCall,
  DatabaseMethod,
  DatabaseValue,
  RemoteAppDatabaseMethod,
} from "../../dist/app-database-host.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;
type CompleteMethodCatalogue = Assert<
  Equal<DatabaseMethod, RemoteAppDatabaseMethod>
>;
type RetainedChanges = Assert<Equal<ChangeSet, AppDatabaseChangeSet>>;

const omitted: DatabaseValue = { kind: "undefined" };
const explicitNull: DatabaseValue = { kind: "value", value: null };
const call: DatabaseCall = { method: "setMeta", args: [omitted, explicitNull] };
const domain: ChangeDomain = "metadata";
const renamed: ChangedPath = { oldPath: "old.md", newPath: "new.md" };
const change: ChangeSet = {
  revision: 1,
  domains: [domain],
  paths: [],
  renamed: [renamed],
  reset: true,
  committedAt: 1,
};
void [call, change];
