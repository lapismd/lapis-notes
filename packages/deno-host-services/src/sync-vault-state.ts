import type {
  SyncFileGeneration,
  SyncFileMutation,
  SyncFileMutationReceipt,
  SyncIndexedRepository,
  SyncVaultStateCrypto,
} from "@lapis-notes/api/sync-repository";
import type { DiskFile } from "./sync-vault-files.ts";
import { hash } from "./sync-vault-files.ts";
import {
  NativeVaultReceipts,
  sealNativeRecord,
} from "./sync-vault-receipts.ts";

export interface NativeVaultAuthority {
  epoch: number;
  generation: number;
}

export interface TrackedFile extends SyncFileGeneration {
  disk: DiskFile;
}
export interface PendingMutation {
  operation: SyncFileMutation;
  token: string;
  phase: "prepared" | "claimed" | "installed" | "completed";
  before: TrackedFile | null;
  after: DiskFile | null;
  result: SyncFileGeneration | null;
  receipt?: SyncFileMutationReceipt;
}
export interface VaultJournal {
  schemaVersion: 2;
  counter: number;
  paths: Record<string, TrackedFile>;
  mutations: Record<string, PendingMutation>;
}
export const own = <T>(
  values: Record<string, T>,
  key: string,
): T | undefined => (Object.hasOwn(values, key) ? values[key] : undefined);
export const operationKey = (id: string) => hash(id);
export const versionOf = ({
  fileId,
  contentGeneration,
  hostFileId,
}: SyncFileGeneration): SyncFileGeneration => ({
  fileId,
  contentGeneration,
  ...(hostFileId ? { hostFileId } : {}),
});
export const sameGeneration = (
  left: SyncFileGeneration | null,
  right: SyncFileGeneration | null,
) =>
  !left || !right
    ? left === right
    : left.fileId === right.fileId &&
      left.contentGeneration === right.contentGeneration &&
      left.hostFileId === right.hostFileId;

export class NativeVaultJournal {
  #uncertain = false;
  version = 0;
  state: VaultJournal = {
    schemaVersion: 2,
    counter: 0,
    paths: Object.create(null),
    mutations: {},
  };
  constructor(
    readonly options: {
      repository: SyncIndexedRepository;
      crypto: SyncVaultStateCrypto;
      vaultId: string;
      devicePublicKey: string;
      rootBinding: string;
    },
  ) {}

  private async expectedAuthority(expected?: NativeVaultAuthority) {
    const authority = await this.authority();
    if (
      expected &&
      (expected.epoch !== authority.epoch ||
        expected.generation !== authority.generation)
    )
      throw new Error("Native apply authority changed before saving");
    return authority;
  }

  async readReceipt(
    operationId: string,
    expected?: NativeVaultAuthority,
  ): Promise<PendingMutation | null> {
    const authority = await this.expectedAuthority(expected);
    const receipt = await new NativeVaultReceipts(this.options).read(
      operationId,
    );
    await this.expectedAuthority(authority);
    return receipt;
  }

  async archive(
    mutation: PendingMutation,
    expected: NativeVaultAuthority,
  ): Promise<void> {
    const authority = await this.expectedAuthority(expected);
    const receipts = new NativeVaultReceipts(this.options);
    let prior = await this.readReceipt(mutation.operation.id, authority);
    if (!prior) {
      const sealed = await receipts.seal(mutation, authority.epoch);
      await this.expectedAuthority(authority);
      try {
        await this.options.repository.records.putIfAbsent(
          operationKey(mutation.operation.id),
          sealed,
        );
      } catch (error) {
        this.#uncertain = true;
        throw error;
      }
      prior = await this.readReceipt(mutation.operation.id, authority);
      if (!prior)
        throw new Error(
          "Native receipt insertion did not produce a readable durable record",
        );
    }
    if (prior && JSON.stringify(prior) !== JSON.stringify(mutation))
      throw new Error(
        "Native receipt conflicts with the completed mutation; retain journal",
      );
    const next = structuredClone(this.state);
    delete next.mutations[operationKey(mutation.operation.id)];
    await this.save(next, authority);
  }

