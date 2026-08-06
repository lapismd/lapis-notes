import type { DataWriteOptions, Stat } from "./fs";

export interface BlobStoreLike {
  exists(path: string): Promise<boolean>;
  stat(path: string): Promise<Stat | null>;
  readBytes(path: string): Promise<ArrayBuffer>;
  writeBytes(
    path: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void>;
  delete(path: string): Promise<void>;
  copy(path: string, newPath: string): Promise<void>;
  move(path: string, newPath: string): Promise<void>;
  createObjectUrl?(path: string): Promise<string>;
  revokeObjectUrl?(url: string): void;
}
