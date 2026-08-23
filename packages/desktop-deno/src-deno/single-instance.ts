const APP_URL_PROTOCOLS = new Set(["lapis:", "lapis-notes:"]);
const MAX_ACTIVATION_BYTES = 32_768;

type InstanceEndpoint = {
  port: number;
  token: string;
};

type ActivationMessage = {
  token: string;
  urls: string[];
};

export function normalizeAppUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 8_192) return null;
  try {
    const url = new URL(value);
    return APP_URL_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function collectAppUrls(args: readonly string[]): string[] {
  return args.flatMap((value) => {
    const url = normalizeAppUrl(value);
    return url ? [url] : [];
  });
}

export function parseActivationMessage(
  raw: string,
  expectedToken: string,
): string[] | null {
  if (raw.length > MAX_ACTIVATION_BYTES) return null;
  try {
    const message = JSON.parse(raw) as Partial<ActivationMessage>;
    if (message.token !== expectedToken || !Array.isArray(message.urls)) {
      return null;
    }
    return collectAppUrls(message.urls);
  } catch {
    return null;
  }
}

export class DenoActivationQueue {
  readonly #pending: string[];
  #onLaterLaunch: ((urls: readonly string[]) => void) | null = null;

  constructor(initialUrls: readonly string[] = []) {
    this.#pending = collectAppUrls(initialUrls);
  }

  acceptLaterLaunch(urls: readonly string[]): void {
    const accepted = collectAppUrls(urls);
    this.#pending.push(...accepted);
    this.#onLaterLaunch?.(accepted);
  }

  onLaterLaunch(listener: (urls: readonly string[]) => void): () => void {
    this.#onLaterLaunch = listener;
    return () => {
      if (this.#onLaterLaunch === listener) this.#onLaterLaunch = null;
    };
  }

  takePending(): string[] {
    return this.#pending.splice(0);
  }
}

async function readBoundedConnection(conn: Deno.Conn): Promise<string | null> {
  const decoder = new TextDecoder();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size <= MAX_ACTIVATION_BYTES) {
    const chunk = new Uint8Array(
      Math.min(4_096, MAX_ACTIVATION_BYTES + 1 - size),
    );
    const read = await conn.read(chunk);
    if (read === null) break;
    const value = chunk.subarray(0, read);
    chunks.push(value);
    size += read;
    if (value.includes(10)) break;
  }
  if (size > MAX_ACTIVATION_BYTES) return null;
  const merged = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return decoder.decode(merged).split("\n", 1)[0] ?? "";
}

function endpointPaths(dataDir: string) {
  const separator = dataDir.endsWith("/") ? "" : "/";
  const prefix = `${dataDir}${separator}desktop-instance`;
  return {
    lock: `${prefix}.lock`,
    endpoint: `${prefix}.json`,
    temporaryEndpoint: `${prefix}.${Deno.pid}.tmp`,
  };
}

async function readEndpoint(path: string): Promise<InstanceEndpoint> {
  const value = JSON.parse(await Deno.readTextFile(path)) as InstanceEndpoint;
  if (
    !Number.isSafeInteger(value.port) ||
    value.port < 1 ||
    value.port > 65_535 ||
    typeof value.token !== "string" ||
    value.token.length < 16 ||
    value.token.length > 200
  ) {
    throw new Error("Invalid Deno desktop activation endpoint");
  }
  return value;
}

async function forwardToPrimary(
  endpointPath: string,
  urls: readonly string[],
): Promise<boolean> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    let conn: Deno.Conn | undefined;
    try {
      const endpoint = await readEndpoint(endpointPath);
      conn = await Deno.connect({
        hostname: "127.0.0.1",
        port: endpoint.port,
      });
      const payload = new TextEncoder().encode(
        `${JSON.stringify({ token: endpoint.token, urls })}\n`,
      );
      await conn.write(payload);
      const response = await readBoundedConnection(conn);
      return response === "ok";
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    } finally {
      conn?.close();
    }
  }
  return false;
}

export type DenoSingleInstanceHost = {
  queue: DenoActivationQueue;
  close(): Promise<void>;
};

export type DenoSingleInstanceResult =
  | { primary: true; host: DenoSingleInstanceHost }
  | { primary: false; delivered: boolean };

export async function acquireDenoSingleInstance(
  dataDir: string,
  args: readonly string[],
): Promise<DenoSingleInstanceResult> {
  await Deno.mkdir(dataDir, { recursive: true, mode: 0o700 });
  const paths = endpointPaths(dataDir);
  const lockFile = await Deno.open(paths.lock, {
    create: true,
    read: true,
    write: true,
    mode: 0o600,
  });
  if (!(await lockFile.tryLock(true))) {
    lockFile.close();
    return {
      primary: false,
      delivered: await forwardToPrimary(paths.endpoint, collectAppUrls(args)),
    };
  }

  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  await Deno.writeTextFile(
    paths.temporaryEndpoint,
    `${JSON.stringify({ port, token })}\n`,
    { mode: 0o600 },
  );
  await Deno.rename(paths.temporaryEndpoint, paths.endpoint);

  const queue = new DenoActivationQueue(args);
  let closed = false;
  const serve = async () => {
    try {
      for await (const conn of listener) {
        void (async () => {
          try {
            const raw = await readBoundedConnection(conn);
            const urls =
              raw === null ? null : parseActivationMessage(raw, token);
            if (urls === null) {
              await conn.write(new TextEncoder().encode("denied\n"));
              return;
            }
            queue.acceptLaterLaunch(urls);
            await conn.write(new TextEncoder().encode("ok\n"));
          } finally {
            conn.close();
          }
        })();
      }
    } catch (error) {
      if (!closed) console.error("[desktop-instance] listener failed", error);
    }
  };
  void serve();

  return {
    primary: true,
    host: {
      queue,
      async close() {
        if (closed) return;
        closed = true;
        listener.close();
        await Deno.remove(paths.endpoint).catch(() => undefined);
        await lockFile.unlock().catch(() => undefined);
        lockFile.close();
      },
    },
  };
}