  async authority() {
    if (this.#uncertain)
      throw new Error(
        "Native journal commit outcome is uncertain; reopen before retrying",
      );
    const value = structuredClone(await this.options.crypto.status());
    if (
      value.state !== "unlocked" ||
      value.suite !== "lapis-sync-v1-xchacha20poly1305-schnorr" ||
      value.deviceState !== "active" ||
      value.vaultId !== this.options.vaultId ||
      value.devicePublicKey !== this.options.devicePublicKey ||
      !Number.isSafeInteger(value.currentEpoch) ||
      value.currentEpoch! < 1 ||
      !Number.isSafeInteger(value.membershipGeneration) ||
      value.membershipGeneration! < 0
    )
      throw new Error(
        "Native apply requires an active enrolled unlocked endpoint with supported encryption",
      );
    return {
      epoch: value.currentEpoch!,
      generation: value.membershipGeneration!,
    };
  }

  async load(): Promise<void> {
    const authority = await this.authority();
    const record = await this.options.repository.readState();
    if (!record) {
      await this.save(this.state, authority);
      return;
    }
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
      !["lapis-native-apply-v1", "lapis-native-apply-v2"].includes(
        payload.domain,
      ) ||
      payload.vaultId !== this.options.vaultId ||
      payload.devicePublicKey !== this.options.devicePublicKey ||
      payload.rootBinding !== this.options.rootBinding ||
      payload.version !== record.version ||
      payload.epoch !== record.epoch ||
      !payload.state ||
      !Number.isSafeInteger(payload.state.counter) ||
      payload.state.counter < 0 ||
      !payload.state.paths ||
      !payload.state.mutations
    )
      throw new Error(
        "Native apply journal does not belong to this vault, device and root",
      );
    const legacy =
      payload.domain === "lapis-native-apply-v1" &&
      payload.state.schemaVersion === 1;
    if (
      !legacy &&
      !(
        payload.domain === "lapis-native-apply-v2" &&
        payload.state.schemaVersion === 2
      )
    )
      throw new Error(
        "Unsupported native apply journal format; explicit migration required",
      );
    await this.expectedAuthority(authority);
    this.state = { ...payload.state, schemaVersion: 2 };
    this.version = record.version;
    if (legacy) await this.save(this.state, authority);
  }

  async save(
    next: VaultJournal,
    expected?: NativeVaultAuthority,
  ): Promise<void> {
    if (next.schemaVersion !== 2)
      throw new Error("Unsupported native apply journal write format");
    const authority = await this.expectedAuthority(expected);
    const version = this.version + 1;
    const plaintext = new TextEncoder().encode(
      JSON.stringify({
        domain: "lapis-native-apply-v2",
        vaultId: this.options.vaultId,
        devicePublicKey: this.options.devicePublicKey,
        rootBinding: this.options.rootBinding,
        version,
        epoch: authority.epoch,
        state: next,
      }),
    );
    const sealed = await sealNativeRecord(
      this.options.crypto,
      authority.epoch,
      plaintext,
    );
    const current = await this.authority();
    if (
      current.epoch !== authority.epoch ||
      current.generation !== authority.generation
    )
      throw new Error("Native apply authority changed while saving");
    let accepted: boolean;
    try {
      accepted = await this.options.repository.compareAndSwap(this.version, {
        version,
        epoch: authority.epoch,
        ciphertext: sealed.ciphertext,
      });
    } catch (error) {
      this.#uncertain = true;
      throw error;
    }
    if (!accepted) {
      this.#uncertain = true;
      throw new Error(
        "Native apply journal changed unexpectedly; reopen before retrying",
      );
    }
    this.version = version;
    this.state = structuredClone(next);
  }
}
