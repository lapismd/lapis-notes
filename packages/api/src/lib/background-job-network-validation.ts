import { z } from "zod/v3";

const slot = z.string().regex(/^[a-z0-9][a-z0-9-]{0,127}$/u);
const unique = <T>(values: T[]) => new Set(values).size === values.length;

export const jobCredentialStatusSchema = z
  .object({
    id: slot,
    configured: z.boolean(),
    unavailableReason: z.string().max(1024).nullable(),
  })
  .strict();

export const jobNetworkSchema = z
  .array(
    z
      .object({
        origin: z.string().max(4096),
        methods: z
          .array(
            z.enum([
              "GET",
              "HEAD",
              "POST",
              "PUT",
              "PATCH",
              "DELETE",
              "OPTIONS",
            ]),
          )
          .min(1)
          .max(7)
          .refine(unique, "Duplicate network method"),
        allowPrivateNetwork: z.boolean(),
        credentials: z
          .array(
            z
              .object({
                id: slot,
                header: z.enum(["authorization", "x-api-key"]),
                prefix: z.enum(["", "Bearer ", "Basic "]),
              })
              .strict(),
          )
          .max(8)
          .refine(
            (values) => unique(values.map((v) => v.id)),
            "Duplicate credential binding",
          ),
      })
      .strict()
      .refine((value) => {
        try {
          const url = new URL(value.origin);
          return (
            value.origin === url.origin &&
            !url.username &&
            !url.password &&
            (url.protocol === "https:" ||
              (url.protocol === "http:" && value.allowPrivateNetwork))
          );
        } catch {
          return false;
        }
      }, "Choose an exact HTTPS origin; private HTTP requires explicit approval"),
  )
  .max(8)
  .refine(
    (values) => unique(values.map((v) => v.origin)),
    "Duplicate network origin",
  );
