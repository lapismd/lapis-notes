import type {
  SyncCryptoStatus,
  SyncCryptoEnrollmentRequest,
  SyncHostService,
} from "@lapis-notes/api";
import type { DenoDesktopBridge } from "./main";

interface DesktopWrappingKeyResponse {
  provider: "os-credential-store";
  keyId: string;
  wrappingKeyBase64: string;
}

export function createDesktopSyncUnlockHandler(options: {
  bridge: DenoDesktopBridge;
  vaultId: string;
  getSyncHost(): SyncHostService;
}): (
  pluginId: string,
  status: SyncCryptoStatus,
  enrollment?: SyncCryptoEnrollmentRequest,
) => Promise<void> {
  return async (pluginId, status, enrollment) => {
    if (status.state === "unlocked") return;
    const response = await options.bridge.invoke<DesktopWrappingKeyResponse>(
      "desktop_sync_wrapping_key_get",
      {
        vaultId: options.vaultId,
        pluginId,
        create: status.state === "unenrolled",
      },
    );
    if (
      response.provider !== "os-credential-store" ||
      typeof response.keyId !== "string" ||
      typeof response.wrappingKeyBase64 !== "string"
    ) {
      throw new Error("The desktop secure-storage response is invalid");
    }
    const wrappingKey = fromBase64(response.wrappingKeyBase64);
    if (wrappingKey.byteLength !== 32) {
      wrappingKey.fill(0);
      throw new Error("The desktop secure-storage key is invalid");
    }
    try {
      if (status.state === "unenrolled") {
        await options.getSyncHost().enrollPluginCryptoWithWrappingKey(
          pluginId,
          wrappingKey,
          {
            name: "external",
            provider: "os-credential-store",
            keyId: response.keyId,
          },
          enrollment,
        );
      } else {
        await options
          .getSyncHost()
          .unlockPluginCryptoWithWrappingKey(pluginId, wrappingKey);
      }
    } finally {
      wrappingKey.fill(0);
    }
  };
}

function fromBase64(value: string): Uint8Array {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return new Uint8Array();
  }
}
