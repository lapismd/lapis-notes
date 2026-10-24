#![cfg(unix)]

use lapis_app_protocol::{
    AttachClient, ClientDescriptor, ExpectedVersion, Outcome, PROTOCOL_MAJOR, Reply, Request,
    VaultCommand, VaultValue,
};
use lapis_server::http::VERSION_HEADER;
use std::{path::Path, process::Stdio, time::Duration};
use tokio::{
    io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader},
    process::{Child, Command},
    time::timeout,
};
use uuid::Uuid;

const TOKEN: &str = "isolated-cold-server-owner-token-0123456789";

async fn start(config: &Path) -> (Child, String) {
    let mut child = Command::new(env!("CARGO_BIN_EXE_lapis-server"))
        .arg(config)
        .arg("127.0.0.1:0")
        .env("LAPIS_SERVER_TOKEN", TOKEN)
        .env_remove("LAPIS_SERVER_ORIGIN")
        .env_remove("LAPIS_SERVER_DATA_ROOT")
        .env_remove("LAPIS_SERVER_BOOTSTRAP_USERNAME")
        .env_remove("LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE")
        .env_remove("LAPIS_SERVER_INSECURE_COOKIE")
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .kill_on_drop(true)
        .spawn()
        .unwrap();
    let mut output = BufReader::new(child.stdout.take().unwrap()).lines();
    let line = timeout(Duration::from_secs(10), output.next_line())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let address = line
        .strip_prefix("Lapis file service listening on ")
        .unwrap();
    (child, format!("http://{address}"))
}

#[tokio::test]
async fn sigterm_has_a_bounded_network_drain_for_a_stalled_file_consumer() {
    let root = tempfile::tempdir().unwrap();
    let vault = root.path().join("vault");
    std::fs::create_dir(&vault).unwrap();
    let file = std::fs::File::create(vault.join("large.bin")).unwrap();
    file.set_len(64 * 1024 * 1024).unwrap();
    let id = Uuid::new_v4();
    let config = root.path().join("server.json");
    std::fs::write(
        &config,
        serde_json::to_vec(
            &serde_json::json!({"vaults": [{"id": id, "name": "Slow reader", "root": vault}]}),
        )
        .unwrap(),
    )
    .unwrap();
    let client = reqwest::Client::new();
    let (mut child, base) = start(&config).await;
    let attached = attach(&client, &base, id).await;
    let mut socket = tokio::net::TcpStream::connect(base.strip_prefix("http://").unwrap())
        .await
        .unwrap();
    socket.write_all(format!("GET /api/v3/clients/{}/files/large.bin HTTP/1.1\r\nHost: localhost\r\nAuthorization: Bearer {TOKEN}\r\nx-lapis-protocol: 3\r\n\r\n", attached.client_id).as_bytes()).await.unwrap();
    let mut headers = Vec::new();
    timeout(Duration::from_secs(10), async {
        while !headers.ends_with(b"\r\n\r\n") {
            headers.push(socket.read_u8().await.unwrap());
        }
    })
    .await
    .unwrap();
    assert!(headers.starts_with(b"HTTP/1.1 200"));
    // Retain the socket without consuming the large response body.
    signal(&child).await;
    assert!(
        timeout(Duration::from_secs(12), child.wait())
            .await
            .expect("server waited for the network consumer after its native leave gate passed")
            .unwrap()
            .success()
    );
    drop(socket);
}
async fn signal(child: &Child) {
    let status = Command::new("kill")
        .arg("-TERM")
        .arg(child.id().unwrap().to_string())
        .status()
        .await
        .unwrap();
    assert!(status.success());
}
async fn attach(client: &reqwest::Client, base: &str, vault: Uuid) -> ClientDescriptor {
    client
        .post(format!("{base}/api/v3/vaults/{vault}/clients"))
        .bearer_auth(TOKEN)
        .header(VERSION_HEADER, PROTOCOL_MAJOR)
        .json(&AttachClient {
            protocol_version: PROTOCOL_MAJOR,
        })
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json()
        .await
        .unwrap()
}
async fn execute(
    client: &reqwest::Client,
    base: &str,
    attached: &ClientDescriptor,
    command: VaultCommand,
) -> Reply {
    client
        .post(format!(
            "{base}/api/v3/clients/{}/commands",
            attached.client_id
        ))
        .bearer_auth(TOKEN)
        .header(VERSION_HEADER, PROTOCOL_MAJOR)
        .json(&Request {
            protocol_version: PROTOCOL_MAJOR,
            request_id: Uuid::new_v4(),
            vault_id: attached.vault_id,
            generation: attached.generation,
            command,
        })
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap()
}

