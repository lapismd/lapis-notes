import type {
  SyncIndexedRepository,
  SyncVaultStateCrypto,
  SealedSyncRecord,
} from "@lapis-notes/api/sync-repository";
import type { PendingMutation } from "./sync-vault-state.ts";
import { hash, hashBytes } from "./sync-vault-files.ts";

export async function sealNativeRecord(
  crypto: SyncVaultStateCrypto,
  epoch: number,
  plaintext: Uint8Array,
): Promise<SealedSyncRecord> {
  let sealed;
  try {
    sealed = await crypto.encryptObject({
      epoch,
      type: "local-state",
      plaintext,
    });
  } finally {
    plaintext.fill(0);
  }
  if (
    sealed.bytes.length < 42 ||
    sealed.bytes[0] !== 1 ||
    sealed.bytes[1] !== 8 ||
    hashBytes(sealed.bytes) !== sealed.objectHash
  )
    throw new Error("Invalid native journal encryption envelope");
  return { epoch, ciphertext: sealed.bytes };
}

/** Encrypted receipts remain immutable while the active journal is compacted. */
export class NativeVaultReceipts {
  constructor(
    readonly options: {
      repository: SyncIndexedRepository;
      crypto: SyncVaultStateCrypto;
      vaultId: string;
      devicePublicKey: string;
      rootBinding: string;
    },
  ) {}

  async read(operationId: string): Promise<PendingMutation | null> {
    const key = hash(operationId),
      record = await this.options.repository.records.get(key);
    if (!record) return null;
    const bytes = await this.options.crypto.decryptObject({
      epoch: record.epoch,
      type: "local-state",
      envelope: record.ciphertext,
    });
    let payload;
    try {
      payload = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
    } finally {
      bytes.fill(0);
    }
    if (
      !payload ||
      payload.domain !== "lapis-native-receipt-v1" ||
      payload.vaultId !== this.options.vaultId ||
      payload.devicePublicKey !== this.options.devicePublicKey ||
      payload.rootBinding !== this.options.rootBinding ||
      payload.epoch !== record.epoch ||
      payload.key !== key ||
      payload.mutation?.operation?.id !== operationId ||
      typeof payload.mutation.token !== "string" ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/u.test(
        payload.mutation.token,
      ) ||
      payload.mutation.phase !== "completed" ||
      !payload.mutation.receipt ||
      JSON.stringify(payload.mutation.receipt.operation) !==
        JSON.stringify(payload.mutation.operation) ||
      JSON.stringify(payload.mutation.receipt.result) !==
        JSON.stringify(payload.mutation.result)
    )
      throw new Error(
        "Native receipt does not belong to this operation, vault, device and root",
      );
    return payload.mutation;
  }

  seal(mutation: PendingMutation, epoch: number): Promise<SealedSyncRecord> {
    if (mutation.phase !== "completed" || !mutation.receipt)
      throw new Error("Only completed native mutations can be archived");
    return sealNativeRecord(
      this.options.crypto,
      epoch,
      new TextEncoder().encode(
        JSON.stringify({
          domain: "lapis-native-receipt-v1",
          vaultId: this.options.vaultId,
          devicePublicKey: this.options.devicePublicKey,
          rootBinding: this.options.rootBinding,
          epoch,
          key: hash(mutation.operation.id),
          mutation,
        }),
      ),
    );
  }
}
