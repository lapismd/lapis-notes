use crate::services::{Error, Result};
use lapis_app_protocol::{
    ErrorCode,
    database::{
        indexed::records::{FileRecord, MetadataRecord},
        search::{records::SearchDocumentRecord, source::SearchSourceMetadata},
    },
};
use lapis_plugin_services::markdown::{PARSER_VERSION, content_hash};
use serde_json::{Value, json};

pub(super) const PROVIDER: &str = "search:markdown";
const VERSION: &str = "1";

fn chunking() -> Value {
    json!({"targetChars":1200,"breakpointWindowChars":320,"breakpointDecay":0.7})
}
pub(super) fn signature() -> String {
    content_hash(
        &json!({
            "providerId":PROVIDER,"providerVersion":VERSION,"chunking":chunking(),
            "nativeParserVersion":PARSER_VERSION,
        })
        .to_string(),
    )
}
pub(super) fn record(
    file: &FileRecord,
    metadata: &MetadataRecord,
    text: &str,
) -> Result<SearchDocumentRecord> {
    let cache = &metadata.metadata;
    let range = |position: &Value| json!({"start":{"offset":position["start"]["offset"]},"end":{"offset":position["end"]["offset"]}});
    let source = json!({
        "metadataHash":metadata.hash,"providerVersion":VERSION,
        "projectionSignature":signature(),"sourceMtime":file.mtime,"sourceSize":file.size,
        "rawTags":cache["tags"].as_array().into_iter().flatten().map(|tag|tag["tag"].clone()).collect::<Vec<_>>(),
        "frontmatter":cache.get("frontmatter").filter(|v|!v.is_null()).cloned().unwrap_or_else(||json!({})),
        "frontmatterEndOffset":cache.pointer("/frontmatterPosition/end/offset").cloned().unwrap_or(json!(0)),
        "headings":cache["headings"].as_array().into_iter().flatten().map(|h|json!({"heading":h["heading"],"level":h["level"],"position":range(&h["position"])})).collect::<Vec<_>>(),
        "sections":cache["sections"].as_array().into_iter().flatten().map(|s|json!({"type":s["type"],"position":range(&s["position"])})).collect::<Vec<_>>(),
        "chunking":chunking(),
    });
    let source: SearchSourceMetadata = serde_json::from_value(source).map_err(|_| {
        Error::new(
            ErrorCode::InvalidRequest,
            "Native Search source metadata is invalid",
        )
    })?;
    Ok(SearchDocumentRecord {
        path: file.path.clone(),
        source_provider_id: Some(PROVIDER.into()),
        name: file.path.rsplit('/').next().unwrap_or_default().into(),
        extension: file.extension.to_lowercase(),
        checksum: super::checksum::source(text),
        content: text.into(),
        tags: vec![],
        tag_parts: vec![],
        tag_hierarchy: vec![],
        metadata_text: None,
        chunks: None,
        source_metadata: Some(source),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retained_search_manager_envelopes_preserve_fields_except_native_cache_identity() {
        let fixtures: Value = serde_json::from_str(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/fixtures/native-search-manager.json"
        )))
        .unwrap();
        for fixture in fixtures.as_array().unwrap() {
            let text = fixture["text"].as_str().unwrap();
            let file: FileRecord = serde_json::from_value(json!({
                "path":fixture["path"],"normalizedPath":fixture["path"],
                "extension":"md","mtime":fixture["mtime"],"size":fixture["size"],
                "hash":content_hash(text),"indexed":true,
            }))
            .unwrap();
            let metadata = MetadataRecord {
                path: file.path.clone(),
                hash: content_hash(text),
                parser_version: PARSER_VERSION.into(),
                metadata: lapis_plugin_services::markdown::extract_metadata(text),
            };
            assert_eq!(metadata.metadata, fixture["cache"], "{}", fixture["name"]);
            let actual = serde_json::to_value(record(&file, &metadata, text).unwrap()).unwrap();
            let mut expected = fixture["expected"].clone();
            assert_ne!(
                actual["sourceMetadata"]["projectionSignature"],
                expected["sourceMetadata"]["projectionSignature"]
            );
            expected["sourceMetadata"]["projectionSignature"] = json!(signature());
            expected["sourceMetadata"]["metadataHash"] = json!(content_hash(text));
            let expected: SearchDocumentRecord = serde_json::from_value(expected).unwrap();
            assert_eq!(
                actual,
                serde_json::to_value(expected).unwrap(),
                "{}",
                fixture["name"]
            );
        }
    }
}
