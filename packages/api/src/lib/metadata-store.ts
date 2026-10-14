/** Host persistence only; implementations retain authorization and lifecycle ownership. */
export interface HostMetadataStore {
  getMeta<T = unknown>(key: string): Promise<T | undefined>;
  setMeta(key: string, value: unknown): Promise<void>;
  transactMeta(
    transaction: AppDatabaseMetaTransaction,
  ): Promise<AppDatabaseMetaTransactionResult>;
}

export interface AppDatabaseMetaCheck {
  key: string;
  exists?: boolean;
  value?: unknown;
}

export interface AppDatabaseMetaMutation {
  key: string;
  value?: unknown;
  delete?: boolean;
}

export interface AppDatabaseMetaTransaction {
  checks?: AppDatabaseMetaCheck[];
  mutations: AppDatabaseMetaMutation[];
}

export interface AppDatabaseMetaTransactionResult {
  applied: boolean;
}
