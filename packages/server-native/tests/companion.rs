use serde_json::{Value, json};
use std::{
    fs,
    io::{BufRead, BufReader, Write},
    os::unix::{fs::PermissionsExt, net::UnixStream},
    path::Path,
    process::{Child, Command, Stdio},
    time::{Duration, Instant},
};
use uuid::Uuid;

struct Host {
    root: tempfile::TempDir,
    process: Child,
    stream: BufReader<UnixStream>,
}
impl Host {
    fn start() -> Self {
        let root = tempfile::tempdir().unwrap();
        fs::set_permissions(root.path(), fs::Permissions::from_mode(0o700)).unwrap();
        let socket = root.path().join("host.sock");
        let mut process = Command::new(env!("CARGO_BIN_EXE_lapis-notes-native"))
            .args([
                "--socket",
                socket.to_str().unwrap(),
                "--data-root",
                root.path().canonicalize().unwrap().to_str().unwrap(),
            ])
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let deadline = Instant::now() + Duration::from_secs(5);
        let stream = loop {
            if let Ok(stream) = UnixStream::connect(&socket) {
                break stream;
            }
            assert!(
                process.try_wait().unwrap().is_none(),
                "native startup failed"
            );
            assert!(Instant::now() < deadline);
            std::thread::sleep(Duration::from_millis(10));
        };
        stream
            .set_read_timeout(Some(Duration::from_secs(20)))
            .unwrap();
        assert_eq!(
            fs::metadata(&socket).unwrap().permissions().mode() & 0o777,
            0o600
        );
        Self {
            root,
            process,
            stream: BufReader::new(stream),
        }
    }
    fn request(&mut self, action: Value) -> Value {
        self.raw(json!({"version":1,"id":"test", "action":action}))
    }
    fn raw(&mut self, request: Value) -> Value {
        writeln!(self.stream.get_mut(), "{request}").unwrap();
        let mut line = String::new();
        assert!(self.stream.read_line(&mut line).unwrap() > 0);
        serde_json::from_str(&line).unwrap()
    }
    fn vault(&self, description: &str) -> String {
        let id = Uuid::new_v4().to_string();
        let root = self.content(&id);
        fs::create_dir_all(&root).unwrap();
        jj(&root, &["git", "init", "--colocate"]);
        fs::write(root.join("note.md"), description).unwrap();
        jj(&root, &["describe", "-m", description]);
        id
    }
    fn content(&self, vault: &str) -> std::path::PathBuf {
        self.root.path().join("vaults").join(vault).join("content")
    }
    fn bind(&mut self, scope: &str, vault: &str, generation: u64) -> Value {
        self.request(json!({"method":"bind","scope":scope,"vault":vault,"generation":generation,"source":"original"}))
    }
    fn history(&mut self, scope: &str, operation: &str, data: Value) -> Value {
        self.request(json!({"method":"history","scope":scope,"operation":operation,"frame":json!({"version":1,"data":data}).to_string()}))
    }
    fn close(&mut self) {
        assert_eq!(
            self.request(json!({"method":"shutdown"}))["frame"],
            "closed"
        );
        let deadline = Instant::now() + Duration::from_secs(5);
        loop {
            if let Some(status) = self.process.try_wait().unwrap() {
                assert!(status.success());
                break;
            }
            assert!(Instant::now() < deadline);
            std::thread::sleep(Duration::from_millis(10));
        }
        assert!(!self.root.path().join("host.sock").exists());
    }
}
impl Drop for Host {
    fn drop(&mut self) {
        let _ = self.process.kill();
        let _ = self.process.wait();
    }
}
fn inner(response: Value) -> Value {
    assert!(response["error"].is_null(), "{response}");
    serde_json::from_str(response["frame"].as_str().unwrap()).unwrap()
}
fn jj(root: &Path, args: &[&str]) {
    let output = Command::new("jj")
        .current_dir(root)
        .args([
            "--no-pager",
            "--config",
            "user.name='Fixture'",
            "--config",
            "user.email='fixture@invalid'",
        ])
        .args(args)
        .env("JJ_CONFIG", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn real_history_is_pinned_and_scoped_to_each_managed_vault_and_caller() {
    let mut host = Host::start();
    let first = host.vault("first");
    let second = host.vault("second");
    for (scope, vault) in [
        ("owner-a", &first),
        ("owner-a", &second),
        ("owner-b", &first),
    ] {
        assert!(host.bind(scope, vault, 1)["error"].is_null());
    }
    let operation =
        inner(host.history("owner-a", "heads", json!({"vault":first})))["data"]["heads"][0].clone();
    let handle = inner(host.history(
        "owner-a",
        "open",
        json!({"vault":first,"operation":operation}),
    ))["data"]
        .clone();
    let deadline = Instant::now() + Duration::from_secs(15);
    loop {
        let status =
            inner(host.history("owner-a", "status", json!({"vault":first,"handle":handle})));
        if status["data"]["state"] == "ready" {
            assert_eq!(status["data"]["data"]["operation"], operation);
            break;
        }
        assert_eq!(status["data"]["state"], "preparing");
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(10));
    }
    assert!(
        !host.history("owner-b", "status", json!({"vault":first,"handle":handle}))["error"]
            .is_null()
    );
    assert!(
        !host.history("owner-a", "status", json!({"vault":second,"handle":handle}))["error"]
            .is_null()
    );
    jj(
        &host.content(&first),
        &["describe", "-m", "later operation"],
    );
    let status = inner(host.history("owner-a", "status", json!({"vault":first,"handle":handle})));
    assert_eq!(status["data"]["data"]["operation"], operation);
    let query = jj_history_service::local::Request::Graph(
        jj_history_service::local::GraphRequest::Log {
            revset: "all()".into(),
            workspace: None,
            user_email: "fixture@invalid".into(),
            at_time_millis: 0,
        },
        jj_history_service::local::GraphWindow {
            limit: 8,
            after: None,
        },
    );
    let pinned = inner(host.history(
        "owner-a",
        "read",
        json!({"vault":first,"handle":handle,"query":query}),
    ));
    assert!(pinned.to_string().contains("first"));
    assert!(!pinned.to_string().contains("later operation"));
    assert!(!host.bind("owner-a", &first, 2)["error"].is_null());
    assert_eq!(
        host.request(json!({"method":"revoke","scope":"owner-a"}))["frame"],
        "revoked"
    );
    assert!(
        !host.history("owner-a", "status", json!({"vault":first,"handle":handle}))["error"]
            .is_null()
    );
    assert!(host.bind("owner-a", &first, 2)["error"].is_null());
    assert!(
        !host.history("owner-a", "status", json!({"vault":first,"handle":handle}))["error"]
            .is_null()
    );
    assert!(host.history("owner-b", "heads", json!({"vault":first}))["error"].is_null());
    host.close();
}
#[test]
fn missing_or_replaced_sources_are_denied_and_reads_never_initialize_history() {
    let mut host = Host::start();
    let missing = Uuid::new_v4().to_string();
    fs::create_dir_all(host.content(&missing)).unwrap();
    assert!(!host.bind("owner", &missing, 1)["error"].is_null());
    assert!(!host.content(&missing).join(".jj").exists());
    let vault = host.vault("original");
    assert!(host.bind("owner", &vault, 1)["error"].is_null());
    fs::rename(
        host.content(&vault).join(".jj"),
        host.content(&vault).join("retired-jj"),
    )
    .unwrap();
    jj(&host.content(&vault), &["git", "init", "--colocate"]);
    assert!(!host.history("owner", "heads", json!({"vault":vault}))["error"].is_null());
    host.close();
}
#[test]
fn versions_unknown_methods_and_inner_authority_fail_closed() {
    let mut host = Host::start();
    assert!(
        !host.raw(json!({"version":2,"id":"v2","action":{"method":"ping"}}))["error"].is_null()
    );
    let vault = host.vault("data");
    assert!(host.bind("owner", &vault, 1)["error"].is_null());
    assert!(!host.history("owner", "initialize", json!({"vault":vault}))["error"].is_null());
    assert!(
        !host.history("owner", "heads", json!({"vault":vault,"root":"/tmp"}))["error"].is_null()
    );
    assert!(!host.bind("owner", "../outside", 1)["error"].is_null());
    host.close();
}
#[test]
fn oversized_outer_frames_retire_the_private_connection() {
    let mut host = Host::start();
    let frame = vec![b'x'; 1024 * 1024 + 1];
    let _ = host.stream.get_mut().write_all(&frame);
    let mut line = String::new();
    assert!(host.stream.read_line(&mut line).unwrap_or(0) == 0);
}

#[test]
fn parent_disconnect_drains_preparation_and_removes_the_socket() {
    let mut host = Host::start();
    let vault = host.vault("disconnect");
    assert!(host.bind("owner", &vault, 1)["error"].is_null());
    let operation =
        inner(host.history("owner", "heads", json!({"vault":vault})))["data"]["heads"][0].clone();
    inner(host.history(
        "owner",
        "open",
        json!({"vault":vault,"operation":operation}),
    ));
    host.stream
        .get_mut()
        .shutdown(std::net::Shutdown::Both)
        .unwrap();
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        if let Some(status) = host.process.try_wait().unwrap() {
            assert!(status.success());
            break;
        }
        assert!(Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(10));
    }
    assert!(!host.root.path().join("host.sock").exists());
}
