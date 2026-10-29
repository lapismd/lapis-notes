import type {
  NativeDesktopVaultAdapter,
  VaultAdapter,
} from "../../dist/index.js";

declare const native: NativeDesktopVaultAdapter;
const saved: Promise<void> = native.writeTextIfUnchanged(
  "note.md",
  "new",
  "old",
);
declare const portable: VaultAdapter;
const created: Promise<void> | undefined = portable.writeTextIfUnchanged?.(
  "new.md",
  "new",
  null,
);
void saved;
void created;
