import {
  DenoFileWatchService as DenoHostFileWatchService,
  mapDenoWatchEvent,
  type RealPath,
  type WatchFactory,
} from "@lapis-notes/deno-host-services/file-watch";
import type { RendererNativeEvent } from "./renderer-events.ts";

export { mapDenoWatchEvent };

type Emit = (event: RendererNativeEvent) => Promise<void>;

export class DenoFileWatchService extends DenoHostFileWatchService {
  constructor(emit: Emit, watch?: WatchFactory, realPath?: RealPath) {
    super(
      async ({ watchId, event }) =>
        emit({
          channel: "desktop_fs_watch_event",
          payload: { watchId, event },
        }),
      watch,
      realPath,
    );
  }
}
