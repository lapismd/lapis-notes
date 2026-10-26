import { initTRPC, tracked, TRPCError } from "@trpc/server";
import { z } from "zod/v3";

import {
  LAPIS_SERVER_PROTOCOL_MAJOR,
  ServerHostError,
  type ServerHostErrorCode,
} from "@lapis-notes/api/server-host";
import {
  REMOTE_APP_DATABASE_CONTRACT,
  REMOTE_APP_DATABASE_METHODS,
  type RemoteAppDatabaseMethod,
} from "@lapis-notes/api/app-database";
import { handleLanguageService } from "@lapis-notes/host-services/language-service";

import {
  CSRF_HEADER_NAME,
  SESSION_IDLE_MS,
  assertCsrf,
  assertLoginAllowed,
  assertOrigin,
  clearSessionCookie,
  createLoginSession,
  hashPassword,
  recordFailedLogin,
  sessionCookie,
  verifyPassword,
} from "./auth.ts";
import type { ServerContext } from "./context.ts";
import type { ServerVaultRole } from "./control-database.ts";

const roleRank: Record<ServerVaultRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

function trpcCode(code: ServerHostErrorCode): TRPCError["code"] {
  switch (code) {
    case "UNAUTHENTICATED":
      return "UNAUTHORIZED";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "CONFLICT":
      return "CONFLICT";
    case "PRECONDITION_FAILED":
    case "INVALID_PATH":
      return "BAD_REQUEST";
    case "RATE_LIMITED":
      return "TOO_MANY_REQUESTS";
    default:
      return "PRECONDITION_FAILED";
  }
}

function toTrpcError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof ServerHostError) {
    throw new TRPCError({
      code: trpcCode(error.code),
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

const t = initTRPC.context<ServerContext>().create({
  errorFormatter({ shape, error }) {
    const cause = error.cause;
    return {
      ...shape,
      data: {
        ...shape.data,
        lapisCode: cause instanceof ServerHostError ? cause.code : "INTERNAL",
      },
    };
  },
});

const authenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const mutationSecurity = t.middleware(async ({ ctx, type, next }) => {
  if (type === "mutation")
    assertCsrf(ctx.request, ctx.session!, ctx.config.origin);
  return next();
});

const publicProcedure = t.procedure;
const sessionProcedure = t.procedure.use(authenticated);
const protectedProcedure = sessionProcedure.use(mutationSecurity);

const vaultInput = z.object({ vaultId: z.string().uuid() });

function vaultProcedure(minimum: ServerVaultRole) {
  return protectedProcedure
    .input(vaultInput)
    .use(async ({ ctx, input, next }) => {
      const role = await ctx.control.membership(
        input.vaultId,
        ctx.session.userId,
      );
      if (!role || roleRank[role] < roleRank[minimum]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vault access denied",
        });
      }
      return next({ ctx: { ...ctx, vaultRole: role } });
    });
}

function isReadOnlyDatabaseMethod(method: string): boolean {
  return /^(?:get|list|load|query|search)/u.test(method);
}

function databaseProcedure(method: RemoteAppDatabaseMethod) {
  const readonly = isReadOnlyDatabaseMethod(method);
  const input = vaultInput.extend({
    args: REMOTE_APP_DATABASE_CONTRACT[method].input,
  });
  const execute = async ({
    ctx,
    input,
  }: {
    ctx: ServerContext;
    input: { vaultId: string; args: unknown };
  }) => {
    try {
      return await ctx.runtimes.invoke(input.vaultId, method, input.args);
    } catch (error) {
      toTrpcError(error);
    }
  };
  const procedure = vaultProcedure(readonly ? "viewer" : "editor").input(input);
  return readonly ? procedure.query(execute) : procedure.mutation(execute);
}

function databaseDomain(domain: string) {
  const procedures: Parameters<typeof t.router>[0] = {};
  for (const method of remoteDatabaseMethodsForDomain(domain)) {
    procedures[method] = databaseProcedure(method);
  }
  return t.router(procedures);
}

export function remoteDatabaseMethodsForDomain(
  domain: string,
): RemoteAppDatabaseMethod[] {
  return REMOTE_APP_DATABASE_METHODS.filter(
    (method) => REMOTE_APP_DATABASE_CONTRACT[method].domain === domain,
  );
}

const systemRouter = t.router({
  info: publicProcedure.query(({ ctx }) => ({
    version: "0.0.0",
    buildId: ctx.config.buildId,
    protocolMajor: LAPIS_SERVER_PROTOCOL_MAJOR,
    capabilities: {
      appDatabase: true,
      fileWatch: true,
      languageService: true,
      pluginAssets: true,
      vaultResources: true,
      ai: false,
      terminal: false,
      collaboration: false,
      multiInstance: false,
    },
  })),
});

const authRouter = t.router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().trim().min(1).max(200),
        password: z.string().min(1).max(1_024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertOrigin(ctx.request, ctx.config.origin);
      const address =
        ctx.request.headers.get("x-lapis-remote-address") ?? "unknown";
      const key = await assertLoginAllowed(
        ctx.control,
        input.username,
        address,
      );
      const user = await ctx.control.findUser(input.username);
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        await recordFailedLogin(ctx.control, key);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }
      await ctx.control.clearLoginAttempt(key);
      const created = await createLoginSession(ctx.control, user);
      ctx.responseHeaders.append(
        "Set-Cookie",
        sessionCookie(created.token, ctx.config.secureCookie),
      );
      return {
        user: { id: user.id, username: user.username },
        csrfToken: created.session.csrfToken,
        expiresAt: created.session.expiresAt,
      };
    }),
  current: sessionProcedure.query(({ ctx }) => ({
    user: { id: ctx.session.userId, username: ctx.session.username },
    csrfToken: ctx.session.csrfToken,
    expiresAt: ctx.session.expiresAt,
  })),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.control.revokeSession(ctx.session.id, Date.now());
    ctx.responseHeaders.append(
      "Set-Cookie",
      clearSessionCookie(ctx.config.secureCookie),
    );
    return { ok: true as const };
  }),
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().max(1_024),
        newPassword: z.string().min(12).max(1_024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.control.findUser(ctx.session.username);
      if (
        !user ||
        !(await verifyPassword(input.currentPassword, user.passwordHash))
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is invalid",
        });
      }
      await ctx.control.updatePassword(
        user.id,
        await hashPassword(input.newPassword),
        Date.now(),
      );
      ctx.responseHeaders.append(
        "Set-Cookie",
        clearSessionCookie(ctx.config.secureCookie),
      );
      return { ok: true as const };
    }),
});

