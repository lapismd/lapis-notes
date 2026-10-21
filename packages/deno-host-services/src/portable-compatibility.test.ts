import { describe, expect, it } from "vitest";
import * as paths from "../../host-services/src/paths.ts";
import { AppDatabaseWorkerRuntime } from "../../host-services/src/app-database-worker-runtime.ts";
import { serializeAppDatabaseWorkerError } from "../../host-services/src/app-database-worker-protocol.ts";
import { openNativeTursoAppDatabase } from "../../host-services/src/native-app-database.ts";
import {
  handleLanguageService,
  HOST_LANGUAGE_SERVICE_PROTOCOL_VERSION,
} from "../../host-services/src/language-service.ts";
import * as retainedPaths from "./paths.ts";
import { AppDatabaseWorkerRuntime as RetainedRuntime } from "./app-database-worker-runtime.ts";
import { serializeAppDatabaseWorkerError as retainedSerialize } from "./app-database-worker-protocol.ts";
import { openNativeTursoAppDatabase as retainedOpen } from "./native-app-database.ts";
import {
  handleLanguageService as retainedLanguage,
  DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION,
} from "./language-service.ts";

describe("retained Deno host-service subpaths", () => {
  it("re-exports the same portable implementations and protocol identity", () => {
    expect(retainedPaths.normalizeVaultPath).toBe(paths.normalizeVaultPath);
    expect(RetainedRuntime).toBe(AppDatabaseWorkerRuntime);
    expect(retainedSerialize).toBe(serializeAppDatabaseWorkerError);
    expect(retainedOpen).toBe(openNativeTursoAppDatabase);
    expect(retainedLanguage).toBe(handleLanguageService);
    expect(DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION).toBe(
      HOST_LANGUAGE_SERVICE_PROTOCOL_VERSION,
    );
  });
});
