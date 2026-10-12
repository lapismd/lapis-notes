import type {
  NostrSignerAccount,
  NostrPrivateKeyImportRequest,
  NostrSignerBroker,
  NostrSignerBrokerContext,
  NostrUnsignedEvent,
  NostrSignedEvent,
} from "@lapis-notes/api";

type DesktopSignerInvoke = (
  command: string,
  payload?: Record<string, unknown>,
) => Promise<unknown>;

let registeredBroker: NostrSignerBroker | undefined;

export async function createDenoNostrSignerBroker(
  invoke: DesktopSignerInvoke,
): Promise<NostrSignerBroker> {
  const opened = await invoke("desktop_nostr_signer_open_session");
  if (
    !opened ||
    typeof opened !== "object" ||
    typeof (opened as { sessionToken?: unknown }).sessionToken !== "string"
  ) {
    throw new Error("Deno Nostr signer did not create a native session");
  }
  const sessionToken = (opened as { sessionToken: string }).sessionToken;
  const call = <T>(
    command: string,
    context: NostrSignerBrokerContext,
    payload: Record<string, unknown> = {},
  ): Promise<T> =>
    invoke(command, { sessionToken, context, ...payload }) as Promise<T>;

  return {
    listAccounts: (context) =>
      call<NostrSignerAccount[]>("desktop_nostr_signer_list_accounts", context),
    requestProfileCreation: (context, request) =>
      call<NostrSignerAccount>("desktop_nostr_signer_create_profile", context, {
        request,
      }),
    connectRemoteSigner: (context, request) =>
      call<NostrSignerAccount>("desktop_nostr_signer_connect_remote", context, {
        request,
      }),
    importPrivateKey: (context, request: NostrPrivateKeyImportRequest) =>
      call<NostrSignerAccount>(
        "desktop_nostr_signer_import_private_key",
        context,
        { request },
      ),
    getPublicKey: (context, accountId) =>
      call<string>("desktop_nostr_signer_get_public_key", context, {
        accountId,
      }),
    signEvent: (context, accountId, event) =>
      call<NostrSignedEvent>("desktop_nostr_signer_sign_event", context, {
        accountId,
        event: cloneEvent(event),
      }),
    nip44Encrypt: (context, accountId, pubkey, plaintext) =>
      call<string>("desktop_nostr_signer_nip44_encrypt", context, {
        accountId,
        pubkey,
        plaintext,
      }),
    nip44Decrypt: (context, accountId, pubkey, ciphertext) =>
      call<string>("desktop_nostr_signer_nip44_decrypt", context, {
        accountId,
        pubkey,
        ciphertext,
      }),
    close: (context, accountId) =>
      call<void>("desktop_nostr_signer_close", context, { accountId }),
  };
}

export function setDenoNostrSignerBroker(
  broker: NostrSignerBroker | undefined,
): void {
  registeredBroker = broker;
}

export function getDenoNostrSignerBroker(): NostrSignerBroker | undefined {
  return registeredBroker;
}

const cloneEvent = (event: NostrUnsignedEvent): NostrUnsignedEvent => ({
  kind: event.kind,
  created_at: event.created_at,
  content: event.content,
  tags: event.tags.map((tag) => [...tag]),
});