#[tokio::test]
async fn cold_binary_preserves_files_and_blocks_sigterm_until_dirty_claim_is_resolved() {
    let root = tempfile::tempdir().unwrap();
    let id = Uuid::new_v4();
    let vault = root.path().join("vault");
    std::fs::create_dir(&vault).unwrap();
    let config = root.path().join("server.json");
    std::fs::write(
        &config,
        serde_json::to_vec(
            &serde_json::json!({"vaults": [{"id": id, "name": "Cold Notes", "root": vault}]}),
        )
        .unwrap(),
    )
    .unwrap();
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .unwrap();
    let (mut child, base) = start(&config).await;
    let attached = attach(&client, &base, id).await;
    let saved = execute(
        &client,
        &base,
        &attached,
        VaultCommand::WriteText {
            path: "note.md".into(),
            text: "# persisted 💎".into(),
            expected: ExpectedVersion::Missing {},
        },
    )
    .await;
    assert!(matches!(saved.outcome, Outcome::Ok { .. }));
    let editor = match execute(
        &client,
        &base,
        &attached,
        VaultCommand::OpenEditor {
            path: "note.md".into(),
        },
    )
    .await
    .outcome
    {
        Outcome::Ok {
            value: VaultValue::Editor { editor_id },
        } => editor_id,
        other => panic!("{other:?}"),
    };
    assert!(matches!(
        execute(
            &client,
            &base,
            &attached,
            VaultCommand::MarkDirty {
                editor_id: editor,
                revision: 1
            }
        )
        .await
        .outcome,
        Outcome::Ok { .. }
    ));
    signal(&child).await;
    assert!(
        timeout(Duration::from_millis(250), child.wait())
            .await
            .is_err()
    );
    assert!(matches!(
        execute(&client, &base, &attached, VaultCommand::Status {})
            .await
            .outcome,
        Outcome::Ok { .. }
    ));
    assert!(matches!(
        execute(
            &client,
            &base,
            &attached,
            VaultCommand::DiscardEditor { editor_id: editor }
        )
        .await
        .outcome,
        Outcome::Ok { .. }
    ));
    signal(&child).await;
    assert!(
        timeout(Duration::from_secs(5), child.wait())
            .await
            .unwrap()
            .unwrap()
            .success()
    );
    let (mut child, base) = start(&config).await;
    let fresh = attach(&client, &base, id).await;
    assert_ne!(fresh.generation, attached.generation);
    assert!(
        matches!(execute(&client, &base, &fresh, VaultCommand::ReadText { path: "note.md".into() }).await.outcome, Outcome::Ok { value: VaultValue::Text { snapshot } } if snapshot.text == "# persisted 💎")
    );
    let stale = client
        .post(format!(
            "{base}/api/v3/clients/{}/commands",
            attached.client_id
        ))
        .bearer_auth(TOKEN)
        .header(VERSION_HEADER, PROTOCOL_MAJOR)
        .json(&Request {
            protocol_version: PROTOCOL_MAJOR,
            request_id: Uuid::new_v4(),
            vault_id: id,
            generation: attached.generation,
            command: VaultCommand::Status {},
        })
        .send()
        .await
        .unwrap();
    assert_eq!(stale.status(), 403);
    signal(&child).await;
    assert!(
        timeout(Duration::from_secs(5), child.wait())
            .await
            .unwrap()
            .unwrap()
            .success()
    );
}
