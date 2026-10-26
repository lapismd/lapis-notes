import type {
  App,
  AppStateProperties,
  VaultSession,
} from "../../dist/index.js";
import type { NativeHistoryIndex } from "../../dist/native-history-index.js";

declare const app: App;
declare const session: VaultSession;
declare const options: AppStateProperties;
declare const port: NativeHistoryIndex;

session.nativeHistoryIndex = port;
options.nativeHistoryIndex = port;
const owned: NativeHistoryIndex | undefined = app.nativeHistoryIndex;
void owned?.call({ kind: "status" });
void owned?.call({
  kind: "query",
  search: {
    expression: { type: "term", field: "content", value: "saved" },
    case_sensitive: false,
    cursor: null,
    limit: 20,
  },
});
// @ts-expect-error Hosts retain native index ownership; renderers cannot step it.
void owned?.call({ kind: "step" });
// @ts-expect-error An App's admitted port cannot be replaced by plugin code.
app.nativeHistoryIndex = port;
