import {
  REMOTE_APP_DATABASE_METHODS,
  isRemoteAppDatabaseMethod,
  type RemoteAppDatabaseMethod,
} from "@lapis-notes/api/app-database";

export const DESKTOP_APP_DATABASE_METHODS = REMOTE_APP_DATABASE_METHODS;

export type DesktopAppDatabaseMethod = RemoteAppDatabaseMethod;

export function isDesktopAppDatabaseMethod(
  value: unknown,
): value is DesktopAppDatabaseMethod {
  return isRemoteAppDatabaseMethod(value);
}
