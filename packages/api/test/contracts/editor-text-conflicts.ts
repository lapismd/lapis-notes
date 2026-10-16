import type {
  App,
  FileTextConflict,
  FileTextResolution,
  Vault,
  TFile,
} from "../../dist/index";

declare const app: App;
declare const vault: Vault;
declare const file: TFile;
const supported: boolean = vault.supportsConditionalTextWrites;
const write: Promise<void> = vault.modifyIfUnchanged(file, "new", "old");
const conflicts: readonly FileTextConflict[] =
  app.fileEditingSessions.textConflicts.entries;
const choice: FileTextResolution = "keep-local";
const stop: () => void = app.fileEditingSessions.textConflicts.subscribe(
  () => {},
);
void supported;
void write;
void choice;
void stop;
if (conflicts[0]) void conflicts[0].resolve(choice);
