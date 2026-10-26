import type {
  HistoryIndexCommand,
  HistoryIndexValue,
} from "./native-history-index-protocol";
export type * from "./native-history-index-protocol";

/** Already admitted to one vault; observers never own indexing or capture. */
export interface NativeHistoryIndex {
  call(command: HistoryIndexCommand): Promise<HistoryIndexValue>;
}
