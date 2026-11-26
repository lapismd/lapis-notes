// Generated from lapis-app-protocol. Do not edit.
export type Schedule =
  | { kind: "interval"; seconds: number }
  | { kind: "daily"; hour: number; minute: number; timezone: string };
export type JobNetworkGrant = {
  origin: string;
  methods: Array<string>;
  allowPrivateNetwork: boolean;
  credentials: Array<JobCredentialBinding>;
};
export type JobCredentialBinding = {
  id: string;
  header: string;
  prefix: string;
};
export type JobCredentialStatus = {
  id: string;
  configured: boolean;
  unavailableReason: string | null;
};
export type JobPermissions = {
  metadataRead: boolean;
  frontmatterRead: boolean;
  notifications: boolean;
  frontmatterFields: Array<string>;
  network?: Array<JobNetworkGrant>;
};
export type JobDescriptor = {
  id: string;
  title: string;
  description: string;
  entry: string;
  schedule: Schedule;
  permissions: JobPermissions;
};
export type JobConfiguration = {
  fingerprint: string;
  schedule: Schedule;
  permissions: JobPermissions;
  enabled: boolean;
  nativeNotifications: boolean;
};
export type JobPhase =
  | "paused"
  | "ready"
  | "running"
  | "completed"
  | "failed"
  | "interrupted"
  | "transferred";
export type JobRun = {
  id: string;
  occurrence: string;
  localDate: string;
  scheduledAt: number;
  startedAt: number;
  finishedAt: number | null;
  phase: JobPhase;
  error: string | null;
};
export type JobStatus = {
  pluginId: string;
  descriptor: JobDescriptor;
  fingerprint: string;
  configuration: JobConfiguration | null;
  phase: JobPhase;
  runs: Array<JobRun>;
  nextRunAt: number | null;
  unavailableReason: string | null;
  credentials?: Array<JobCredentialStatus>;
};
export type JobTransfer = {
  id: string;
  fromVaultId: string;
  toVaultId: string;
  fromRunner: string;
  toRunner: string;
  pluginId: string;
  jobId: string;
  configuration: JobConfiguration;
  state: unknown;
  lastOccurrence: string | null;
  lastScheduledAt: number;
  notificationKeys: Array<string>;
};
export type JobCommand =
  | { kind: "list" }
  | {
      kind: "storeCredential";
      pluginId: string;
      jobId: string;
      credentialId: string;
      /**
       * None removes the native value; it is never written to the job journal.
       */
      value: string | null;
    }
  | {
      kind: "configure";
      pluginId: string;
      jobId: string;
      configuration: JobConfiguration;
    }
  | { kind: "pause"; pluginId: string; jobId: string }
  | { kind: "runNow"; pluginId: string; jobId: string }
  | { kind: "resolve"; pluginId: string; jobId: string; runId: string }
  | { kind: "fence"; trusted: boolean; safeMode: boolean }
  | {
      kind: "transfer";
      pluginId: string;
      jobId: string;
      toRunner: string;
      toVaultId: string;
    }
  | { kind: "importTransfer"; receipt: JobTransfer };
export type JobSnapshot = {
  revision: number;
  runnerId: string;
  vaultId: string;
  nativeNotificationsAvailable: boolean;
  trusted: boolean;
  safeMode: boolean;
  jobs: Array<JobStatus>;
  transfer: JobTransfer | null;
};
