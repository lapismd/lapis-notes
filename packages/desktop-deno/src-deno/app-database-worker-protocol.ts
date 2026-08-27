import type {
  AppDatabaseChangeSet,
  AppDatabaseDescriptor,
} from "../../api/src/lib/storage/app-database.ts";
import type { DesktopAppDatabaseMethod } from "../src/desktop-app-database-protocol.ts";

export type AppDatabaseWorkerOpenInput = {
  databaseId: string;
  vaultId: string;
  path: string;
};

export type AppDatabaseWorkerRequest =
  | ({ id: number; type: "open" } & AppDatabaseWorkerOpenInput)
  | { id: number; type: "close"; databaseId: string }
  | {
      id: number;
      type: "invoke";
      databaseId: string;
      method: DesktopAppDatabaseMethod;
      args: unknown[];
    }
  | { id: number; type: "close-all" };

export type AppDatabaseWorkerRequestInput =
  AppDatabaseWorkerRequest extends infer TRequest
    ? TRequest extends { id: number }
      ? Omit<TRequest, "id">
      : never
    : never;

export type AppDatabaseWorkerError = {
  name: string;
  message: string;
  stack?: string;
};

export type AppDatabaseWorkerResponse =
  | {
      type: "result";
      id: number;
      ok: true;
      value?: unknown;
    }
  | {
      type: "result";
      id: number;
      ok: false;
      error: AppDatabaseWorkerError;
    }
  | {
      type: "change";
      databaseId: string;
      vaultId: string;
      change: AppDatabaseChangeSet;
    };

export function serializeAppDatabaseWorkerError(
  error: unknown,
): AppDatabaseWorkerError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }
  return { name: "Error", message: String(error) };
}

export function deserializeAppDatabaseWorkerError(
  error: AppDatabaseWorkerError,
): Error {
  const result = new Error(error.message);
  result.name = error.name;
  if (error.stack) result.stack = error.stack;
  return result;
}

export function nativeDatabaseDescriptor(
  value: unknown,
): AppDatabaseDescriptor {
  return value as AppDatabaseDescriptor;
}