const vaultRouter = t.router({
  list: sessionProcedure
    .input(z.object({ includeArchived: z.boolean().default(false) }).optional())
    .query(({ ctx, input }) =>
      ctx.control.listVaults(ctx.session.userId, input?.includeArchived),
    ),
  create: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const vaultId = crypto.randomUUID();
      await ctx.store.create(vaultId);
      try {
        await ctx.control.createVault({
          id: vaultId,
          name: input.name,
          ownerId: ctx.session.userId,
          now: Date.now(),
        });
      } catch (error) {
        await ctx.store.removeCreated(vaultId);
        throw error;
      }
      return { vaultId };
    }),
  open: vaultProcedure("viewer").query(({ ctx, input }) => ({
    vaultId: input.vaultId,
    role: ctx.vaultRole,
  })),
  rename: vaultProcedure("owner")
    .input(vaultInput.extend({ name: z.string().trim().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.control.renameVault(input.vaultId, input.name, Date.now());
      return { ok: true as const };
    }),
  archive: vaultProcedure("owner").mutation(async ({ ctx, input }) => {
    await ctx.control.setVaultArchived(input.vaultId, true, Date.now());
    await ctx.runtimes.close(input.vaultId);
    return { ok: true as const };
  }),
  restore: vaultProcedure("owner").mutation(async ({ ctx, input }) => {
    await ctx.control.setVaultArchived(input.vaultId, false, Date.now());
    return { ok: true as const };
  }),
});

