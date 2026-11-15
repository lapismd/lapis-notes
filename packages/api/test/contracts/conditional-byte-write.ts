import type { VaultAdapter } from "../../dist/index";
import {
  BrowserHandleVaultAdapter,
  MemoryVaultAdapter,
} from "../../dist/index";

declare const portable: VaultAdapter;
declare const browser: BrowserHandleVaultAdapter;
const data = new Uint8Array([255]).buffer;
const optional: Promise<void> | undefined = portable.writeBinaryIfUnchanged?.(
  "reference.md",
  data,
  null,
);
const browserSaved: Promise<void> = browser.writeBinaryIfUnchanged(
  "reference.md",
  data,
  data,
);
const memorySaved: Promise<void> =
  new MemoryVaultAdapter().writeBinaryIfUnchanged("reference.md", data, null);
void [optional, browserSaved, memorySaved];
