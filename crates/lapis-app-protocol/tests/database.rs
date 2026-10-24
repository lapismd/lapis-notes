use lapis_app_protocol::database::{MetaEntry, MetaPage, MetaTransaction};
use serde_json::json;

#[test]
fn metadata_dtos_retain_optional_and_null_values_and_camelcase_pagination() {
    let tx: MetaTransaction = serde_json::from_value(json!({"mutations":[
        {"key":"null","value":null},{"key":"delete"}
    ]}))
    .unwrap();
    assert_eq!(tx.mutations[0].value, Some(json!(null)));
    assert_eq!(tx.mutations[1].value, None);
    assert_eq!(
        serde_json::to_value(&tx).unwrap()["mutations"][0]["value"],
        json!(null)
    );
    assert!(
        serde_json::to_value(&tx).unwrap()["mutations"][1]
            .get("value")
            .is_none()
    );
    for field in ["sql", "path", "vaultId"] {
        let mut value = json!({"mutations":[]});
        value[field] = json!("untrusted");
        assert!(serde_json::from_value::<MetaTransaction>(value).is_err());
    }
    assert_eq!(
        serde_json::to_value(MetaPage {
            entries: vec![MetaEntry {
                key: "key".into(),
                value: json!(null)
            }],
            next_cursor: Some("last".into())
        })
        .unwrap(),
        json!({"entries":[{"key":"key","value":null}],"nextCursor":"last"})
    );
}
