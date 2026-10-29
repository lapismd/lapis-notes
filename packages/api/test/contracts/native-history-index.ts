import type {
  HistoryIndexCommand,
  HistoryIndexValue,
  NativeHistoryIndex,
} from "@lapis-notes/api/native-history-index";

const status: HistoryIndexValue = {
  generation: 0,
  indexed: 0,
  omitted: 0,
  complete: true,
};
const context: HistoryIndexValue = {
  text: "saved text",
  start: 0,
  end: 1,
  before: false,
  after: true,
};
const command: HistoryIndexCommand = { kind: "start" };
declare const service: NativeHistoryIndex;
const result: Promise<HistoryIndexValue> = service.call(command);
// @ts-expect-error A renderer cannot schedule indexing batches.
service.call({ kind: "step" });
// @ts-expect-error Physical storage is never request authority.
service.call({ kind: "status", root: "/outside" });
void [status, context, result];
