import { type Socket } from "node:net";

export type NativeAction =
  | { method: "ping" | "shutdown" }
  | {
      method: "bind";
      scope: string;
      vault: string;
      generation: number;
      source: "original" | "backup";
    }
  | { method: "history"; scope: string; operation: string; frame: string }
  | { method: "revoke"; scope: string };

export type NativeResponse = {
  version: number;
  id: string;
  frame: string | null;
  error: unknown;
};
export const MAX_REQUEST_BYTES = 1024 * 1024;
export const MAX_RESPONSE_BYTES = 100 * 1024 * 1024;

/** Bounded chunks avoid repeatedly copying a large escaped history response. */
export function readResponses(
  socket: Socket,
  receive: (value: NativeResponse) => void,
  fail: (error: Error) => void,
): void {
  let chunks: Buffer[] = [];
  let size = 0;
  socket.on("data", (data: Buffer) => {
    try {
      let from = 0;
      while (from < data.length) {
        const newline = data.indexOf(10, from);
        const end = newline < 0 ? data.length : newline;
        const chunk = data.subarray(from, end);
        size += chunk.length;
        if (size > MAX_RESPONSE_BYTES)
          throw new Error("Native response exceeds its byte limit");
        chunks.push(chunk);
        if (newline < 0) break;
        const value: unknown = JSON.parse(
          Buffer.concat(chunks, size).toString("utf8"),
        );
        chunks = [];
        size = 0;
        if (!value || typeof value !== "object")
          throw new Error("Invalid native response");
        receive(value as NativeResponse);
        from = newline + 1;
      }
    } catch {
      fail(
        new Error("Invalid or oversized native response; outcome is uncertain"),
      );
    }
  });
}