const filesystemRouter = t.router({
  stat: vaultProcedure("viewer")
    .input(vaultInput.extend({ path: z.string().max(8_192) }))
    .query(({ ctx, input }) => ctx.store.stat(input.vaultId, input.path)),
  list: vaultProcedure("viewer")
    .input(vaultInput.extend({ path: z.string().max(8_192) }))
    .query(({ ctx, input }) => ctx.store.list(input.vaultId, input.path)),
  mkdir: vaultProcedure("editor")
    .input(
      vaultInput.extend({
        path: z.string().max(8_192),
        recursive: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.store.mkdir(input.vaultId, input.path, input.recursive);
      return { ok: true as const };
    }),
  rename: vaultProcedure("editor")
    .input(
      vaultInput.extend({
        from: z.string().max(8_192),
        to: z.string().max(8_192),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.store.rename(input.vaultId, input.from, input.to);
      return { ok: true as const };
    }),
  copy: vaultProcedure("editor")
    .input(
      vaultInput.extend({
        from: z.string().max(8_192),
        to: z.string().max(8_192),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.store.copy(input.vaultId, input.from, input.to);
      return { ok: true as const };
    }),
  remove: vaultProcedure("editor")
    .input(
      vaultInput.extend({
        path: z.string().max(8_192),
        recursive: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.store.remove(input.vaultId, input.path, input.recursive);
      return { ok: true as const };
    }),
  trash: vaultProcedure("editor")
    .input(vaultInput.extend({ path: z.string().max(8_192) }))
    .mutation(async ({ ctx, input }) => ({
      path: await ctx.store.trash(input.vaultId, input.path),
    })),
});

const languageRouter = t.router({
  invoke: vaultProcedure("viewer")
    .input(
      vaultInput.extend({
        command: z.string().max(100),
        payload: z.record(z.unknown()),
      }),
    )
    .query(({ input }) => handleLanguageService(input.command, input.payload)),
});

const eventsRouter = t.router({
  vault: sessionProcedure
    .input(vaultInput.extend({ lastEventId: z.string().max(200).optional() }))
    .subscription(async function* ({ ctx, input, signal }) {
      const role = await ctx.control.membership(
        input.vaultId,
        ctx.session.userId,
      );
      if (!role)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vault access denied",
        });
      let queued;
      try {
        queued = ctx.events.replay(input.vaultId, input.lastEventId);
      } catch (error) {
        toTrpcError(error);
      }
      const queue = [...queued];
      let wake: (() => void) | undefined;
      const unsubscribe = ctx.events.subscribe(input.vaultId, (event) => {
        queue.push(event);
        wake?.();
        wake = undefined;
      });
      try {
        while (!signal?.aborted) {
          if (
            !(await ctx.control.sessionIsActive(
              ctx.session.id,
              Date.now(),
              SESSION_IDLE_MS,
            ))
          ) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Session revoked",
            });
          }
          const event = queue.shift();
          if (event) {
            if (event.kind === "resync-required") {
              throw new TRPCError({
                code: "PRECONDITION_FAILED",
                message: "resync-required",
              });
            }
            yield tracked(event.id, event);
            continue;
          }
          await new Promise<void>((resolve) => {
            let timeout: ReturnType<typeof setTimeout>;
            const finish = () => {
              clearTimeout(timeout);
              signal?.removeEventListener("abort", finish);
              if (wake === finish) wake = undefined;
              resolve();
            };
            wake = finish;
            signal?.addEventListener("abort", finish, { once: true });
            timeout = setTimeout(finish, 30_000);
            if (signal?.aborted) finish();
          });
        }
      } finally {
        unsubscribe();
      }
    }),
});

export const appRouter = t.router({
  system: systemRouter,
  auth: authRouter,
  vault: vaultRouter,
  filesystem: filesystemRouter,
  database: t.router({
    lifecycle: databaseDomain("lifecycle"),
    metadata: databaseDomain("metadata"),
    search: databaseDomain("search"),
    history: databaseDomain("history"),
    notifications: databaseDomain("notifications"),
    memory: databaseDomain("memory"),
    tasks: databaseDomain("tasks"),
    projections: databaseDomain("projections"),
  }),
  language: languageRouter,
  events: eventsRouter,
});

export type AppRouter = typeof appRouter;
export { CSRF_HEADER_NAME };
