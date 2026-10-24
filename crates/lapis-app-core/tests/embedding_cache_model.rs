use lapis_app_core::{database::Database, embedding::host::NativeEmbeddingHost};
use lapis_app_protocol::database::search::{
    embedding::SearchEmbeddingRuntimePhase as Phase, records::SearchDocumentRecord,
};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::{
    future::Future,
    path::{Path, PathBuf},
    task::Poll,
    time::Duration,
};
use uuid::Uuid;

fn fixture() -> Value {
    serde_json::from_str(include_str!(
        "../../../packages/api/src/lib/__tests__/fixtures/search-semantic-model.json"
    ))
    .unwrap()
}
fn document(fixture: &Value) -> SearchDocumentRecord {
    let text = fixture["queries"][0]["text"].as_str().unwrap();
    serde_json::from_value(json!({"path":"Note.md","name":"Note","extension":"md","checksum":"one","content":text,"tags":[],"tagParts":[],"tagHierarchy":[],"chunks":[{"id":"Note.md#0","text":text,"startOffset":0,"endOffset":text.encode_utf16().count()}]})).unwrap()
}
async fn open(root: &Path, vault: Uuid, remote: bool, fixture: &Value) -> Database {
    let host = NativeEmbeddingHost::managed(&root.join("cache")).unwrap();
    let db = Database::open_with_embeddings(&root.join("profile"), vault, host)
        .await
        .unwrap();
    db.configure_search_embedding_provider(Some(serde_json::from_value(json!({"kind":"transformers-js","modelId":fixture["modelId"],"revision":fixture["revision"],"dtype":"q8","dimensions":384,"normalize":true,"allowRemoteModels":remote})).unwrap())).await.unwrap();
    db
}
async fn assert_vector(db: &Database, fixture: &Value) {
    let row = db.get_search_document("Note.md").await.unwrap().unwrap();
    let embedding = row.chunks.unwrap().pop().unwrap().embedding.unwrap();
    let status = serde_json::to_value(&embedding).unwrap();
    assert_eq!(status["status"], "ready", "{:?}", status.get("error"));
    let vector = embedding.vector.unwrap();
    assert_eq!(vector.len(), 384);
    for (actual, expected) in vector
        .iter()
        .zip(fixture["queries"][0]["vector"].as_array().unwrap())
    {
        assert!((actual - expected.as_f64().unwrap()).abs() < 0.00001);
    }
}

#[tokio::test]
#[ignore = "Requires qualified ONNX files; run pnpm test:search:onnx (or --download)"]
async fn managed_model_cache_prepares_after_detach_and_reopens_offline_in_a_cold_process() {
    let fixture = fixture();
    if let Some(directory) = std::env::var_os("LAPIS_TEST_CACHE_CHILD") {
        let root = PathBuf::from(directory);
        let vault = Uuid::parse_str(&std::env::var("LAPIS_TEST_CACHE_VAULT").unwrap()).unwrap();
        let db = open(&root, vault, false, &fixture).await;
        db.upsert_search_document(document(&fixture)).await.unwrap();
        assert_vector(&db, &fixture).await;
        db.close().await.unwrap();
        return;
    }
    let root = tempfile::tempdir().unwrap();
    std::fs::create_dir(root.path().join("cache")).unwrap();
    let remote = std::env::var("LAPIS_TEST_ONNX_CACHE_DOWNLOAD").as_deref() == Ok("1");
    if !remote {
        seed_qualified_assets(&root.path().join("cache"), &fixture);
    }
    let vault = Uuid::new_v4();
    let db = open(root.path(), vault, remote, &fixture).await;
    let mut changes = db.subscribe_to_changes();
    let mut pending = Box::pin(db.upsert_search_document(document(&fixture)));
    std::future::poll_fn(|context| {
        assert!(pending.as_mut().poll(context).is_pending());
        Poll::Ready(())
    })
    .await;
    drop(pending);
    let mut saw_progress = false;
    tokio::time::timeout(Duration::from_secs(300), async {
        loop {
            tokio::select! {
                event = changes.recv() => {
                    assert_eq!(event.unwrap().paths, ["Note.md"]);
                    break;
                }
                _ = tokio::time::sleep(Duration::from_millis(5)) => {
                    let status = db.get_search_embedding_runtime_status().unwrap().unwrap();
                    let progress = status.progress.unwrap();
                    assert!((0.0..=1.0).contains(&progress));
                    if status.phase == Phase::Downloading && progress > 0.0 && progress < 1.0 {
                        saw_progress = true;
                    }
                }
            }
        }
    })
    .await
    .expect("accepted cache preparation and inference must complete");
    if remote {
        assert!(
            saw_progress,
            "native download progress remains observable after detach"
        );
    }
    assert_vector(&db, &fixture).await;
    assert_eq!(
        db.get_search_embedding_runtime_status()
            .unwrap()
            .unwrap()
            .phase,
        Phase::Ready
    );
    db.close().await.unwrap();
    let files: Vec<_> = std::fs::read_dir(root.path().join("cache"))
        .unwrap()
        .collect();
    assert_eq!(
        files.len(),
        7,
        "six verified assets and the installation lease only"
    );
    let child = std::process::Command::new(std::env::current_exe().unwrap())
        .args([
            "--ignored",
            "--exact",
            "managed_model_cache_prepares_after_detach_and_reopens_offline_in_a_cold_process",
            "--nocapture",
        ])
        .env("LAPIS_TEST_CACHE_CHILD", root.path())
        .env("LAPIS_TEST_CACHE_VAULT", vault.to_string())
        .status()
        .unwrap();
    assert!(
        child.success(),
        "offline cold-process cache must retain actual model inference"
    );
}

fn seed_qualified_assets(cache: &Path, fixture: &Value) {
    let model = PathBuf::from(std::env::var_os("LAPIS_TEST_ONNX_MODEL").unwrap());
    for asset in fixture["assets"].as_array().unwrap() {
        let source = model.join(asset["file"].as_str().unwrap());
        let name = source.file_name().unwrap().to_str().unwrap();
        let bytes = std::fs::read(&source).unwrap();
        let hash = format!("{:x}", Sha256::digest(&bytes));
        assert_eq!(hash, asset["sha256"].as_str().unwrap());
        assert_eq!(bytes.len() as u64, asset["bytes"].as_u64().unwrap());
        std::fs::write(cache.join(format!("{hash}-{name}")), bytes).unwrap();
    }
    let runtime = PathBuf::from(std::env::var_os("LAPIS_TEST_ONNX_RUNTIME").unwrap());
    let bytes = std::fs::read(&runtime).unwrap();
    let hash = format!("{:x}", Sha256::digest(&bytes));
    let name = runtime.file_name().unwrap().to_str().unwrap();
    std::fs::write(cache.join(format!("{hash}-{name}")), bytes).unwrap();
}
