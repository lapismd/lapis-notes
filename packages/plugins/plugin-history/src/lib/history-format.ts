import type { HistoryCaptureEventType } from "./history-plugin";

export function formatHistoryTimestamp(value: number): string {
  return new Date(value).toLocaleString();
}

export function formatHistoryEvent(eventType: HistoryCaptureEventType): string {
  switch (eventType) {
    case "baseline":
      return "Opened";
    case "create":
      return "Created";
    case "modify":
      return "Edited";
    case "rename":
      return "Renamed";
    case "delete":
      return "Deleted";
    case "restore":
      return "Restored";
  }
}
