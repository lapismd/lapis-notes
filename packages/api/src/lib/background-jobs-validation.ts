import { z } from "zod/v3";
import type { JobDescriptor } from "./native-background-jobs-protocol";
import {
  jobCredentialStatusSchema,
  jobNetworkSchema,
} from "./background-job-network-validation";

const boundedText = z.string().max(1024);
const identity = z.string().uuid();
const timestamp = z.number().int().safe();
const fingerprint = z.string().regex(/^[a-f0-9]{64}$/);
const phase = z.enum([
  "paused",
  "ready",
  "running",
  "completed",
  "failed",
  "interrupted",
  "transferred",
]);
export const jobScheduleSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("interval"),
      seconds: z.number().int().min(60).max(2_678_400),
    })
    .strict(),
  z
    .object({
      kind: z.literal("daily"),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      timezone: z.string().min(1).max(128),
    })
    .strict(),
]);
const permissions = z
  .object({
    metadataRead: z.boolean(),
    frontmatterRead: z.boolean(),
    notifications: z.boolean(),
    frontmatterFields: z.array(z.string().min(1).max(128)).max(32),
    network: jobNetworkSchema.optional(),
  })
  .strict();
export const backgroundJobDescriptorSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,64}$/),
    title: z.string().min(1).max(128),
    description: boundedText,
    entry: z
      .string()
      .min(1)
      .max(256)
      .refine(
        (value) =>
          value.endsWith(".js") &&
          !/[\\\0:?#]/u.test(value) &&
          value
            .split("/")
            .every((part) => part && part !== "." && part !== ".."),
      ),
    schedule: jobScheduleSchema,
    permissions,
  })
  .strict();
const configuration = z
  .object({
    fingerprint,
    schedule: jobScheduleSchema,
    permissions,
    enabled: z.boolean(),
    nativeNotifications: z.boolean(),
  })
  .strict();
const run = z
  .object({
    id: identity,
    occurrence: boundedText,
    localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    scheduledAt: timestamp,
    startedAt: timestamp,
    finishedAt: timestamp.nullable(),
    phase,
    error: boundedText.nullable(),
  })
  .strict();
const transfer = z
  .object({
    id: identity,
    fromVaultId: identity,
    toVaultId: identity,
    fromRunner: identity,
    toRunner: identity,
    pluginId: z.string().min(1).max(128),
    jobId: z.string().min(1).max(64),
    configuration,
    state: z.unknown(),
    lastOccurrence: boundedText.nullable(),
    notificationKeys: z.array(z.string().max(128)).max(128),
    lastScheduledAt: timestamp,
  })
  .strict()
  .refine(
    (value) => Object.hasOwn(value, "state"),
    "Transfer state is required",
  )
  .transform((value) => ({ ...value, state: value.state }));
export const jobSnapshotSchema = z
  .object({
    revision: z.number().int().min(0).safe(),
    runnerId: identity,
    vaultId: identity,
    nativeNotificationsAvailable: z.boolean(),
    trusted: z.boolean(),
    safeMode: z.boolean(),
    transfer: transfer.nullable(),
    jobs: z
      .array(
        z
          .object({
            pluginId: z.string().min(1).max(128),
            descriptor: backgroundJobDescriptorSchema,
            fingerprint,
            configuration: configuration.nullable(),
            phase,
            runs: z.array(run).max(16),
            nextRunAt: timestamp.nullable(),
            unavailableReason: boundedText.nullable(),
            credentials: z.array(jobCredentialStatusSchema).max(64).optional(),
          })
          .strict(),
      )
      .max(64),
  })
  .strict();

export function isBackgroundJobDescriptor(
  value: unknown,
): value is JobDescriptor {
  return backgroundJobDescriptorSchema.safeParse(value).success;
}
