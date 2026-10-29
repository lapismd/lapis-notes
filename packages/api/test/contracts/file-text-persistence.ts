import {
  FileTextPersistence,
  type App,
  type FileTextPersistenceOptions,
  type FileTextRecoveryLease,
  type TFile,
} from "../../dist/index.js";

declare const app: App;
declare const file: TFile;
const lease: FileTextRecoveryLease = {
  release() {},
  saved() {},
  reset(_contents: string) {},
};
const options: FileTextPersistenceOptions = {
  vault: app.vault,
  file,
  baseline: "original",
  conflicts: app.fileEditingSessions.textConflicts,
  local: () => "draft",
  protect: async () => lease,
  serialize: (run) => run(),
};
const persistence = new FileTextPersistence(options);
const result: Promise<void> = persistence.persist("draft");
persistence.acceptBaseline("clean refresh");
persistence.updateLocal("retained draft");
const conflicted: boolean = persistence.hasConflict;
void result;
void conflicted;
